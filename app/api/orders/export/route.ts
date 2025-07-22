import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 체크
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const shop_id = searchParams.get('shop_id')

    // 주문 데이터 조회
    let query = supabase
      .from('orders')
      .select(`
        *,
        shop:profiles!shop_id (
          name,
          shop_name,
          email
        ),
        order_items (
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `)
      .order('order_date', { ascending: false })

    if (date_from) {
      query = query.gte('order_date', date_from)
    }
    if (date_to) {
      query = query.lte('order_date', date_to)
    }
    if (shop_id) {
      query = query.eq('shop_id', shop_id)
    }

    const { data: orders, error } = await query

    if (error) throw error

    // CSV 포맷으로 변환
    if (format === 'csv') {
      const headers = [
        '주문일',
        '주문번호',
        '샵명',
        '원장님',
        '이메일',
        '제품명',
        '수량',
        '단가',
        '소계',
        '총액',
        '수수료율(%)',
        '수수료',
        '상태',
        '본인샵여부',
        '비고'
      ]

      const rows = []
      
      for (const order of orders || []) {
        if (order.order_items?.length > 0) {
          // 각 아이템별로 행 생성
          for (const item of order.order_items) {
            rows.push([
              order.order_date,
              order.order_number || '',
              order.shop?.shop_name || '',
              order.shop?.name || '',
              order.shop?.email || '',
              item.product_name || '',
              item.quantity || 0,
              item.unit_price || 0,
              item.subtotal || 0,
              order.total_amount || 0,
              order.commission_rate || 0,
              order.commission_amount || 0,
              order.order_status || 'completed',
              order.is_self_shop_order ? 'Y' : 'N',
              order.notes || ''
            ])
          }
        } else {
          // 아이템이 없는 경우
          rows.push([
            order.order_date,
            order.order_number || '',
            order.shop?.shop_name || '',
            order.shop?.name || '',
            order.shop?.email || '',
            '',
            '',
            '',
            '',
            order.total_amount || 0,
            order.commission_rate || 0,
            order.commission_amount || 0,
            order.order_status || 'completed',
            order.is_self_shop_order ? 'Y' : 'N',
            order.notes || ''
          ])
        }
      }

      // CSV 문자열 생성
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(','))
      ].join('\n')

      // BOM 추가 (한글 엑셀 호환)
      const bom = '\uFEFF'
      const csvWithBom = bom + csvContent

      return new NextResponse(csvWithBom, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="orders_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // JSON 형식 (추후 Excel 지원 시 사용)
    return NextResponse.json({ data: orders })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export orders' },
      { status: 500 }
    )
  }
}