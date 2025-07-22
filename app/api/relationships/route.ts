import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 소속 관계 목록 조회 (READ)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 권한 확인 - 임시로 주석 처리
    /*
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
    */

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shop_id');
    const parentId = searchParams.get('parent_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    // 기본 쿼리 - 프로필 정보와 함께 조회
    let query = supabase
      .from('shop_relationships')
      .select(
        `
        *,
        shop_owner:profiles!shop_owner_id(
          id,
          name,
          email,
          shop_name,
          role,
          status
        ),
        parent:profiles!parent_id(
          id,
          name,
          email,
          shop_name,
          role
        )
      `
      )
      .order('created_at', { ascending: false });

    // 필터 적용
    if (shopId) {
      query = query.eq('shop_owner_id', shopId);
    }
    if (parentId) {
      query = query.eq('parent_id', parentId);
    }
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: relationships, error } = await query;

    if (error) {
      console.error('관계 조회 오류:', error);
      return NextResponse.json({ error: '관계 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: relationships });
  } catch (error) {
    console.error('관계 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새로운 소속 관계 생성 (CREATE)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 권한 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
    const { shop_owner_id, parent_id, reason } = body;

    if (!shop_owner_id) {
      return NextResponse.json({ error: '에스테틱 ID가 필요합니다.' }, { status: 400 });
    }

    // 자기 자신을 소속시킬 수 없음
    if (shop_owner_id === parent_id) {
      return NextResponse.json({ error: '자기 자신을 소속시킬 수 없습니다.' }, { status: 400 });
    }

    // 기존 활성 관계가 있는지 확인
    const { data: existingRelation } = await supabase
      .from('shop_relationships')
      .select('id')
      .eq('shop_owner_id', shop_owner_id)
      .eq('is_active', true)
      .single();

    if (existingRelation) {
      return NextResponse.json({ error: '이미 활성화된 관계가 존재합니다.' }, { status: 400 });
    }

    // 새 관계 생성
    const { data: newRelation, error: createError } = await supabase
      .from('shop_relationships')
      .insert({
        shop_owner_id,
        parent_id,
        started_at: new Date().toISOString(),
        is_active: true,
        relationship_type: 'direct',
        notes: reason || null,
        created_by: user.id,
      })
      .select(
        `
        *,
        shop_owner:profiles!shop_owner_id(
          id,
          name,
          email,
          shop_name,
          role
        ),
        parent:profiles!parent_id(
          id,
          name,
          email,
          shop_name,
          role
        )
      `
      )
      .single();

    if (createError) {
      console.error('관계 생성 오류:', createError);
      return NextResponse.json({ error: '관계 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: newRelation }, { status: 201 });
  } catch (error) {
    console.error('관계 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 소속 관계 수정 (UPDATE)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 권한 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
    const { relationship_id, shop_owner_id, parent_id, reason } = body;

    if (!relationship_id || !shop_owner_id) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 자기 자신을 소속시킬 수 없음
    if (shop_owner_id === parent_id) {
      return NextResponse.json({ error: '자기 자신을 소속시킬 수 없습니다.' }, { status: 400 });
    }

    // 관계 수정
    const { data: updatedRelation, error: updateError } = await supabase
      .from('shop_relationships')
      .update({
        parent_id,
        notes: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', relationship_id)
      .select(
        `
        *,
        shop_owner:profiles!shop_owner_id(
          id,
          name,
          email,
          shop_name,
          role
        ),
        parent:profiles!parent_id(
          id,
          name,
          email,
          shop_name,
          role
        )
      `
      )
      .single();

    if (updateError) {
      console.error('관계 수정 오류:', updateError);
      return NextResponse.json({ error: '관계 수정 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedRelation });
  } catch (error) {
    console.error('관계 수정 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 소속 관계 삭제 (DELETE)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 권한 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('id');
    const shopOwnerId = searchParams.get('shop_owner_id');

    if (!relationshipId && !shopOwnerId) {
      return NextResponse.json(
        { error: '관계 ID 또는 에스테틱 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let deleteError;

    if (relationshipId) {
      // 특정 관계 삭제
      const { error } = await supabase.from('shop_relationships').delete().eq('id', relationshipId);
      deleteError = error;
    } else {
      // 특정 에스테틱의 모든 관계 삭제
      const { error } = await supabase
        .from('shop_relationships')
        .delete()
        .eq('shop_owner_id', shopOwnerId);
      deleteError = error;
    }

    if (deleteError) {
      console.error('관계 삭제 오류:', deleteError);
      return NextResponse.json({ error: '관계 삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ message: '관계가 삭제되었습니다.' });
  } catch (error) {
    console.error('관계 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
