import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/admin/shops/:id
 *   전문점 상세 + 누적 기기수 + 최근 거래 합계 (향후)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const shopId = Number(params.id);
  if (!shopId) return jsonError('유효하지 않은 shopId');

  // 기본 + 누적 기기수 + 최근 거래 합계(placeholder)
  const { data, error } = await supabaseAdmin
    .from('shops')
    .select(
      `
        id,
        shop_name,
        owner_name,
        region,
        status,
        kol_id,
        commission_override_pct,
        contract_date,
        created_at,
        kols(name),
        device_count:shop_device_allocations(count),
        latest_allocation:shop_device_allocations(order:allocated_at.desc,limit:1).allocated_at
      `
    )
    .eq('id', shopId)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError('Shop not found', 404);

  return NextResponse.json({ success: true, shop: data });
}

/**
 * PATCH /api/admin/shops/:id
 *   { ownerName?, shopName?, region?, status?, commissionOverridePct? }
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const shopId = Number(params.id);
    if (!shopId) return jsonError('유효하지 않은 shopId');

    const body = await request.json();
    const {
      ownerName,
      shopName,
      region,
      status,
      commissionOverridePct,
    } = body;

    const updatePayload: Record<string, unknown> = {};
    if (ownerName !== undefined) updatePayload.owner_name = ownerName;
    if (shopName !== undefined) updatePayload.shop_name = shopName;
    if (region !== undefined) updatePayload.region = region;
    if (status !== undefined) updatePayload.status = status;
    if (commissionOverridePct !== undefined)
      updatePayload.commission_override_pct = commissionOverridePct;

    if (Object.keys(updatePayload).length === 0) {
      return jsonError('수정할 필드가 없습니다.');
    }

    const { error } = await supabaseAdmin.from('shops').update(updatePayload).eq('id', shopId);
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Shop PATCH error', err);
    return jsonError((err as Error).message, 500);
  }
}
