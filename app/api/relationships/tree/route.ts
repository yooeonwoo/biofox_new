import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface TreeNode {
  id: string;
  name: string;
  role: 'kol' | 'ol' | 'shop_owner';
  shop_name: string;
  subordinates: TreeNode[];
  stats?: {
    sales_this_month: number;
    last_order_date: string | null;
  };
}

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
    const rootId = searchParams.get('root_id');
    const depth = parseInt(searchParams.get('depth') || '2');

    // 단순한 관계 데이터 조회 (join 없이)
    const { data: relationships, error: relError } = await supabase
      .from('shop_relationships')
      .select('*')
      .eq('is_active', true);

    if (relError) {
      console.error('관계 조회 오류:', relError);
      return NextResponse.json({ error: '관계 조회 실패', details: relError }, { status: 500 });
    }

    console.log('조회된 관계 수:', relationships?.length);

    // 모든 profiles 데이터 조회
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, shop_name, role, status');

    if (profileError) {
      console.error('프로필 조회 오류:', profileError);
      return NextResponse.json(
        { error: '프로필 조회 실패', details: profileError },
        { status: 500 }
      );
    }

    console.log('조회된 프로필 수:', profiles?.length);

    // 프로필을 ID로 매핑
    const profileMap = new Map<string, any>();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    // 이번 달 매출 데이터 가져오기 (임시로 빈 객체 사용)
    const salesByShop: Record<
      string,
      { sales_this_month: number; last_order_date: string | null }
    > = {};

    // 관계를 parent_id로 그룹화
    const relationshipMap = new Map<string, any[]>();
    relationships?.forEach(rel => {
      const parentId = rel.parent_id || 'root';
      if (!relationshipMap.has(parentId)) {
        relationshipMap.set(parentId, []);
      }
      relationshipMap.get(parentId)!.push(rel);
    });

    console.log('관계 맵:', Object.fromEntries(relationshipMap));

    // 트리 구성 함수
    function buildTree(parentId: string | null, currentDepth: number): TreeNode[] {
      if (currentDepth >= depth) return [];

      const mapKey = parentId || 'root';
      const children = relationshipMap.get(mapKey) || [];

      return children
        .map(rel => {
          const profile = profileMap.get(rel.shop_owner_id);
          if (!profile) {
            console.warn(`프로필을 찾을 수 없음: ${rel.shop_owner_id}`);
            return null;
          }

          const node: TreeNode = {
            id: rel.shop_owner_id,
            name: profile.name,
            role: profile.role,
            shop_name: profile.shop_name,
            subordinates: buildTree(rel.shop_owner_id, currentDepth + 1),
            stats: salesByShop[rel.shop_owner_id] || {
              sales_this_month: 0,
              last_order_date: null,
            },
          };

          return node;
        })
        .filter(node => node !== null);
    }

    // 루트 노드부터 트리 구성
    let treeData: TreeNode[];

    if (rootId) {
      // 특정 루트부터 시작
      treeData = buildTree(rootId, 0);
    } else {
      // 최상위 노드들부터 시작 (parent_id가 null인 것들)
      treeData = buildTree(null, 0);
    }

    console.log('구성된 트리 데이터:', JSON.stringify(treeData, null, 2));

    return NextResponse.json({ data: treeData });
  } catch (error) {
    console.error('Tree API 에러:', error);
    return NextResponse.json(
      {
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
