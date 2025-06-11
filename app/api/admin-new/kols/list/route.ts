import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get('search');

  let query = supabaseAdmin.from('kols').select('id,name').order('name');
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, data });
} 