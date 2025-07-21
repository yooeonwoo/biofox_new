import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 체크
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const shop_id = searchParams.get('shop_id')
    const consent_status = searchParams.get('consent_status')
    const status = searchParams.get('status')
    const subject_type = searchParams.get('subject_type')
    const search = searchParams.get('search')
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    // 임상 케이스 조회 - 동의한 케이스만
    let query = supabase
      .from('clinical_cases')
      .select(`
        *,
        shop:profiles!shop_id (
          id,
          name,
          shop_name,
          email,
          region
        ),
        photos:clinical_photos (count),
        consent_file:consent_files (id)
      `, { count: 'exact' })

    // 관리자는 동의한 케이스만 볼 수 있음
    query = query.eq('consent_status', 'consented')

    // 필터 적용
    if (shop_id) {
      query = query.eq('shop_id', shop_id)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (subject_type) {
      query = query.eq('subject_type', subject_type)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,treatment_item.ilike.%${search}%`)
    }
    if (date_from) {
      query = query.gte('start_date', date_from)
    }
    if (date_to) {
      query = query.lte('start_date', date_to)
    }

    // 정렬 및 페이지네이션
    query = query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    // 각 케이스에 대한 사진 수 계산
    const casesWithPhotoCount = await Promise.all((data || []).map(async (clinicalCase) => {
      const { count: photoCount } = await supabase
        .from('clinical_photos')
        .select('*', { count: 'exact', head: true })
        .eq('clinical_case_id', clinicalCase.id)

      return {
        ...clinicalCase,
        photo_count: photoCount || 0,
        has_consent_file: !!clinicalCase.consent_file
      }
    }))

    // 통계 계산
    const { data: stats } = await supabase
      .from('clinical_cases')
      .select('status, subject_type')
      .eq('consent_status', 'consented')

    const summary = {
      total_cases: stats?.length || 0,
      active_cases: stats?.filter(s => s.status === 'in_progress').length || 0,
      completed_cases: stats?.filter(s => s.status === 'completed').length || 0,
      self_cases: stats?.filter(s => s.subject_type === 'self').length || 0,
      customer_cases: stats?.filter(s => s.subject_type === 'customer').length || 0
    }

    return NextResponse.json({
      data: casesWithPhotoCount,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: to < (count || 0) - 1,
        hasPrev: from > 0
      },
      summary
    })

  } catch (error) {
    console.error('Clinical cases fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clinical cases' },
      { status: 500 }
    )
  }
}