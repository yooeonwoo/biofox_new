import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 소속 관계 목록 조회 (Convex 기반)
export async function GET(request: NextRequest) {
  try {
    console.log('Relationships GET API called - using Convex');

    // 권한 확인 - 일단 주석 처리 (원본 API도 주석 처리됨)
    /*
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    */

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shop_id');
    const parentId = searchParams.get('parent_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    console.log('Relationships query params:', { shopId, parentId, activeOnly });

    try {
      // Convex 쿼리 실행
      const relationships = await convex.query(api.relationships.getRelationships, {
        shop_id: shopId ? (shopId as any) : undefined,
        parent_id: parentId ? (parentId as any) : undefined,
        active_only: activeOnly || undefined,
      });

      return NextResponse.json({ data: relationships });
    } catch (convexError) {
      console.error('Convex query error:', convexError);
      return NextResponse.json(
        { error: 'Failed to fetch relationships from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Relationships GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 새로운 소속 관계 생성 (Convex 기반)
export async function POST(request: NextRequest) {
  try {
    console.log('Relationships POST API called - using Convex');

    // 권한 확인 - Convex 기반
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { shop_owner_id, parent_id, reason } = body;

    console.log('Creating relationship:', { shop_owner_id, parent_id, reason });

    if (!shop_owner_id) {
      return NextResponse.json({ error: '매장 소유자 ID가 필요합니다.' }, { status: 400 });
    }

    try {
      // Convex 뮤테이션 실행
      const newRelationship = await convex.mutation(api.relationships.createRelationship, {
        shop_owner_id,
        parent_id: parent_id || undefined,
        reason: reason || undefined,
      });

      console.log('Relationship created successfully:', newRelationship);

      return NextResponse.json({ data: newRelationship }, { status: 201 });
    } catch (convexError) {
      console.error('Convex mutation error:', convexError);

      // 에러 메시지에 따른 적절한 HTTP 상태 코드 반환
      const errorMessage = convexError instanceof Error ? convexError.message : String(convexError);
      if (errorMessage?.includes('자기 자신을 소속시킬 수 없습니다')) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage?.includes('이미 활성화된 관계가 존재합니다')) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }

      return NextResponse.json(
        { error: 'Failed to create relationship in Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Relationships POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 소속 관계 수정 (Convex 기반)
export async function PUT(request: NextRequest) {
  try {
    console.log('Relationships PUT API called - using Convex');

    // 권한 확인 - Convex 기반
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { relationship_id, shop_owner_id, parent_id, reason } = body;

    console.log('Updating relationship:', { relationship_id, shop_owner_id, parent_id });

    if (!relationship_id || !shop_owner_id) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    try {
      // Convex 뮤테이션 실행
      const updatedRelationship = await convex.mutation(api.relationships.updateRelationship, {
        relationship_id,
        shop_owner_id,
        parent_id: parent_id || undefined,
        reason: reason || undefined,
      });

      console.log('Relationship updated successfully:', updatedRelationship);

      return NextResponse.json({ data: updatedRelationship });
    } catch (convexError) {
      console.error('Convex mutation error:', convexError);

      // 에러 메시지에 따른 적절한 HTTP 상태 코드 반환
      const errorMessage = convexError instanceof Error ? convexError.message : String(convexError);
      if (errorMessage?.includes('자기 자신을 소속시킬 수 없습니다')) {
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      if (errorMessage?.includes('관계를 찾을 수 없습니다')) {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to update relationship in Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Relationships PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 소속 관계 삭제 (Convex 기반)
export async function DELETE(request: NextRequest) {
  try {
    console.log('Relationships DELETE API called - using Convex');

    // 권한 확인 - Convex 기반
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('id');
    const shopOwnerId = searchParams.get('shop_owner_id');

    console.log('Deleting relationship:', { relationshipId, shopOwnerId });

    if (!relationshipId && !shopOwnerId) {
      return NextResponse.json(
        { error: '관계 ID 또는 매장 소유자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    try {
      // Convex 뮤테이션 실행
      const result = await convex.mutation(api.relationships.deleteRelationship, {
        relationship_id: relationshipId ? (relationshipId as any) : undefined,
        shop_owner_id: shopOwnerId ? (shopOwnerId as any) : undefined,
      });

      console.log('Relationship deleted successfully:', result);

      return NextResponse.json(result);
    } catch (convexError) {
      console.error('Convex mutation error:', convexError);
      return NextResponse.json(
        { error: 'Failed to delete relationship in Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Relationships DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
