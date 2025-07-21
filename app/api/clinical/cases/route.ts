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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const subject_type = searchParams.get('subject_type')

    // 본인의 임상 케이스만 조회
    let query = supabase
      .from('clinical_cases')
      .select(`
        *,
        photos:clinical_photos (count),
        consent_file:consent_files (id)
      `, { count: 'exact' })
      .eq('shop_id', user.id)

    // 필터 적용
    if (status) {
      query = query.eq('status', status)
    }
    if (subject_type) {
      query = query.eq('subject_type', subject_type)
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

    return NextResponse.json({
      data: casesWithPhotoCount,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Clinical cases fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clinical cases' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      subject_type,
      name,
      gender,
      age,
      treatment_item,
      consent_status,
      marketing_consent,
      notes
    } = body

    // 임상 케이스 생성
    const { data: clinicalCase, error } = await supabase
      .from('clinical_cases')
      .insert({
        shop_id: user.id,
        subject_type,
        name,
        gender,
        age,
        treatment_item,
        consent_status,
        consent_date: consent_status === 'consented' ? new Date().toISOString() : null,
        marketing_consent: marketing_consent || false,
        notes,
        status: 'in_progress',
        start_date: new Date().toISOString().split('T')[0],
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data: clinicalCase })

  } catch (error) {
    console.error('Clinical case creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create clinical case' },
      { status: 500 }
    )
  }
}