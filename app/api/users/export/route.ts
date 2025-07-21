import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stringify } from 'csv-stringify/sync';

// CSV 헤더 매핑
const csvHeaders = {
  id: 'ID',
  name: '이름',
  email: '이메일',
  role: '역할',
  status: '상태',
  shop_name: '상점명',
  region: '지역',
  commission_rate: '수수료율(%)',
  total_subordinates: '총 하급자 수',
  active_subordinates: '활성 하급자 수',
  naver_place_link: '네이버 플레이스 링크',
  approved_at: '승인일시',
  created_at: '생성일시',
  updated_at: '수정일시'
};

// 역할 한글 변환
const roleLabels: Record<string, string> = {
  admin: '관리자',
  kol: 'KOL',
  ol: 'OL',
  shop_owner: '상점 운영자'
};

// 상태 한글 변환
const statusLabels: Record<string, string> = {
  pending: '대기중',
  approved: '승인됨',
  rejected: '거절됨',
  suspended: '정지됨'
};

// 사용자 데이터를 CSV용으로 변환
function transformUserForCsv(user: any) {
  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role: roleLabels[user.role] || user.role,
    status: statusLabels[user.status] || user.status,
    shop_name: user.shop_name || '',
    region: user.region || '',
    commission_rate: user.commission_rate || '',
    total_subordinates: user.total_subordinates || 0,
    active_subordinates: user.active_subordinates || 0,
    naver_place_link: user.naver_place_link || '',
    approved_at: user.approved_at ? new Date(user.approved_at).toLocaleString('ko-KR') : '',
    created_at: user.created_at ? new Date(user.created_at).toLocaleString('ko-KR') : '',
    updated_at: user.updated_at ? new Date(user.updated_at).toLocaleString('ko-KR') : ''
  };
}

// 사용자 목록 CSV 다운로드 API
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // 개발 환경에서는 인증 체크 우회
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // 현재 사용자 인증 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // 현재 사용자의 프로필 확인
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !currentUserProfile) {
        return NextResponse.json(
          { success: false, error: 'Profile not found' },
          { status: 404 }
        );
      }

      // admin 권한 확인
      if (currentUserProfile.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    } else {
      console.log('[DEV] Authentication bypassed for GET /api/users/export');
    }

    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');

    // 기본 쿼리 구성
    let query = supabase
      .from('profiles')
      .select(`
        id, name, email, role, status, shop_name, region, 
        commission_rate, total_subordinates, active_subordinates,
        naver_place_link, approved_at, created_at, updated_at
      `);

    // 필터 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,shop_name.ilike.%${search}%`);
    }

    if (role) {
      const roles = role.split(',').map(r => r.trim());
      if (roles.length === 1) {
        query = query.eq('role', roles[0]);
      } else {
        query = query.in('role', roles);
      }
    }

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }

    if (createdFrom) {
      query = query.gte('created_at', createdFrom);
    }

    if (createdTo) {
      query = query.lte('created_at', createdTo);
    }

    // 정렬 적용
    query = query.order('created_at', { ascending: false });

    const { data: users, error: fetchError } = await query;

    if (fetchError) {
      console.error('User export fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users for export' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found for export' },
        { status: 404 }
      );
    }

    // 데이터 변환
    const transformedUsers = users.map(transformUserForCsv);

    // CSV 생성
    const csv = stringify(transformedUsers, {
      header: true,
      columns: csvHeaders,
      cast: {
        date: (value) => value ? new Date(value).toLocaleString('ko-KR') : ''
      }
    });

    // 파일명 생성 (한국 시간 기준)
    const now = new Date();
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const timestamp = kstTime.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    const filename = `users_export_${timestamp}.csv`;

    // CSV 응답 반환
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// HEAD 요청 처리 (다운로드 가능 여부 확인)
export async function HEAD(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // 개발 환경에서는 인증 체크 우회
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // 인증 확인
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return new Response(null, { status: 401 });
      }

      // 권한 확인
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !currentUserProfile || currentUserProfile.role !== 'admin') {
        return new Response(null, { status: 403 });
      }
    } else {
      console.log('[DEV] Authentication bypassed for HEAD /api/users/export');
    }

    // 다운로드 가능 상태 반환
    return new Response(null, { 
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Export HEAD API Error:', error);
    return new Response(null, { status: 500 });
  }
} 