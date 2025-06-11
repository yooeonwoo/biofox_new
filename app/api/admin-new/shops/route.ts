import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      kolId,
      ownerName,
      shopName,
      region = null,
      contractDate = null,
      withDevice = false,
      deduct = 0,
      createdBy,
    } = body;

    if (!kolId || !ownerName || !shopName || !createdBy) {
      return jsonError('kolId, ownerName, shopName, createdBy는 필수입니다.');
    }

    // 1) shops insert
    const { data: shopInsert, error: shopErr } = await supabaseAdmin
      .from('shops')
      .insert({
        kol_id: kolId,
        owner_name: ownerName,
        shop_name: shopName,
        region,
        contract_date: contractDate,
      })
      .select('id')
      .single();

    if (shopErr || !shopInsert) {
      return jsonError(shopErr?.message || 'shop insert failed', 500);
    }

    const shopId = shopInsert.id;

    // 2) optional device allocation
    if (withDevice) {
      const { error: allocErr } = await supabaseAdmin.rpc('fn_add_device_allocation', {
        p_shop_id: shopId,
        p_kol_id: kolId,
        p_user_id: createdBy,
        p_deduct: deduct ?? 0,
      });
      if (allocErr) {
        return jsonError(`allocation failed: ${allocErr.message}`, 500);
      }
    }

    return NextResponse.json({ ok: true, shopId });
  } catch (e: any) {
    return jsonError(e.message || 'unknown error', 500);
  }
} 