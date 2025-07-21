import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const body = await request.json();
    const { user_ids, action, data } = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: '처리할 사용자가 선택되지 않았습니다.' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: '액션이 지정되지 않았습니다.' }, { status: 400 });
    }

    const results = {
      success: [] as string[],
      failed: [] as { user_id: string; error: string }[]
    };

    // 각 액션별 처리
    switch (action) {
      case 'approve':
        for (const userId of user_ids) {
          try {
            const { error } = await supabase
              .from('profiles')
              .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: user.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
              .eq('status', 'pending'); // pending 상태인 경우만 승인

            if (error) throw error;
            results.success.push(userId);
          } catch (error) {
            results.failed.push({
              user_id: userId,
              error: '승인 처리 실패'
            });
          }
        }
        break;

      case 'reject':
        for (const userId of user_ids) {
          try {
            const { error } = await supabase
              .from('profiles')
              .update({
                status: 'rejected',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
              .eq('status', 'pending'); // pending 상태인 경우만 거절

            if (error) throw error;
            results.success.push(userId);
          } catch (error) {
            results.failed.push({
              user_id: userId,
              error: '거절 처리 실패'
            });
          }
        }
        break;

      case 'change_role':
        if (!data?.role) {
          return NextResponse.json({ error: '변경할 역할이 지정되지 않았습니다.' }, { status: 400 });
        }

        for (const userId of user_ids) {
          try {
            // 본인 역할은 변경 불가
            if (userId === user.id) {
              results.failed.push({
                user_id: userId,
                error: '본인의 역할은 변경할 수 없습니다.'
              });
              continue;
            }

            const { error } = await supabase
              .from('profiles')
              .update({
                role: data.role,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (error) throw error;
            results.success.push(userId);
          } catch (error) {
            results.failed.push({
              user_id: userId,
              error: '역할 변경 실패'
            });
          }
        }
        break;

      case 'delete':
        for (const userId of user_ids) {
          try {
            // 본인은 삭제 불가
            if (userId === user.id) {
              results.failed.push({
                user_id: userId,
                error: '본인은 삭제할 수 없습니다.'
              });
              continue;
            }

            // 관련 데이터가 있는지 확인
            const { count: orderCount } = await supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .eq('shop_id', userId);

            const { count: clinicalCount } = await supabase
              .from('clinical_cases')
              .select('*', { count: 'exact', head: true })
              .eq('shop_id', userId);

            if ((orderCount || 0) > 0 || (clinicalCount || 0) > 0) {
              results.failed.push({
                user_id: userId,
                error: '관련 데이터가 있어 삭제할 수 없습니다.'
              });
              continue;
            }

            const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userId);

            if (error) throw error;
            results.success.push(userId);
          } catch (error) {
            results.failed.push({
              user_id: userId,
              error: '삭제 처리 실패'
            });
          }
        }
        break;

      default:
        return NextResponse.json({ error: '알 수 없는 액션입니다.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      affected: results.success.length,
      results
    });
  } catch (error) {
    console.error('일괄 작업 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
