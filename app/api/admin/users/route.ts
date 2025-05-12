/**
 * 사용자 관리 API
 * 관리자가 사용자를 생성, 조회, 수정, 삭제할 수 있는 API를 제공합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { users, kols } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { checkAuthSupabase } from '@/lib/auth';
import { serverSupabase } from '@/lib/supabase';
import * as clerkAdmin from '@/lib/clerk/admin';
import { clerkClient } from '@/lib/clerk-client';

/**
 * GET 요청 처리 - 모든 사용자 목록을 조회합니다.
 */
export async function GET(request: NextRequest) {
  // 관리자 권한 확인
  const authResult = await checkAuthSupabase(['admin']);
  if (authResult instanceof NextResponse) {
    console.log("권한 확인 실패:", authResult);
    return authResult;
  }

  try {
    console.log('사용자 목록 조회 API 시작');
    
    // Supabase에서 직접 SQL 쿼리로 사용자 목록 조회
    const { data, error } = await serverSupabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Supabase 쿼리 오류:`, error);
      throw new Error(`사용자 목록 조회 실패: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.log('사용자 목록이 비어 있음');
      return NextResponse.json({ users: [] });
    }
    
    console.log(`Supabase에서 사용자 ${data.length}명 조회됨`);
    
    // 사용자 정보 가공
    const formattedUsers = data.map((user) => {
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      return {
        id: user.clerk_id,
        email: user.email || '',
        firstName: nameParts[0] || '',
        lastName: nameParts.length > 1 ? nameParts[1] : '',
        role: user.role || '',
        createdAt: new Date(user.created_at).toLocaleDateString('ko-KR'),
      };
    });
    
    console.log('사용자 목록 조회 API 완료');
    return NextResponse.json({ users: formattedUsers });
  } catch (error: any) {
    console.error('사용자 목록 조회 중 오류:', error);
    
    return NextResponse.json(
      { error: '사용자 목록을 불러오는데 실패했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 새 사용자를 등록합니다.
 */
export async function POST(request: NextRequest) {
  // 관리자 권한 확인
  const authResult = await checkAuthSupabase(['admin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { email, password, firstName, lastName, role } = await request.json();

    // 필수 필드 검증
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 역할은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    console.log('사용자 생성 API 시작:', { email, firstName, lastName, role });

    // Clerk API를 사용하여 사용자 생성
    let clerkUser;
    
    try {
      // 관리자 유틸리티를 사용하여 Clerk에 사용자 생성
      clerkUser = await clerkAdmin.createUser(
        email,
        password,
        firstName || '',
        lastName || '',
        role
      );
      
      console.log('Clerk 사용자 생성 성공:', clerkUser.id);
    } catch (clerkError: any) {
      console.error('Clerk 사용자 생성 실패:', clerkError);
      throw new Error(`Clerk 사용자 생성 실패: ${clerkError.message || '알 수 없는 오류'}`);
    }

    // DB에 사용자 정보 저장
    console.log('Supabase DB에 사용자 정보 저장:', clerkUser.id);
    try {
      await db.insert(users).values({
        clerkId: clerkUser.id,
        email: email,
        name: `${firstName || ''} ${lastName || ''}`.trim(),
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('DB 저장 성공');
    } catch (dbError: any) {
      console.error('DB 저장 실패, Clerk 사용자 삭제 시도:', dbError);
      
      // DB 저장 실패 시 Clerk의 사용자도 삭제하여 일관성 유지
      try {
        await clerkAdmin.deleteUser(clerkUser.id);
        console.log('롤백: Clerk 사용자 삭제 성공');
      } catch (rollbackError) {
        console.error('롤백 중 Clerk 사용자 삭제 실패:', rollbackError);
      }
      
      throw new Error(`DB 저장 실패: ${dbError.message || '알 수 없는 오류'}`);
    }

    console.log('사용자 생성 API 완료');
    return NextResponse.json(
      { message: '사용자가 성공적으로 생성되었습니다.', user: clerkUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('사용자 생성 중 오류:', error);
    return NextResponse.json(
      { error: '사용자 생성에 실패했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH 요청 처리 - 사용자의 역할을 업데이트합니다.
 */
export async function PATCH(request: NextRequest) {
  // 관리자 권한 확인
  const authResult = await checkAuthSupabase(['admin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { userId, role } = await request.json();

    // 필수 필드 검증
    if (!userId || !role) {
      return NextResponse.json(
        { error: '사용자 ID와 역할은 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    console.log('사용자 역할 업데이트 API 시작:', { userId, role });

    // 1. Clerk의 사용자 메타데이터 업데이트
    try {
      // 관리자 유틸리티를 사용하여 Clerk 사용자 역할 업데이트
      await clerkAdmin.updateUserRole(userId, role);
      console.log('Clerk 사용자 역할 업데이트 성공');
    } catch (clerkError: any) {
      console.error('Clerk 사용자 역할 업데이트 실패:', clerkError);
      // Clerk 실패 시에도 DB 업데이트는 계속 진행
    }

    // 2. Supabase에서 직접 SQL 쿼리로 사용자 역할 업데이트
    const { data, error } = await serverSupabase
      .from('users')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select();

    if (error) {
      console.error('Supabase 사용자 역할 업데이트 실패:', error);
      throw new Error(`사용자 역할 업데이트 실패: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('Supabase에서 사용자를 찾을 수 없음:', userId);
      return NextResponse.json(
        { error: '해당 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('사용자 역할 업데이트 API 완료:', { userId, role });
    return NextResponse.json(
      { message: '사용자 역할이 성공적으로 업데이트되었습니다.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('사용자 역할 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '사용자 역할 업데이트에 실패했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE 요청 처리 - 사용자를 삭제합니다.
 */
export async function DELETE(request: NextRequest) {
  // 관리자 권한 확인
  const authResult = await checkAuthSupabase(['admin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('사용자 삭제 API 시작:', userId);

    // 1. Clerk에서 사용자 삭제 시도
    try {
      // 관리자 유틸리티를 사용하여 Clerk에서 사용자 삭제
      await clerkAdmin.deleteUser(userId);
      console.log('Clerk에서 사용자 삭제 성공');
    } catch (clerkError: any) {
      console.error('Clerk에서 사용자 삭제 실패:', clerkError);
      // Clerk 삭제 실패는 무시하고 계속 진행 (사용자가 이미 없을 수 있음)
    }

    // 2. Supabase에서 사용자 정보 조회
    const { data: userData, error: userError } = await serverSupabase
      .from('users')
      .select('id, clerk_id')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      console.error('Supabase에서 사용자 조회 실패:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 조회할 수 없습니다.' },
        { status: 404 }
      );
    }

    if (!userData) {
      console.log('Supabase에서 사용자를 찾을 수 없음:', userId);
      return NextResponse.json(
        { error: '해당 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const internalUserId = userData.id;
    
    // 3. KOL ID 조회 (KOL 관련 테이블 삭제를 위해)
    const { data: kolData, error: kolError } = await serverSupabase
      .from('kols')
      .select('id')
      .eq('user_id', internalUserId)
      .single();
    
    // KOL ID가 있는 경우 KOL 관련 레코드 삭제 수행
    if (kolData && !kolError) {
      const kolId = kolData.id;
      try {
        // 3.1 commissions 테이블 레코드 삭제
        console.log('KOL의 commission 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('commissions')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.2 product_sales_ratios 테이블 레코드 삭제
        console.log('KOL의 product_sales_ratios 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('product_sales_ratios')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.3 monthly_sales 테이블 레코드 삭제
        console.log('KOL의 monthly_sales 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('monthly_sales')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.4 kol_monthly_summary 테이블 레코드 삭제
        console.log('KOL의 kol_monthly_summary 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('kol_monthly_summary')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.5 sales_activities 테이블 레코드 삭제
        console.log('KOL의 sales_activities 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('sales_activities')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.6 shop_product_sales 테이블 레코드 삭제
        console.log('KOL의 shop_product_sales 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('shop_product_sales')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.7 kol_product_summary 테이블 레코드 삭제
        console.log('KOL의 kol_product_summary 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('kol_product_summary')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.8 kol_dashboard_metrics 테이블 레코드 삭제
        console.log('KOL의 kol_dashboard_metrics 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('kol_dashboard_metrics')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.9 kol_total_monthly_sales 테이블 레코드 삭제
        console.log('KOL의 kol_total_monthly_sales 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('kol_total_monthly_sales')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.10 product_sales_metrics 테이블 레코드 삭제
        console.log('KOL의 product_sales_metrics 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('product_sales_metrics')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.11 shop_sales_summary 테이블 레코드 삭제
        console.log('KOL의 shop_sales_summary 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('shop_sales_summary')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.12 shops 테이블 레코드 삭제
        console.log('KOL의 shops 데이터 삭제 중:', kolId);
        await serverSupabase
          .from('shops')
          .delete()
          .eq('kol_id', kolId);
        
        // 3.13 KOL 자체 삭제
        console.log('KOL 데이터 삭제 중:', kolId);
        const { error: kolDeleteError } = await serverSupabase
          .from('kols')
          .delete()
          .eq('id', kolId);

        if (kolDeleteError) {
          console.error('KOL 데이터 삭제 실패:', kolDeleteError);
          // 명시적으로 SQL 쿼리 실행 시도 (외래 키 참조가 누락된 경우)
          const { error: sqlError } = await serverSupabase.rpc('force_delete_kol', { kol_id: kolId });
          if (sqlError) {
            console.error('SQL로 KOL 삭제 시도 실패:', sqlError);
          }
        }
      } catch (kolError) {
        console.error('KOL 관련 데이터 삭제 중 오류:', kolError);
        // 오류가 발생해도 계속 진행
      }
    }
    
    // 4. 알림 데이터 삭제
    console.log('관련 알림 데이터 삭제 중:', internalUserId);
    try {
      await serverSupabase
        .from('notifications')
        .delete()
        .eq('user_id', internalUserId);
    } catch (notificationError) {
      console.error('알림 데이터 삭제 실패:', notificationError);
      // 계속 진행
    }
    
    try {
      // 5. 직접 SQL을 사용해 사용자 삭제 시도
      console.log('SQL로 사용자 데이터 삭제 시도 중:', internalUserId);
      
      // 모든 참조를 찾아 삭제하는 SQL 실행
      const { error: sqlError } = await serverSupabase.rpc('force_delete_user', { user_id: internalUserId });
      
      if (sqlError) {
        console.error('SQL 사용자 삭제 실패:', sqlError);
        // 일반적인 방법으로 사용자 삭제 시도
        console.log('사용자 데이터 삭제 중:', internalUserId);
        const { data, error } = await serverSupabase
          .from('users')
          .delete()
          .eq('id', internalUserId)
          .select();

        if (error) {
          console.error('Supabase에서 사용자 삭제 실패:', error);
          throw new Error(`사용자 삭제 실패: ${error.message}`);
        }
      }
    } catch (finalError) {
      console.error('최종 사용자 삭제 실패:', finalError);
      throw finalError;
    }

    console.log('사용자 삭제 API 완료:', userId);
    return NextResponse.json(
      { message: '사용자가 성공적으로 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('사용자 삭제 중 오류:', error);
    return NextResponse.json(
      { error: '사용자 삭제에 실패했습니다.', details: error.message },
      { status: 500 }
    );
  }
}