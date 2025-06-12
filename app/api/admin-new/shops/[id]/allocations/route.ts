import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const shopId = Number(params.id);
  if (Number.isNaN(shopId)) return NextResponse.json({ ok: false, message: 'invalid id' }, { status: 400 });
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || '1');
  const size = Number(url.searchParams.get('size') || '20');
  const from = (page - 1) * size;
  const to = from + size - 1;

  const { data, error, count } = await supabaseAdmin
    .from('shop_device_allocations')
    .select('id, allocated_at, tier_fixed_amount, user_input_deduct, pay_to_kol, note')
    .eq('shop_id', shopId)
    .order('allocated_at', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data, total: count });
} 