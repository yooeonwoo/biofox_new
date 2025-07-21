import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 소속 관계 목록 조회
export async function GET(request: NextRequest) {
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

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shop_id');
    const parentId = searchParams.get('parent_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    // 기본 쿼리
    let query = supabase
      .from('shop_relationships')
      .select(`
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
      `)
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

// 소속 관계 생성/변경
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
    const { shop_owner_id, parent_id, reason } = body;

    if (!shop_owner_id || !parent_id) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 자기 자신을 소속시킬 수 없음
    if (shop_owner_id === parent_id) {
      return NextResponse.json({ error: '자기 자신을 소속시킬 수 없습니다.' }, { status: 400 });
    }

    // 순환 참조 검사 (KOL이 자신의 하위 Shop의 소속이 되는 것 방지)
    const { data: parentRelation } = await supabase
      .from('shop_relationships')
      .select('parent_id')
      .eq('shop_owner_id', parent_id)
      .eq('is_active', true)
      .single();

    if (parentRelation?.parent_id === shop_owner_id) {
      return NextResponse.json({ error: '순환 참조가 발생합니다.' }, { status: 400 });
    }

    // 트랜잭션 처리
    // 1. 기존 활성 관계 종료
    const { error: updateError } = await supabase
      .from('shop_relationships')
      .update({
        is_active: false,
        ended_at: new Date().toISOString()
      })
      .eq('shop_owner_id', shop_owner_id)
      .eq('is_active', true);

    if (updateError) {
      console.error('기존 관계 종료 오류:', updateError);
      return NextResponse.json({ error: '관계 변경 실패' }, { status: 500 });
    }

    // 2. 새 관계 생성
    const { data: newRelation, error: createError } = await supabase
      .from('shop_relationships')
      .insert({
        shop_owner_id,
        parent_id,
        started_at: new Date().toISOString(),
        is_active: true,
        notes: reason || null,
        created_by: user.id
      })
      .select(`
        *,
        shop_owner:profiles!shop_owner_id(
          id,
          name,
          email,
          shop_name
        ),
        parent:profiles!parent_id(
          id,
          name,
          email,
          shop_name,
          role
        )
      `)
      .single();

    if (createError) {
      console.error('새 관계 생성 오류:', createError);
      return NextResponse.json({ error: '관계 생성 실패' }, { status: 500 });
    }

    return NextResponse.json({ data: newRelation }, { status: 201 });
  } catch (error) {
    console.error('관계 생성 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
