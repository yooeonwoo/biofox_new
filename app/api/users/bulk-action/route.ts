import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 벌크 액션 검증 스키마
const bulkActionSchema = z.object({
  action: z.enum(['delete', 'approve', 'reject', 'suspend']),
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
  reason: z.string().optional()
});

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
      .select('role, name')
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
    const validation = bulkActionSchema.safeParse(body);
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

    // change_role 작업의 경우 역할 데이터 필수 확인
    if (validatedData.action === 'change_role') {
      if (!validatedData.data?.role) {
        return NextResponse.json(
          { success: false, error: 'Role is required for role change action' },
          { status: 400 }
        );
      }
    }

    // 자기 자신 삭제 방지 (delete 액션의 경우)
    if (validatedData.action === 'delete' && validatedData.user_ids.includes(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    // Supabase RPC 함수 호출
    const { data: rpcResult, error: rpcError } = await supabase.rpc('bulk_update_users', {
      user_ids: validatedData.user_ids,
      action_type: validatedData.action,
      action_data: validatedData.data || {},
      current_admin_id: user.id
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Database operation failed' },
        { status: 500 }
      );
    }

    // RPC 함수 결과 확인
    if (!rpcResult.success) {
      return NextResponse.json(
        { success: false, error: rpcResult.error || 'Operation failed' },
        { status: 500 }
      );
    }

    // delete 액션의 경우 Auth 사용자도 삭제
    if (validatedData.action === 'delete' && rpcResult.results.successful.length > 0) {
      const successfulUserIds = rpcResult.results.successful;
      
      // Auth 사용자 삭제 (실패해도 메인 작업에는 영향 없음)
      for (const userId of successfulUserIds) {
        try {
          await supabase.auth.admin.deleteUser(userId);
        } catch (authDeleteError) {
          console.error(`Failed to delete auth user ${userId}:`, authDeleteError);
          // Auth 삭제 실패는 로그만 남기고 계속 진행
        }
      }
    }

    // 감사 로그 기록
    if (rpcResult.results.successful.length > 0) {
      const auditLogPromises = rpcResult.results.successful.map(async (userId: string) => {
        const logData = {
          table_name: 'profiles',
          record_id: userId,
          action: validatedData.action === 'delete' ? 'DELETE' : 'UPDATE',
          user_id: user.id,
          old_values: null, // RPC 함수에서 처리
          new_values: validatedData.action === 'change_role' ? { role: validatedData.data?.role } : null,
          changed_fields: validatedData.action === 'change_role' ? ['role'] : ['status'],
          metadata: {
            operation: 'bulk_action',
            action_type: validatedData.action,
            admin_name: currentUserProfile.name,
            timestamp: new Date().toISOString(),
            batch_size: validatedData.user_ids.length,
            successful_count: rpcResult.results.successful.length,
            failed_count: rpcResult.results.failed.length
          }
        };

        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert(logData);

        if (auditError) {
          console.error('Failed to log bulk action:', auditError);
        }
      });

      // 모든 감사 로그를 병렬로 처리
      await Promise.allSettled(auditLogPromises);
    }

    // 성공 응답
    const response = {
      success: true,
      message: `${actionLabels[validatedData.action]} 작업이 완료되었습니다`,
      affected: rpcResult.affected,
      results: {
        successful: rpcResult.results.successful,
        failed: rpcResult.results.failed
      },
      meta: {
        action: validatedData.action,
        action_label: actionLabels[validatedData.action],
        role_changed_to: validatedData.action === 'change_role' ? 
          roleLabels[validatedData.data?.role as keyof typeof roleLabels] : undefined,
        processed_at: new Date().toISOString(),
        processed_by: {
          id: user.id,
          name: currentUserProfile.name
        }
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Bulk Action API Error:', error);
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
