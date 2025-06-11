import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * 공통 JSON 에러 헬퍼
 */
function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/admin/shops
 *   ?search=&kolId=&status=
 *   전문점 목록 조회
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const kolId = searchParams.get('kolId');
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('shops')
    .select(
      `
        id,
        shop_name,
        region,
        status,
        kol_id,
        contract_date,
        kols(name),
        device_count:shop_device_allocations(count),
        latest_allocation:shop_device_allocations(order:allocated_at.desc,limit:1).allocated_at
      `
    );

  if (search) {
    query = query.ilike('shop_name', `%${search}%`);
  }
  if (kolId) {
    query = query.eq('kol_id', kolId);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('id', { ascending: false });
  if (error) {
    return jsonError(error.message, 500);
  }
  return NextResponse.json({ success: true, shops: data });
}

/**
 * POST /api/admin/shops
 * 전문점 + (선택) 기기 추가 생성
 * Body JSON: {
 *   kolId: number,
 *   ownerName: string,
 *   shopName: string,
 *   createdBy: number,
 *   region?: string,
 *   contractDate?: string (YYYY-MM-DD),
 *   commissionOverridePct?: number,
 *   deviceUserInputDeduct?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      kolId,
      ownerName,
      shopName,
      createdBy,
      region = null,
      contractDate = null,
      commissionOverridePct = null,
      deviceUserInputDeduct = null,
    } = body;

    if (!kolId || !ownerName || !shopName || !createdBy) {
      return jsonError('kolId, ownerName, shopName, createdBy는 필수입니다.');
    }

    const { data, error } = await supabaseAdmin.rpc('fn_create_shop_with_allocation', {
      p_kol_id: kolId,
      p_owner_name: ownerName,
      p_shop_name: shopName,
      p_created_by: createdBy,
      p_region: region,
      p_contract_date: contractDate,
      p_commission_override_pct: commissionOverridePct,
      p_device_user_input_deduct: deviceUserInputDeduct,
    });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ success: true, shopId: data?.[0]?.shop_id });
  } catch (err) {
    console.error('Shop POST error', err);
    return jsonError((err as Error).message, 500);
  }
}
