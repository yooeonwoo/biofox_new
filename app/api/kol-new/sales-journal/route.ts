import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 요청 데이터 타입 정의
interface SalesJournalRequest {
  date: string;
  shopName: string;
  content: string;
  specialNotes?: string;
  reminder?: {
    content: string;
    dateTime: string;
  };
  ownerMessage?: {
    content: string;
    dateTime: string;
    sendNow: boolean;
  };
}

// POST: 영업일지 저장 (UPSERT) - Convex 기반
export async function POST(req: NextRequest) {
  try {
    console.log('Sales Journal POST API called - using Convex');

    // 1. KOL 권한 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // KOL 권한 확인
    if (!['kol', 'ol'].includes(authResult.profile.role)) {
      return NextResponse.json(
        { success: false, error: 'KOL 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    console.log('Sales Journal - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    // 2. 요청 본문 파싱
    const body: SalesJournalRequest = await req.json();
    console.log('SalesJournal API 요청 본문:', body);

    // 알림 기능 비활성화(MVP) - reminder, ownerMessage는 무시
    const { date, shopName, content, specialNotes } = body;

    // 3. 요청 데이터 검증은 Convex 함수에서 수행
    console.log('Sales Journal request data:', { date, shopName, contentLength: content?.length });

    try {
      // 4. Convex 뮤테이션 실행 - UPSERT 기능
      const result = await convex.mutation(api.salesJournal.upsertSalesJournal, {
        date,
        shop_name: shopName,
        content,
        special_notes: specialNotes,
      });

      console.log('Sales journal upsert result:', {
        success: result.success,
        isUpdate: result.isUpdate,
        journalId: result.data.id,
      });

      // TODO: MVP 이후 알림 기능 재활성화
      // reminder, ownerMessage 처리는 향후 Convex notifications 시스템과 통합 예정

      // 5. 성공 응답 (기존 API 형식과 호환)
      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.isUpdate ? '영업일지가 수정되었습니다.' : '영업일지가 저장되었습니다.',
      });
    } catch (convexError: any) {
      console.error('Convex mutation error:', convexError);

      // Convex 에러 메시지 파싱 및 적절한 HTTP 상태 반환
      const errorMessage =
        convexError.message || 'Convex에서 영업일지 처리 중 오류가 발생했습니다.';

      if (errorMessage.includes('필수 입력사항') || errorMessage.includes('올바른 날짜 형식')) {
        return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
      }

      if (errorMessage.includes('권한')) {
        return NextResponse.json({ success: false, error: errorMessage }, { status: 403 });
      }

      return NextResponse.json(
        { success: false, error: '영업일지 저장에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('영업일지 저장 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 내 영업일지 목록 조회 - Convex 기반
export async function GET(req: NextRequest) {
  try {
    console.log('Sales Journal GET API called - using Convex');

    // 1. KOL 권한 체크 (Convex 기반)
    const authResult = await checkAuthConvex(['kol', 'ol', 'admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json(
        { success: false, error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // KOL 권한 확인
    if (!['kol', 'ol', 'admin'].includes(authResult.profile.role)) {
      return NextResponse.json(
        { success: false, error: 'KOL 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    console.log('Sales Journal GET - Current user:', {
      id: authResult.user._id,
      role: authResult.profile.role,
      name: authResult.profile.name,
    });

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0'); // offset 지원을 위해 유지
    const dateFilter = searchParams.get('date');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    console.log('Sales Journal GET params:', { limit, offset, dateFilter, dateFrom, dateTo });

    // Convex 쿼리 파라미터 구성
    const queryArgs: any = {
      paginationOpts: {
        numItems: Math.min(limit, 100), // 최대 100개로 제한
        cursor: offset > 0 ? offset.toString() : null, // offset을 cursor로 변환
      },
    };

    // 필터 적용
    if (dateFilter) {
      queryArgs.date = dateFilter;
    }
    if (dateFrom) {
      queryArgs.date_from = dateFrom;
    }
    if (dateTo) {
      queryArgs.date_to = dateTo;
    }

    try {
      // 3. Convex 쿼리 실행
      const result = await convex.query(api.salesJournal.getSalesJournals, queryArgs);

      console.log('Sales Journal query result:', {
        count: result.page.length,
        total: result.total,
        isDone: result.isDone,
      });

      // 4. 기존 API 응답 형식과 호환성 유지
      const journalsWithAlerts = result.page.map(journal => ({
        ...journal,
        // MVP에서는 알림 정보를 빈 객체로 반환 (호환성)
        reminder: null,
        ownerMessage: null,
      }));

      // 5. 성공 응답
      return NextResponse.json({
        success: true,
        data: journalsWithAlerts,
        pagination: {
          limit,
          offset,
          total: result.total,
          hasMore: !result.isDone,
        },
        message: '영업일지 목록을 조회했습니다.',
      });
    } catch (convexError: any) {
      console.error('Convex query error:', convexError);

      const errorMessage =
        convexError.message || 'Convex에서 영업일지 조회 중 오류가 발생했습니다.';

      if (errorMessage.includes('권한')) {
        return NextResponse.json({ success: false, error: errorMessage }, { status: 403 });
      }

      return NextResponse.json(
        { success: false, error: '영업일지 조회에 실패했습니다.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('영업일지 조회 중 오류 발생:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
