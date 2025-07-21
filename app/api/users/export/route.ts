import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// CSV 헤더 정의
const CSV_HEADERS = [
  'id',
  'email',
  'name',
  'role',
  'status',
  'shop_name',
  'region',
  'created_at',
  'approved_at'
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 & 권한 확인 (관리자만 허용)
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 쿼리 파라미터 파싱 (users/route.ts와 동일한 로직)
    const params = request.nextUrl.searchParams;
    const status = params.get('status');
    const role = params.get('role');
    const search = params.get('search');
    const hasRelationship = params.get('hasRelationship');
    const createdFrom = params.get('createdFrom');
    const createdTo = params.get('createdTo');

    let query = supabase
      .from('profiles')
      .select('*');

    if (status) query = query.eq('status', status);
    if (role) query = query.eq('role', role);

    if (search && search.length >= 2) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,shop_name.ilike.%${search}%`);
    }

    if (hasRelationship === 'true') {
      query = query.not('shop_relationships', 'is', null);
    } else if (hasRelationship === 'false') {
      query = query.is('shop_relationships', null);
    }

    if (createdFrom) query = query.gte('created_at', createdFrom);
    if (createdTo) query = query.lte('created_at', createdTo);

    // 최대 5000개 제한
    query = query.limit(5000);

    const { data: users, error } = await query;
    if (error) {
      console.error('CSV 내보내기 쿼리 오류:', error);
      return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
    }

    // CSV 문자열 생성
    const rows = (users || []).map((u) => [
      u.id,
      u.email,
      u.name,
      u.role,
      u.status,
      u.shop_name,
      u.region,
      u.created_at,
      u.approved_at
    ]);

    const csvLines = [CSV_HEADERS.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

    const filename = `users_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvLines, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    console.error('CSV 내보내기 오류:', err);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
} 