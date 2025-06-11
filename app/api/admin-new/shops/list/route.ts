import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/admin-new/shops/list
 *   ?search=&kolId=&status=&page=&size=
 * 관리자(New) 전문점 목록 조회
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const kolId = searchParams.get('kolId');
  const status = searchParams.get('status');
  const page = Number(searchParams.get('page') || '1');
  const size = Number(searchParams.get('size') || '20');

  // base query
  let query = supabaseAdmin
    .from('shops')
    .select(
      `id, shop_name, region, status, contract_date, 
       kols:kol_id ( name ),
       kol_device_accumulators!inner(total_device_cnt)`,
      { count: 'exact' }
    );

  if (search) query = query.ilike('shop_name', `%${search}%`);
  if (kolId) query = query.eq('kol_id', kolId);
  if (status) query = query.eq('status', status);

  const from = (page - 1) * size;
  const to = from + size - 1;
  query = query.range(from, to).order('id', { ascending: false });

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  const rows = (data || []).map((d: any) => ({
    id: d.id,
    shopName: d.shop_name,
    region: d.region,
    status: d.status,
    contractDate: d.contract_date,
    kolName: d.kols?.name ?? null,
    deviceCnt: d.kol_device_accumulators?.total_device_cnt ?? 0,
  }));

  return NextResponse.json({ ok: true, data: rows, total: count });
} 