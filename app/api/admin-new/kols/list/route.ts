import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get('search');

  let query = supabaseAdmin
    .from('kols')
    .select(`
      id,
      name,
      shop_name,
      shops!shops_kol_id_fkey(id, shop_name)
    `)
    .order('name');
  
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching KOLs with shops:', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  // 각 KOL-샵 쌍을 개별 항목으로 평면화
  const flatData: Array<{
    id: number;
    kol_id: number;
    name: string;
    kol_shop_name: string;
    shop_name: string;
    shop_id: number;
  }> = [];

  data?.forEach(kol => {
    if (kol.shops && kol.shops.length > 0) {
      kol.shops.forEach((shop: any) => {
        flatData.push({
          id: flatData.length + 1, // 고유 ID 생성
          kol_id: kol.id,
          name: kol.name,
          kol_shop_name: kol.shop_name, // KOL의 대표 샵명
          shop_name: shop.shop_name,
          shop_id: shop.id
        });
      });
    } else {
      // 샵이 없는 KOL도 표시
      flatData.push({
        id: flatData.length + 1,
        kol_id: kol.id,
        name: kol.name,
        kol_shop_name: kol.shop_name,
        shop_name: '샵 없음',
        shop_id: 0
      });
    }
  });

  return NextResponse.json({ ok: true, data: flatData });
}