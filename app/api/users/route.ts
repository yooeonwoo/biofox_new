import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// 사용자 생성 데이터 검증 스키마
const createUserSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  name: z.string().min(2, '이름은 최소 2글자 이상이어야 합니다'),
  role: z.enum(['admin', 'kol', 'ol', 'shop_owner'], {
    errorMap: () => ({ message: '유효하지 않은 역할입니다' })
  }),
  shop_name: z.string().min(2, '상점명은 최소 2글자 이상이어야 합니다'),
  region: z.string().optional(),
  commission_rate: z.number().min(0, '수수료율은 0% 이상이어야 합니다').max(100, '수수료율은 100% 이하여야 합니다').optional()
});

// 입력 데이터 정리 함수 (XSS 방지)
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .trim(); // 공백 제거
}

// 사용자 목록 조회 API
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
      console.log('[DEV] Authentication bypassed for GET /api/users');
    }

    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');

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

    if (createdFrom) {
      query = query.gte('created_at', createdFrom);
    }

    if (createdTo) {
      query = query.lte('created_at', createdTo);
    }

    // 정렬 및 페이지네이션 적용
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('User fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // 총 페이지 수 계산
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
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
    console.error('GET API Error:', error);
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

// 사용자 생성 API
export async function POST(request: NextRequest) {
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
    let currentUserId = 'dev-admin-user';
    
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
      
      currentUserId = user.id;
    } else {
      console.log('[DEV] Authentication bypassed for POST /api/users');
    }

    // 요청 본문 파싱
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 입력 데이터 유효성 검증
    const validation = createUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // 이메일 중복 확인
    const { data: existingUser, error: emailCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', validatedData.email)
      .maybeSingle();

    if (emailCheckError) {
      console.error('Email check error:', emailCheckError);
      return NextResponse.json(
        { success: false, error: 'Failed to check email availability' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    // 입력 데이터 정리 (XSS 방지)
    const sanitizedData = {
      email: validatedData.email.toLowerCase(),
      name: sanitizeInput(validatedData.name),
      role: validatedData.role,
      shop_name: sanitizeInput(validatedData.shop_name),
      region: validatedData.region ? sanitizeInput(validatedData.region) : null,
      commission_rate: validatedData.commission_rate || null
    };

    // Supabase Auth를 통해 사용자 초대
    const { data: authUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      sanitizedData.email,
      {
        data: {
          name: sanitizedData.name,
          role: sanitizedData.role
        }
      }
    );

    if (inviteError) {
      console.error('Auth invite error:', inviteError);
      return NextResponse.json(
        { success: false, error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    // 프로필 생성
    const { data: newUser, error: profileCreateError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: sanitizedData.email,
        name: sanitizedData.name,
        role: sanitizedData.role,
        shop_name: sanitizedData.shop_name,
        region: sanitizedData.region,
        commission_rate: sanitizedData.commission_rate,
        status: 'pending', // 초대된 사용자는 승인 대기 상태
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id, name, email, role, status, shop_name, region, 
        commission_rate, total_subordinates, active_subordinates,
        naver_place_link, approved_at, created_at, updated_at
      `)
      .single();

    if (profileCreateError) {
      console.error('Profile creation error:', profileCreateError);
      
      // Auth 사용자 생성은 성공했지만 프로필 생성이 실패한 경우 정리 시도
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        table_name: 'profiles',
        record_id: authUser.user.id,
        action: 'INSERT',
        user_id: currentUserId,
        old_values: null,
        new_values: {
          email: sanitizedData.email,
          name: sanitizedData.name,
          role: sanitizedData.role,
          shop_name: sanitizedData.shop_name
        },
        changed_fields: ['email', 'name', 'role', 'shop_name', 'region', 'commission_rate'],
        metadata: {
          operation: 'user_created',
          invitation_sent: true,
          admin_action: true,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error('Failed to log user creation:', auditError);
      // 감사 로그 실패는 메인 작업에 영향을 주지 않음
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: newUser,
      meta: {
        invitationSent: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUserId
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST API Error:', error);
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
