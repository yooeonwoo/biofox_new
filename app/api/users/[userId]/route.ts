import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

// 사용자 정보 수정
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const authResult = await checkAdminAuth(request);
    if (!authResult.authorized) return authResult.error!;

    const body = await request.json();
    const { name, role, status, shop_name, region, commission_rate } = body;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(status !== undefined && { status }),
        ...(shop_name !== undefined && { shop_name }),
        ...(region !== undefined && { region }),
        ...(commission_rate !== undefined && { commission_rate }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.userId)
      .select()
      .single();

    if (error) {
      console.error('사용자 수정 오류:', error);
      return NextResponse.json({ error: '사용자 수정 실패' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error('사용자 수정 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

// 사용자 삭제
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const authResult = await checkAdminAuth(request);
    if (!authResult.authorized) return authResult.error!;

    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', params.userId);

    if (error) {
      console.error('사용자 삭제 오류:', error);
      return NextResponse.json({ error: '사용자 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '사용자가 삭제되었습니다.' });
  } catch (err) {
    console.error('사용자 삭제 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
