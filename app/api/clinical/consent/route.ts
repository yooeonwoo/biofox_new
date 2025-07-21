import { createServerClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    
    // 인증 체크
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const clinical_case_id = formData.get('clinical_case_id') as string

    if (!file || !clinical_case_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    // 파일 타입 체크
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 본인의 임상 케이스인지 확인
    const { data: clinicalCase } = await supabase
      .from('clinical_cases')
      .select('id, shop_id, consent_status')
      .eq('id', clinical_case_id)
      .eq('shop_id', user.id)
      .single()

    if (!clinicalCase) {
      return NextResponse.json({ error: 'Clinical case not found' }, { status: 404 })
    }

    if (clinicalCase.consent_status !== 'consented') {
      return NextResponse.json({ error: 'Consent not given for this case' }, { status: 400 })
    }

    // 기존 동의서가 있는지 확인
    const { data: existingConsent } = await supabase
      .from('consent_files')
      .select('id, file_path')
      .eq('clinical_case_id', clinical_case_id)
      .single()

    // 파일명 생성
    const fileExt = file.name.split('.').pop()
    const fileName = `${clinical_case_id}/consent_${Date.now()}.${fileExt}`

    // Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('consent-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 기존 동의서가 있으면 삭제
    if (existingConsent) {
      await supabase.storage
        .from('consent-files')
        .remove([existingConsent.file_path])
      
      await supabase
        .from('consent_files')
        .delete()
        .eq('id', existingConsent.id)
    }

    // DB에 기록
    const { data: consent, error: dbError } = await supabase
      .from('consent_files')
      .insert({
        clinical_case_id,
        file_path: fileName,
        file_name: file.name,
        file_size: file.size,
        upload_date: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      // DB 저장 실패시 업로드한 파일 삭제
      await supabase.storage
        .from('consent-files')
        .remove([fileName])
      throw dbError
    }

    // Storage URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('consent-files')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      data: {
        ...consent,
        url: publicUrl
      }
    })

  } catch (error) {
    console.error('Consent upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload consent file' },
      { status: 500 }
    )
  }
}