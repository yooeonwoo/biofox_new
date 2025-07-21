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

    // 전체 통계
    const { data: allCases } = await supabase
      .from('clinical_cases')
      .select('*')

    const consentedCases = allCases?.filter(c => c.consent_status === 'consented') || []
    const nonConsentedCases = allCases?.filter(c => c.consent_status === 'no_consent') || []

    // 샵별 통계
    const { data: shopStats } = await supabase
      .from('clinical_cases')
      .select(`
        shop_id,
        shop:profiles!shop_id (
          name,
          shop_name
        ),
        status,
        consent_status,
        total_sessions
      `)

    const shopSummary = new Map()
    
    for (const stat of shopStats || []) {
      const key = stat.shop_id
      if (!shopSummary.has(key)) {
        shopSummary.set(key, {
          shop_id: stat.shop_id,
          shop_name: stat.shop?.shop_name,
          total_cases: 0,
          active_cases: 0,
          consent_rate: 0,
          average_sessions: 0,
          total_sessions: 0,
          consented_cases: 0
        })
      }
      
      const summary = shopSummary.get(key)
      summary.total_cases++
      if (stat.status === 'in_progress') summary.active_cases++
      if (stat.consent_status === 'consented') summary.consented_cases++
      summary.total_sessions += stat.total_sessions || 0
    }

    const byShop = Array.from(shopSummary.values()).map(s => ({
      ...s,
      consent_rate: s.total_cases > 0 ? (s.consented_cases / s.total_cases) * 100 : 0,
      average_sessions: s.total_cases > 0 ? s.total_sessions / s.total_cases : 0
    }))

    // 치료 항목별 통계
    const treatmentMap = new Map()
    
    for (const c of consentedCases) {
      const treatment = c.treatment_item || '기타'
      if (!treatmentMap.has(treatment)) {
        treatmentMap.set(treatment, {
          treatment_item: treatment,
          count: 0,
          total_sessions: 0,
          completed_count: 0
        })
      }
      
      const stat = treatmentMap.get(treatment)
      stat.count++
      stat.total_sessions += c.total_sessions || 0
      if (c.status === 'completed') stat.completed_count++
    }

    const byTreatment = Array.from(treatmentMap.values()).map(t => ({
      ...t,
      average_sessions: t.count > 0 ? t.total_sessions / t.count : 0,
      completion_rate: t.count > 0 ? (t.completed_count / t.count) * 100 : 0
    }))

    // 최근 활동
    const { data: recentActivities } = await supabase
      .from('clinical_cases')
      .select(`
        id,
        name,
        created_at,
        updated_at,
        status,
        shop:profiles!shop_id (
          shop_name
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(10)

    const { data: recentPhotos } = await supabase
      .from('clinical_photos')
      .select(`
        id,
        created_at,
        session_number,
        clinical_case:clinical_cases!clinical_case_id (
          id,
          name,
          shop:profiles!shop_id (
            shop_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const activities = [
      ...recentActivities?.map(a => ({
        type: 'case_updated' as const,
        case_id: a.id,
        shop_name: a.shop?.shop_name,
        subject_name: a.name,
        timestamp: a.updated_at
      })) || [],
      ...recentPhotos?.map(p => ({
        type: 'photo_uploaded' as const,
        case_id: p.clinical_case?.id,
        shop_name: p.clinical_case?.shop?.shop_name,
        subject_name: p.clinical_case?.name,
        timestamp: p.created_at,
        session_number: p.session_number
      })) || []
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10)

    return NextResponse.json({
      overview: {
        total_cases: allCases?.length || 0,
        active_cases: allCases?.filter(c => c.status === 'in_progress').length || 0,
        completed_cases: allCases?.filter(c => c.status === 'completed').length || 0,
        average_sessions: allCases?.reduce((sum, c) => sum + (c.total_sessions || 0), 0) / (allCases?.length || 1),
        consent_rate: allCases?.length ? (consentedCases.length / allCases.length) * 100 : 0,
        consented_count: consentedCases.length,
        non_consented_count: nonConsentedCases.length
      },
      by_shop: byShop.sort((a, b) => b.total_cases - a.total_cases),
      by_treatment: byTreatment.sort((a, b) => b.count - a.count),
      recent_activities: activities
    })

  } catch (error) {
    console.error('Clinical dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clinical dashboard' },
      { status: 500 }
    )
  }
}