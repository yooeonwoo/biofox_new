import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 관리자용 사용자 목록 조회 API
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

      // 현재 사용자의 프로필 확인 (admin 권한 체크)
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
      console.log('[DEV] Authentication bypassed for GET /api/admin/users');
    }

    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // 관리자용은 더 많이 로드
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';

    // 페이지네이션 계산
    const offset = (page - 1) * limit;

    // 기본 쿼리 구성
    let query = supabase
      .from('profiles')
      .select(`
        id, name, email, role, status, shop_name, region, 
        commission_rate, total_subordinates, active_subordinates,
        naver_place_link, approved_at, created_at, updated_at
      `, { count: 'exact' });

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

    // 정렬 및 페이지네이션 적용
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Admin user fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // 총 페이지 수 계산
    const totalPages = Math.ceil((count || 0) / limit);

    // 관리자용 응답 형식 (기존 코드와 호환성 유지)
    return NextResponse.json({
      success: true,
      users: users || [], // 기존 코드에서 users 필드를 기대하므로
      data: users || [],
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Admin GET API Error:', error);
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