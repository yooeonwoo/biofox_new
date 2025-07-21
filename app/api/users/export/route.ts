import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stringify } from 'csv-stringify/sync';

// 역할 레이블 매핑 (한국어)
const roleLabels = {
  admin: '관리자',
  kol: 'KOL',
  ol: 'OL',
  shop_owner: '상점 운영자'
};

// 상태 레이블 매핑 (한국어)
const statusLabels = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨'
};

// 사용자 내보내기 API
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({
      cookies: () => cookies(),
    });

    // 현재 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 현재 사용자의 프로필 확인 (admin 권한 체크)
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // admin 권한 확인
    if (currentUserProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const hasRelationship = searchParams.get('hasRelationship');
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Supabase 쿼리 빌드
    let query = supabase
      .from('profiles')
      .select(`
        id, name, email, role, status, shop_name, region, 
        commission_rate, total_subordinates, active_subordinates,
        naver_place_link, approved_at, created_at, updated_at
      `);

    // 필터 적용
    if (status) {
      query = query.eq('status', status);
    }
    
    if (role) {
      query = query.eq('role', role);
    }
    
    if (search && search.length >= 2) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,shop_name.ilike.%${search}%`);
    }

    // hasRelationship 필터는 복잡한 조인이 필요하므로 일단 스킵
    // 추후 RPC 함수나 View로 개선 가능

    if (createdFrom) {
      query = query.gte('created_at', createdFrom);
    }
    if (createdTo) {
      query = query.lte('created_at', createdTo);
    }

    // 정렬 적용
    const validSortFields = ['name', 'email', 'shop_name', 'created_at', 'status', 'role'];
    const orderColumn = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // 데이터 조회
    const { data: users, error: queryError } = await query;

    if (queryError) {
      console.error('Export query error:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found to export' },
        { status: 404 }
      );
    }

    // CSV 헤더 (한국어)
    const headers = [
      'ID',
      '이름',
      '이메일',
      '역할',
      '상태',
      '상점명',
      '지역',
      '수수료율 (%)',
      '총 하위 직원',
      '활성 하위 직원',
      '네이버 플레이스',
      '승인일',
      '가입일',
      '최종 수정일'
    ];

    // 데이터 변환
    const rows = users.map(user => [
      user.id,
      user.name || '',
      user.email || '',
      roleLabels[user.role as keyof typeof roleLabels] || user.role,
      statusLabels[user.status as keyof typeof statusLabels] || user.status,
      user.shop_name || '',
      user.region || '',
      user.commission_rate ? user.commission_rate.toString() : '',
      user.total_subordinates?.toString() || '0',
      user.active_subordinates?.toString() || '0',
      user.naver_place_link || '',
      user.approved_at ? new Date(user.approved_at).toLocaleDateString('ko-KR') : '',
      user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '',
      user.updated_at ? new Date(user.updated_at).toLocaleDateString('ko-KR') : ''
    ]);

    // CSV 생성
    const csvContent = stringify([headers, ...rows], {
      header: false,
      delimiter: ',',
      quote: '"',
      quoted: true,
      escape: '"'
    });

    // UTF-8 BOM 추가 (한국어 지원)
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // 파일명 생성
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = now.toISOString().split('T')[1].split(':').slice(0, 2).join('');
    let filename = `users_export_${dateString}_${timeString}`;

    // 필터 조건을 파일명에 추가
    const filters: string[] = [];
    if (status) filters.push(`status-${status}`);
    if (role) filters.push(`role-${role}`);
    if (search) filters.push(`search-${search.substring(0, 10)}`);
    
    if (filters.length > 0) {
      filename += `_${filters.join('_')}`;
    }
    
    filename += '.csv';

    // 응답 헤더 설정
    return new Response(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Export-Count': users.length.toString(),
        'X-Export-Timestamp': now.toISOString()
      }
    });

  } catch (error) {
    console.error('Export API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// 통계 정보만 반환하는 HEAD 메서드 (다운로드 전 미리보기용)
export async function HEAD(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({
      cookies: () => cookies(),
    });

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(null, { status: 401 });
    }

    // admin 권한 확인
    const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile || currentUserProfile.role !== 'admin') {
      return new Response(null, { status: 403 });
    }

    // 동일한 필터링 로직으로 카운트만 조회
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const hasRelationship = searchParams.get('hasRelationship');
    const createdFrom = searchParams.get('createdFrom');
    const createdTo = searchParams.get('createdTo');

    let query = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    // 필터 적용
    if (status) query = query.eq('status', status);
    if (role) query = query.eq('role', role);
    if (search && search.length >= 2) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,shop_name.ilike.%${search}%`);
    }
    // hasRelationship 필터는 복잡한 조인이 필요하므로 일단 스킵
    if (createdFrom) query = query.gte('created_at', createdFrom);
    if (createdTo) query = query.lte('created_at', createdTo);

    const { count, error: countError } = await query;

    if (countError) {
      return new Response(null, { status: 500 });
    }

    return new Response(null, {
      status: 200,
      headers: {
        'X-Export-Count': (count || 0).toString(),
        'X-Export-Timestamp': new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Export HEAD Error:', error);
    return new Response(null, { status: 500 });
  }
} 