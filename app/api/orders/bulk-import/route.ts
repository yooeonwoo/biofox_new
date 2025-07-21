import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 간단한 CSV 파서 함수
function parseCSV(csvString: string, hasHeader: boolean = true): any[] {
  const lines = csvString.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = hasHeader ? lines[0].split(',').map(h => h.trim()) : [];
  const dataStartIndex = hasHeader ? 1 : 0;
  
  return lines.slice(dataStartIndex).map(line => {
    const values = line.split(',').map(v => v.trim());
    if (hasHeader) {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    }
    return values;
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const { file_type, data: fileData, options } = body;

    if (!fileData || !options) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // Base64 디코딩
    const buffer = Buffer.from(fileData, 'base64');
    let parsedData: any[] = [];

    // CSV 파싱만 지원 (일단)
    if (file_type === 'csv') {
      const csvString = buffer.toString('utf-8');
      parsedData = parseCSV(csvString, !options.skip_first_row);
    } else {
      return NextResponse.json({ error: '현재 CSV 파일만 지원됩니다.' }, { status: 400 });
    }

    // 모든 Shop 정보 미리 조회
    const { data: allShops } = await supabase
      .from('profiles')
      .select('id, email, shop_name, role')
      .in('role', ['kol', 'ol', 'shop_owner']);

    const shopMap = new Map();
    allShops?.forEach(shop => {
      shopMap.set(shop.email, shop);
      shopMap.set(shop.shop_name, shop);
    });

    // 결과 추적
    const results = {
      total_rows: parsedData.length,
      success_count: 0,
      error_count: 0,
      total_amount: 0,
      total_commission: 0,
      errors: [] as any[],
      preview: [] as any[]
    };

    // 각 행 처리
    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      
      try {
        // 날짜 파싱
        let orderDate = row[options.date_column];
        if (!orderDate) {
          throw new Error('주문 날짜가 없습니다.');
        }

        // 날짜 형식 변환
        if (options.date_format === 'YYYY-MM-DD') {
          // 이미 올바른 형식
        } else if (options.date_format === 'DD/MM/YYYY') {
          const parts = orderDate.split('/');
          orderDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (options.date_format === 'MM/DD/YYYY') {
          const parts = orderDate.split('/');
          orderDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }

        // Shop 찾기
        const shopIdentifier = row[options.shop_identifier_column];
        const shop = shopMap.get(shopIdentifier);
        
        if (!shop) {
          throw new Error(`Shop을 찾을 수 없습니다: ${shopIdentifier}`);
        }

        // 금액 파싱
        const amountStr = row[options.amount_column] || '0';
        const amount = parseFloat(amountStr.replace(/,/g, ''));
        if (isNaN(amount)) {
          throw new Error('유효하지 않은 금액입니다.');
        }

        // 제품 정보 파싱
        const items = [{
          product_name: row[options.product_column] || '제품',
          quantity: parseInt(row[options.quantity_column] || '1') || 1,
          unit_price: amount / (parseInt(row[options.quantity_column] || '1') || 1),
          subtotal: amount
        }];

        // 소속 관계 조회 및 수수료 계산
        const { data: relationship } = await supabase
          .from('shop_relationships')
          .select(`
            parent:profiles!parent_id(
              id,
              role,
              commission_rate
            )
          `)
          .eq('shop_owner_id', shop.id)
          .lte('started_at', orderDate)
          .or(`ended_at.is.null,ended_at.gte.${orderDate}`)
          .single();

        let commission_rate = 0;
        let commission_amount = 0;

        if (relationship?.parent) {
          if (relationship.parent.role === 'kol') {
            commission_rate = relationship.parent.commission_rate || 30;
          } else if (relationship.parent.role === 'ol') {
            commission_rate = relationship.parent.commission_rate || 20;
          }
          commission_amount = amount * (commission_rate / 100);
        }

        // 주문 생성
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            shop_id: shop.id,
            order_date: orderDate,
            order_number: row[options.order_number_column] || null,
            total_amount: amount,
            commission_rate,
            commission_amount,
            commission_status: 'calculated',
            order_status: 'completed',
            is_self_shop_order: shop.role === 'kol' || shop.role === 'ol',
            notes: `일괄 등록 (${new Date().toLocaleDateString()})`,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (orderError) {
          throw new Error('주문 생성 실패');
        }

        // 주문 아이템 생성
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(items.map(item => ({
            order_id: newOrder.id,
            ...item,
            created_at: new Date().toISOString()
          })));

        if (itemsError) {
          // 주문 롤백
          await supabase.from('orders').delete().eq('id', newOrder.id);
          throw new Error('주문 아이템 생성 실패');
        }

        results.success_count++;
        results.total_amount += amount;
        results.total_commission += commission_amount;

        // 처음 5개 미리보기
        if (results.preview.length < 5) {
          results.preview.push({
            shop_name: shop.shop_name,
            order_date: orderDate,
            total_amount: amount,
            commission_amount
          });
        }

      } catch (error: any) {
        results.error_count++;
        results.errors.push({
          row: i + 1,
          error: error.message,
          data: row
        });
      }
    }

    return NextResponse.json({
      success: results.success_count > 0,
      summary: results
    });

  } catch (error) {
    console.error('일괄 등록 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
