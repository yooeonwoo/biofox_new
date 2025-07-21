import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// 사용자 업데이트 데이터 검증 스키마
const updateUserSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다').optional(),
  role: z.enum(['admin', 'kol', 'ol', 'shop_owner'], {
    errorMap: () => ({ message: '유효하지 않은 역할입니다' })
  }).optional(),
  status: z.enum(['pending', 'approved', 'rejected'], {
    errorMap: () => ({ message: '유효하지 않은 상태입니다' })
  }).optional(),
  shop_name: z.string().min(1, '상점명은 필수입니다').optional(),
  region: z.string().optional(),
  commission_rate: z.number().min(0, '수수료율은 0% 이상이어야 합니다').max(100, '수수료율은 100% 이하여야 합니다').optional()
});

// 입력 데이터 정리 함수 (XSS 방지)
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .trim(); // 공백 제거
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    // userId 매개변수 유효성 검증
    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex = 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // RPC 함수 호출
    const { data: userDetailData, error: rpcError } = await supabase.rpc(
      'get_user_detailed_info',
      { user_id: userId }
    );

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user details' },
        { status: 500 }
      );
    }

    // RPC 함수가 에러를 반환한 경우
    if (!userDetailData.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: userDetailData.error || 'Failed to fetch user details' 
        },
        { status: 500 }
      );
    }

    // 사용자가 존재하지 않는 경우
    if (!userDetailData.data?.user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 성공적인 응답
    return NextResponse.json({
      success: true,
      data: userDetailData.data,
      meta: {
        fetchedAt: new Date().toISOString(),
        requestedBy: user.id,
      }
    });

  } catch (error) {
    console.error('API Error:', error);
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

// 사용자 정보 수정 API
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    // userId 매개변수 유효성 검증
    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex = 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
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
    const validation = updateUserSchema.safeParse(body);
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

    // 업데이트할 사용자가 존재하는지 확인
    const { data: targetUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id, role, name, approved_at')
      .eq('id', userId)
      .single();

    if (userCheckError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 입력 데이터 정리 (XSS 방지)
    const sanitizedData: any = {};
    if (validatedData.name) {
      sanitizedData.name = sanitizeInput(validatedData.name);
    }
    if (validatedData.shop_name) {
      sanitizedData.shop_name = sanitizeInput(validatedData.shop_name);
    }
    if (validatedData.region) {
      sanitizedData.region = sanitizeInput(validatedData.region);
    }
    if (validatedData.role) {
      sanitizedData.role = validatedData.role;
    }
    if (validatedData.status) {
      sanitizedData.status = validatedData.status;
    }
    if (validatedData.commission_rate !== undefined) {
      sanitizedData.commission_rate = validatedData.commission_rate;
    }

    // 역할 변경이 있는 경우 기록
    const isRoleChange = validatedData.role && validatedData.role !== targetUser.role;
    const oldRole = targetUser.role;

    // 사용자 정보 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
        ...(validatedData.status === 'approved' && !targetUser.approved_at && {
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
      })
      .eq('id', userId)
      .select(`
        id, name, email, role, status, shop_name, region, 
        commission_rate, total_subordinates, active_subordinates,
        naver_place_link, approved_at, created_at, updated_at
      `)
      .single();

    if (updateError) {
      console.error('User update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // 역할 변경 시 감사 로그 기록
    if (isRoleChange) {
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          table_name: 'profiles',
          record_id: userId,
          action: 'UPDATE',
          user_id: user.id,
          old_values: { role: oldRole },
          new_values: { role: validatedData.role },
          changed_fields: ['role'],
          metadata: {
            operation: 'role_change',
            target_user_name: targetUser.name,
            admin_action: true,
            timestamp: new Date().toISOString()
          }
        });

      if (auditError) {
        console.error('Failed to log role change:', auditError);
        // 감사 로그 실패는 메인 작업에 영향을 주지 않음
      }
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: updatedUser,
      meta: {
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        roleChanged: isRoleChange
      }
    });

  } catch (error) {
    console.error('PUT API Error:', error);
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

// 사용자 삭제 API (admin 전용)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
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

    // userId 매개변수 유효성 검증
    const { userId } = params;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex = 
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // 자신은 삭제할 수 없음
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    // 삭제할 사용자가 존재하는지 확인
    const { data: targetUser, error: userCheckError } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', userId)
      .single();

    if (userCheckError || !targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 사용자 삭제 (프로필만 삭제, auth 사용자는 유지)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('User delete error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // 감사 로그 기록
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        table_name: 'profiles',
        record_id: userId,
        action: 'DELETE',
        user_id: user.id,
        old_values: { 
          name: targetUser.name, 
          role: targetUser.role 
        },
        new_values: null,
        changed_fields: null,
        metadata: {
          operation: 'user_deleted',
          target_user_name: targetUser.name,
          admin_action: true,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error('Failed to log user deletion:', auditError);
      // 감사 로그 실패는 메인 작업에 영향을 주지 않음
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: 'User successfully deleted',
      meta: {
        deletedAt: new Date().toISOString(),
        deletedBy: user.id,
        deletedUser: {
          id: userId,
          name: targetUser.name,
          role: targetUser.role
        }
      }
    });

  } catch (error) {
    console.error('DELETE API Error:', error);
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
