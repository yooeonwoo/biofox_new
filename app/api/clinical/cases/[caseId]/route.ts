import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 임상 케이스 조회 (본인 것만)
    const { data: clinicalCase, error } = await supabase
      .from('clinical_cases')
      .select(`
        *,
        photos:clinical_photos (
          id,
          session_number,
          photo_type,
          file_path,
          created_at
        ),
        consent_file:consent_files (
          id,
          file_path,
          file_name,
          created_at
        )
      `)
      .eq('id', params.caseId)
      .eq('shop_id', user.id)
      .single()

    if (error) throw error

    if (!clinicalCase) {
      return NextResponse.json({ error: 'Clinical case not found' }, { status: 404 })
    }

    return NextResponse.json({ data: clinicalCase })

  } catch (error) {
    console.error('Clinical case fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clinical case' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      gender,
      age,
      treatment_item,
      status,
      consent_status,
      marketing_consent,
      notes,
      end_date
    } = body

    // 본인의 임상 케이스인지 확인
    const { data: existing } = await supabase
      .from('clinical_cases')
      .select('id')
      .eq('id', params.caseId)
      .eq('shop_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Clinical case not found' }, { status: 404 })
    }

    // 업데이트
    const updateData: any = {
      name,
      gender,
      age,
      treatment_item,
      status,
      consent_status,
      marketing_consent,
      notes,
      updated_at: new Date().toISOString()
    }

    if (consent_status === 'consented' && !existing.consent_date) {
      updateData.consent_date = new Date().toISOString()
    }

    if (status === 'completed' && end_date) {
      updateData.end_date = end_date
    }

    const { data, error } = await supabase
      .from('clinical_cases')
      .update(updateData)
      .eq('id', params.caseId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Clinical case update error:', error)
    return NextResponse.json(
      { error: 'Failed to update clinical case' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 본인의 임상 케이스인지 확인
    const { data: existing } = await supabase
      .from('clinical_cases')
      .select('id')
      .eq('id', params.caseId)
      .eq('shop_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Clinical case not found' }, { status: 404 })
    }

    // 관련 사진들 삭제 (Storage에서도)
    const { data: photos } = await supabase
      .from('clinical_photos')
      .select('file_path')
      .eq('clinical_case_id', params.caseId)

    if (photos && photos.length > 0) {
      const filePaths = photos.map(p => p.file_path)
      await supabase.storage
        .from('clinical-photos')
        .remove(filePaths)
    }

    // 동의서 삭제
    const { data: consentFile } = await supabase
      .from('consent_files')
      .select('file_path')
      .eq('clinical_case_id', params.caseId)
      .single()

    if (consentFile) {
      await supabase.storage
        .from('consent-files')
        .remove([consentFile.file_path])
    }

    // 임상 케이스 삭제 (cascade로 photos, consent_files도 삭제됨)
    const { error } = await supabase
      .from('clinical_cases')
      .delete()
      .eq('id', params.caseId)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Clinical case delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete clinical case' },
      { status: 500 }
    )
  }
}