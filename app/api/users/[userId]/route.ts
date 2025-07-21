import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 사용자 업데이트 스키마
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'kol', 'ol', 'shop_owner']).optional(),
  status: z.enum(['pending', 'approved', 'suspended', 'rejected']).optional(),
  shop_name: z.string().min(2).optional(),
  region: z.string().optional(),
  commission_rate: z.number().min(0).max(100).optional(),
  naver_place_link: z.string().url().optional().or(z.literal('')),
});

// 사용자 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

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

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // 사용자 정보 조회
    const { data: userProfile, error: fetchError } = await supabase
      .from('profiles')
      .select(`
        id, name, email, role, status, shop_name, region, 
        commission_rate, total_subordinates, active_subordinates,
        naver_place_link, approved_at, created_at, updated_at
      `)
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('User fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('GET User API Error:', error);
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

// 사용자 정보 업데이트 API
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
          details: validation.error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const validatedData = validation.data;

    // 기존 사용자 정보 조회
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 업데이트할 필드만 추출
    const updateData: any = {};
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updateData[key] = validatedData[key as keyof typeof validatedData];
      }
    });

    // 업데이트 시간 추가
    updateData.updated_at = new Date().toISOString();

    // 승인 시간 처리
    if (updateData.status === 'approved' && existingUser.status !== 'approved') {
      updateData.approved_at = new Date().toISOString();
    }

    // 사용자 정보 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
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

    // 감사 로그 기록
    const changedFields = Object.keys(updateData).filter(key => 
      key !== 'updated_at' && existingUser[key] !== updateData[key]
    );

    if (changedFields.length > 0) {
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          table_name: 'profiles',
          record_id: userId,
          action: 'UPDATE',
          user_id: user.id,
          old_values: Object.fromEntries(
            changedFields.map(field => [field, existingUser[field]])
          ),
          new_values: Object.fromEntries(
            changedFields.map(field => [field, updateData[field]])
          ),
          changed_fields: changedFields,
          metadata: {
            operation: 'user_updated',
            admin_action: true,
            timestamp: new Date().toISOString()
          }
        });

      if (auditError) {
        console.error('Failed to log user update:', auditError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
      meta: {
        updatedFields: changedFields,
        updatedAt: updateData.updated_at,
        updatedBy: user.id
      }
    });

  } catch (error) {
    console.error('PUT User API Error:', error);
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

// 사용자 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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

    // 자기 자신 삭제 방지
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // 기존 사용자 정보 조회
    const { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 프로필 삭제
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteProfileError) {
      console.error('Profile deletion error:', deleteProfileError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user profile' },
        { status: 500 }
      );
    }

    // Auth 사용자 삭제
    try {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteAuthError) {
        console.error('Auth user deletion error:', deleteAuthError);
        // 프로필은 이미 삭제되었으므로 경고만 로그
      }
    } catch (authDeleteError) {
      console.error('Failed to delete auth user:', authDeleteError);
      // 프로필 삭제는 성공했으므로 계속 진행
    }

    // 감사 로그 기록
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        table_name: 'profiles',
        record_id: userId,
        action: 'DELETE',
        user_id: user.id,
        old_values: existingUser,
        new_values: null,
        changed_fields: Object.keys(existingUser),
        metadata: {
          operation: 'user_deleted',
          admin_action: true,
          timestamp: new Date().toISOString()
        }
      });

    if (auditError) {
      console.error('Failed to log user deletion:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      meta: {
        deletedUserId: userId,
        deletedAt: new Date().toISOString(),
        deletedBy: user.id
      }
    });

  } catch (error) {
    console.error('DELETE User API Error:', error);
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
