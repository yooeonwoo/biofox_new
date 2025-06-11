import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const shopId = Number(params.id);
  if (Number.isNaN(shopId)) {
    return NextResponse.json({ ok: false, message: 'invalid id' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('admin_shop_list')
    .select('*')
    .eq('id', shopId)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data });
} 