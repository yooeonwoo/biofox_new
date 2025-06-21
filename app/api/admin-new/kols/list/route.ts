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
      shops!shops_kol_id_fkey(shop_name)
    `)
    .order('name');
  
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching KOLs with shops:', error);
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  // 첫 번째 샵명 또는 "샵 없음" 표시
  const processedData = data?.map(kol => ({
    id: kol.id,
    name: kol.name,
    shop_name: kol.shops?.[0]?.shop_name || '샵 없음',
    shop_count: kol.shops?.length || 0
  })) || [];

  return NextResponse.json({ ok: true, data: processedData });
}