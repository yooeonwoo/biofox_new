import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 벌크 액션 검증 스키마
const bulkActionSchema = z.object({
  action: z.enum(['delete', 'approve', 'reject', 'suspend', 'change_role']),
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required').max(100, 'Maximum 100 users per action'),
  reason: z.string().optional(),
  data: z.object({
    role: z.enum(['admin', 'kol', 'ol', 'shop_owner']).optional()
  }).optional()
});

// 액션별 한국어 레이블 매핑
const actionLabels: Record<string, string> = {
  approve: '승인',
  reject: '거절',
  suspend: '정지',
  change_role: '역할 변경',
  delete: '삭제'
};

// 역할 레이블 매핑
const roleLabels: Record<string, string> = {
  admin: '관리자',
  kol: 'KOL',
  ol: 'OL',
  shop_owner: '상점 운영자'
};

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
      
      currentUserId = user.id;
    } else {
      console.log('[DEV] Authentication bypassed for POST /api/users/bulk-action');
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
          details: validation.error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    const { action, userIds, reason, data } = validation.data;

    // 자기 자신 대상 액션 방지 (삭제의 경우)
    if (action === 'delete' && userIds.includes(currentUserId)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // 대상 사용자들 조회
    const { data: targetUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (fetchError) {
      console.error('Target users fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch target users' },
        { status: 500 }
      );
    }

    if (!targetUsers || targetUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No target users found' },
        { status: 404 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[]
    };

    // 액션별 처리
    for (const targetUser of targetUsers) {
      try {
        let updateData: any = {
          updated_at: new Date().toISOString()
        };

        switch (action) {
          case 'approve':
            updateData.status = 'approved';
            if (targetUser.status !== 'approved') {
              updateData.approved_at = new Date().toISOString();
            }
            break;

          case 'reject':
            updateData.status = 'rejected';
            break;

          case 'suspend':
            updateData.status = 'suspended';
            break;

          case 'change_role':
            if (!data?.role) {
              results.failed.push({
                id: targetUser.id,
                error: 'Role is required for role change action'
              });
              continue;
            }
            updateData.role = data.role;
            break;

          case 'delete':
            // 삭제는 별도 처리
            const { error: deleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', targetUser.id);

            if (deleteError) {
              results.failed.push({
                id: targetUser.id,
                error: deleteError.message
              });
            } else {
              // Auth 사용자도 삭제 시도
              try {
                await supabase.auth.admin.deleteUser(targetUser.id);
              } catch (authDeleteError) {
                console.error('Auth user deletion error:', authDeleteError);
                // 프로필 삭제는 성공했으므로 성공으로 처리
              }
              results.success.push(targetUser.id);
            }
            continue;
        }

        // 삭제가 아닌 경우 업데이트 수행
        if (action !== 'delete') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', targetUser.id);

          if (updateError) {
            results.failed.push({
              id: targetUser.id,
              error: updateError.message
            });
          } else {
            results.success.push(targetUser.id);
          }
        }

        // 감사 로그 기록
        const { error: auditError } = await supabase
          .from('audit_logs')
          .insert({
            table_name: 'profiles',
            record_id: targetUser.id,
            action: action === 'delete' ? 'DELETE' : 'UPDATE',
            user_id: currentUserId,
            old_values: action === 'delete' ? targetUser : 
              Object.fromEntries(
                Object.keys(updateData).filter(key => key !== 'updated_at')
                  .map(key => [key, targetUser[key]])
              ),
            new_values: action === 'delete' ? null : updateData,
            changed_fields: action === 'delete' ? Object.keys(targetUser) : Object.keys(updateData),
            metadata: {
              operation: 'bulk_action',
              action_type: action,
              admin_action: true,
              reason: reason || null,
              timestamp: new Date().toISOString()
            }
          });

        if (auditError) {
          console.error('Failed to log bulk action:', auditError);
        }

      } catch (error) {
        console.error(`Error processing user ${targetUser.id}:`, error);
        results.failed.push({
          id: targetUser.id,
          error: String(error)
        });
      }
    }

    // 결과 응답
    const actionLabel = actionLabels[action] || action;
    
    return NextResponse.json({
      success: true,
      message: `벌크 ${actionLabel} 작업이 완료되었습니다`,
      data: {
        action,
        actionLabel,
        totalRequested: userIds.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        results
      },
      meta: {
        processedAt: new Date().toISOString(),
        processedBy: currentUserId,
        reason: reason || null
      }
    });

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
