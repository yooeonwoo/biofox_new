import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
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

// 사용자 생성 API
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({
      cookies: () => cookies(),
    });

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
          details: validation.error.errors.map(err => ({
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
        user_id: user.id,
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
        createdBy: user.id
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
