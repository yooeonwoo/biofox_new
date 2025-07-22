import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // 기본 쿼리
    let query = supabase
      .from('shop_relationships')
      .select(
        `
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
          role
        ),
        created_by_user:profiles!created_by(
          id,
          name
        )
      `,
        { count: 'exact' }
      )
      .order('started_at', { ascending: false });

    // 필터 적용
    if (shopId) {
      query = query.eq('shop_owner_id', shopId);
    }
    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: relationships, error, count } = await query;

    if (error) {
      console.error('이력 조회 오류:', error);
      return NextResponse.json({ error: '이력 조회 실패' }, { status: 500 });
    }

    // 이력 데이터 가공
    const history = relationships?.map(rel => ({
      id: rel.id,
      shop_owner: {
        id: rel.shop_owner.id,
        name: rel.shop_owner.name,
        shop_name: rel.shop_owner.shop_name,
      },
      parent: rel.parent
        ? {
            id: rel.parent.id,
            name: rel.parent.name,
            role: rel.parent.role,
          }
        : null,
      started_at: rel.started_at,
      ended_at: rel.ended_at,
      is_active: rel.is_active,
      reason: rel.notes,
      changed_by: rel.created_by_user
        ? {
            id: rel.created_by_user.id,
            name: rel.created_by_user.name,
          }
        : null,
      changed_at: rel.created_at,
    }));

    // 이전 관계 찾기 (변경 전 상태)
    const historyWithPrevious = await Promise.all(
      history?.map(async item => {
        if (!item.is_active && item.ended_at) {
          // 이 관계가 끝난 시점 직전의 관계 찾기
          const { data: previousRel } = await supabase
            .from('shop_relationships')
            .select(
              `
            parent:profiles!parent_id(
              id,
              name
            )
          `
            )
            .eq('shop_owner_id', item.shop_owner.id)
            .lt('started_at', item.started_at)
            .order('started_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...item,
            old_parent: previousRel?.parent || null,
          };
        }
        return {
          ...item,
          old_parent: null,
        };
      }) || []
    );

    return NextResponse.json({
      data: historyWithPrevious,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('이력 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
