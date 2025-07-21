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

    const searchParams = request.nextUrl.searchParams;
    const rootId = searchParams.get('root_id');
    const depth = parseInt(searchParams.get('depth') || '2');

    // 모든 활성 관계 가져오기
    const { data: relationships, error: relError } = await supabase
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
      .eq('is_active', true);

    if (relError) {
      console.error('관계 조회 오류:', relError);
      return NextResponse.json({ error: '관계 조회 실패' }, { status: 500 });
    }

    // 이번 달 매출 데이터 가져오기
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: salesData, error: salesError } = await supabase
      .from('orders')
      .select('shop_id, order_date, total_amount')
      .gte('order_date', startOfMonth.toISOString());

    if (salesError) {
      console.error('매출 데이터 조회 오류:', salesError);
    }

    // 매출 데이터를 shop_id로 그룹화
    const salesByShop = salesData?.reduce((acc, order) => {
      if (!acc[order.shop_id]) {
        acc[order.shop_id] = {
          sales_this_month: 0,
          last_order_date: null
        };
      }
      acc[order.shop_id].sales_this_month += order.total_amount || 0;
      if (!acc[order.shop_id].last_order_date || order.order_date > acc[order.shop_id].last_order_date) {
        acc[order.shop_id].last_order_date = order.order_date;
      }
      return acc;
    }, {} as Record<string, { sales_this_month: number; last_order_date: string | null }>);

    // 관계 맵 생성
    const relationshipMap = new Map<string, any[]>();
    relationships?.forEach(rel => {
      if (!relationshipMap.has(rel.parent_id)) {
        relationshipMap.set(rel.parent_id, []);
      }
      relationshipMap.get(rel.parent_id)?.push(rel);
    });

    // 트리 구축 함수
    const buildTree = (parentId: string, currentDepth: number): TreeNode[] => {
      if (currentDepth > depth) return [];

      const children = relationshipMap.get(parentId) || [];
      return children.map(rel => {
        const stats = salesByShop?.[rel.shop_owner_id] || {
          sales_this_month: 0,
          last_order_date: null
        };

        return {
          id: rel.shop_owner_id,
          name: rel.shop_owner.name,
          role: rel.shop_owner.role,
          shop_name: rel.shop_owner.shop_name,
          subordinates: buildTree(rel.shop_owner_id, currentDepth + 1),
          stats,
          relationship_id: rel.id,
          started_at: rel.started_at
        };
      });
    };

    let tree: TreeNode[] = [];

    if (rootId) {
      // 특정 노드부터 시작
      tree = buildTree(rootId, 1);
    } else {
      // 최상위 KOL/OL 찾기 (parent가 없거나 admin인 경우)
      const { data: topLevelUsers, error: topError } = await supabase
        .from('profiles')
        .select('id, name, shop_name, role')
        .in('role', ['kol', 'ol'])
        .eq('status', 'approved');

      if (topError) {
        console.error('최상위 사용자 조회 오류:', topError);
        return NextResponse.json({ error: '트리 구축 실패' }, { status: 500 });
      }

      // 상위가 없는 KOL/OL 찾기
      const usersWithParent = new Set(relationships?.map(rel => rel.shop_owner_id));
      const topLevelKOLs = topLevelUsers?.filter(user => !usersWithParent.has(user.id)) || [];

      tree = topLevelKOLs.map(user => ({
        id: user.id,
        name: user.name,
        role: user.role as 'kol' | 'ol',
        shop_name: user.shop_name,
        subordinates: buildTree(user.id, 1),
        stats: salesByShop?.[user.id] || {
          sales_this_month: 0,
          last_order_date: null
        }
      }));
    }

    return NextResponse.json({ data: tree });
  } catch (error) {
    console.error('트리 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
