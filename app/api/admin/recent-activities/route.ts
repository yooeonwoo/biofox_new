import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface Activity {
  type: 'order' | 'user' | 'relationship';
  title: string;
  description: string;
  created_at: string;
  metadata: Record<string, any>;
}

export async function GET() {
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

    // 24시간 전 날짜
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 병렬로 최근 활동 데이터 수집
    const [
      recentOrders,
      recentUsers,
      recentRelationships
    ] = await Promise.all([
      // 최근 주문
      supabase
        .from('orders')
        .select(`
          id, 
          total_amount, 
          created_at,
          shop_relationships!inner(
            shop_owner:profiles!shop_owner_id(name, shop_name)
          )
        `)
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10),

      // 최근 사용자 가입
      supabase
        .from('profiles')
        .select('id, name, role, shop_name, created_at')
        .gte('created_at', oneDayAgo.toISOString())
        .neq('role', 'admin')
        .order('created_at', { ascending: false })
        .limit(10),

      // 최근 관계 변경
      supabase
        .from('shop_relationships')
        .select(`
          id,
          started_at,
          created_at,
          shop_owner:profiles!shop_owner_id(name, shop_name),
          parent:profiles!parent_id(name, role)
        `)
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // 활동 데이터 통합 및 변환
    const activities: Activity[] = [];

    // 주문 활동
    if (recentOrders.data) {
      recentOrders.data.forEach((order: any) => {
        const shopOwner = order.shop_relationships?.shop_owner;
        activities.push({
          type: 'order',
          title: '새 주문 등록',
          description: `${shopOwner?.name || '알 수 없는 사용자'}(${shopOwner?.shop_name || ''})님이 ₩${(order.total_amount || 0).toLocaleString()}의 주문을 등록했습니다.`,
          created_at: order.created_at,
          metadata: {
            orderId: order.id,
            amount: order.total_amount,
            shopName: shopOwner?.shop_name
          }
        });
      });
    }

    // 사용자 가입 활동
    if (recentUsers.data) {
      recentUsers.data.forEach((user: any) => {
        const roleText = user.role === 'kol' ? 'KOL' : user.role === 'ol' ? 'OL' : '매장 사용자';
        activities.push({
          type: 'user',
          title: '새 사용자 가입',
          description: `${user.name || '알 수 없는 사용자'}님이 ${roleText}로 가입했습니다. (${user.shop_name || '매장명 미등록'})`,
          created_at: user.created_at,
          metadata: {
            userId: user.id,
            role: user.role,
            shopName: user.shop_name
          }
        });
      });
    }

    // 관계 변경 활동
    if (recentRelationships.data) {
      recentRelationships.data.forEach((relationship: any) => {
        const shopOwner = relationship.shop_owner;
        const parent = relationship.parent;
        const parentRoleText = parent?.role === 'kol' ? 'KOL' : parent?.role === 'ol' ? 'OL' : '상위자';
        
        activities.push({
          type: 'relationship',
          title: '소속 관계 변경',
          description: `${shopOwner?.name || '알 수 없는 사용자'}(${shopOwner?.shop_name || ''})님이 ${parent?.name || '알 수 없는 상위자'} ${parentRoleText}의 소속으로 배정되었습니다.`,
          created_at: relationship.created_at,
          metadata: {
            relationshipId: relationship.id,
            shopOwnerId: shopOwner?.id,
            parentId: parent?.id
          }
        });
      });
    }

    // 시간순 정렬 (최신 순)
    activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // 상위 20개만 반환
    const topActivities = activities.slice(0, 20);

    return NextResponse.json(topActivities);

  } catch (error) {
    console.error('최근 활동 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 