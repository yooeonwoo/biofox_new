import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/admin/shops/:id/device-allocation
 * Body: { userInputDeduct?: number, createdBy: number }
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const shopId = Number(params.id);
    if (!shopId) return jsonError('유효하지 않은 shopId');

    const body = await request.json();
    const { userInputDeduct = 0, createdBy } = body;
    if (!createdBy) return jsonError('createdBy는 필수입니다.');

    // shop → kol 매핑 조회
    const { data: shopRow, error: shopErr } = await supabaseAdmin
      .from('shops')
      .select('kol_id')
      .eq('id', shopId)
      .maybeSingle();
    if (shopErr) return jsonError(shopErr.message, 500);
    if (!shopRow) return jsonError('Shop not found', 404);

    const { error } = await supabaseAdmin.from('shop_device_allocations').insert({
      shop_id: shopId,
      kol_id: shopRow.kol_id,
      user_input_deduct: userInputDeduct,
      created_by: createdBy,
    });

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Device allocation POST error', err);
    return jsonError((err as Error).message, 500);
  }
}
