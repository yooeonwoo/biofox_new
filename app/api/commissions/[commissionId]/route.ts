import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { checkAuthConvex } from '@/lib/auth';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// 개별 수수료 계산 상세 조회 (Convex 기반)
export async function GET(request: NextRequest, { params }: { params: { commissionId: string } }) {
  try {
    console.log('Commission detail GET API called - using Convex');

    // 관리자 권한 확인
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log(
      'Commission detail - User:',
      authResult.user._id,
      'Commission ID:',
      params.commissionId
    );

    try {
      // Convex 쿼리 실행
      const commission = await convex.query(api.commissions.getCommissionCalculationDetail, {
        commissionId: params.commissionId as any,
      });

      console.log('Commission detail result:', {
        id: commission.id,
        kol_name: commission.kol?.name,
        total_commission: commission.total_commission,
        status: commission.status,
      });

      return NextResponse.json(commission);
    } catch (convexError: any) {
      console.error('Convex commission detail query error:', convexError);

      if (
        convexError.message?.includes('not found') ||
        convexError.message?.includes('Not found')
      ) {
        return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'Failed to fetch commission details from Convex' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Commission detail fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch commission details' }, { status: 500 });
  }
}

// 수수료 계산 업데이트 (조정, 상태 변경) (Convex 기반)
export async function PUT(request: NextRequest, { params }: { params: { commissionId: string } }) {
  try {
    console.log('Commission PUT API called - using Convex');

    // 관리자 권한 확인
    const authResult = await checkAuthConvex(['admin']);
    if (!authResult.user || !authResult.profile) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (authResult.profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { adjustment_amount, adjustment_reason, status, payment_info } = body;

    console.log('Commission update request:', {
      commissionId: params.commissionId,
      adjustment_amount,
      adjustment_reason,
      status,
      has_payment_info: !!payment_info,
    });

    // 입력 검증
    if (adjustment_amount !== undefined) {
      if (typeof adjustment_amount !== 'number') {
        return NextResponse.json({ error: 'Adjustment amount must be a number' }, { status: 400 });
      }
      if (!adjustment_reason || typeof adjustment_reason !== 'string') {
        return NextResponse.json(
          { error: 'Adjustment reason is required when adjustment amount is provided' },
          { status: 400 }
        );
      }
    }

    if (status && !['calculated', 'reviewed', 'approved', 'paid', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    try {
      // Convex 뮤테이션 실행
      const updateArgs: any = {
        commissionId: params.commissionId as any,
      };

      if (adjustment_amount !== undefined) {
        updateArgs.adjustment_amount = adjustment_amount;
        updateArgs.adjustment_reason = adjustment_reason;
      }

      if (status) {
        updateArgs.status = status;
      }

      if (payment_info) {
        updateArgs.payment_info = {
          payment_date: payment_info.payment_date
            ? new Date(payment_info.payment_date).getTime()
            : undefined,
          payment_reference: payment_info.payment_reference,
        };
      }

      const result = await convex.mutation(api.commissions.updateCommissionCalculation, updateArgs);

      console.log('Commission update result:', result);

      return NextResponse.json({ success: true, data: result });
    } catch (convexError: any) {
      console.error('Convex commission update error:', convexError);

      if (
        convexError.message?.includes('not found') ||
        convexError.message?.includes('Not found')
      ) {
        return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Failed to update commission in Convex' }, { status: 500 });
    }
  } catch (error) {
    console.error('Commission update error:', error);
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}
