import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/admin/shops/:id/allocations
 *   ?page=1&limit=20
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const shopId = Number(params.id);
  if (!shopId) return jsonError('유효하지 않은 shopId');

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') || '1');
  const limit = Number(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('shop_device_allocations')
    .select('*', { count: 'exact' })
    .eq('shop_id', shopId)
    .order('allocated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ success: true, allocations: data, total: count, page, limit });
}
