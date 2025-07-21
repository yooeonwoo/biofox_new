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
    const session_number = parseInt(formData.get('session_number') as string)
    const photo_type = formData.get('photo_type') as string

    if (!file || !clinical_case_id || session_number === undefined || !photo_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // 파일 타입 체크
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 본인의 임상 케이스인지 확인
    const { data: clinicalCase } = await supabase
      .from('clinical_cases')
      .select('id, shop_id')
      .eq('id', clinical_case_id)
      .eq('shop_id', user.id)
      .single()

    if (!clinicalCase) {
      return NextResponse.json({ error: 'Clinical case not found' }, { status: 404 })
    }

    // 기존 사진이 있는지 확인 (같은 session_number, photo_type)
    const { data: existingPhoto } = await supabase
      .from('clinical_photos')
      .select('id, file_path')
      .eq('clinical_case_id', clinical_case_id)
      .eq('session_number', session_number)
      .eq('photo_type', photo_type)
      .single()

    // 파일명 생성
    const fileExt = file.name.split('.').pop()
    const fileName = `${clinical_case_id}/${session_number}/${photo_type}_${Date.now()}.${fileExt}`

    // Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('clinical-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 기존 사진이 있으면 삭제
    if (existingPhoto) {
      await supabase.storage
        .from('clinical-photos')
        .remove([existingPhoto.file_path])
      
      await supabase
        .from('clinical_photos')
        .delete()
        .eq('id', existingPhoto.id)
    }

    // DB에 기록
    const { data: photo, error: dbError } = await supabase
      .from('clinical_photos')
      .insert({
        clinical_case_id,
        session_number,
        photo_type,
        file_path: fileName,
        file_size: file.size,
        upload_date: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      // DB 저장 실패시 업로드한 파일 삭제
      await supabase.storage
        .from('clinical-photos')
        .remove([fileName])
      throw dbError
    }

    // 임상 케이스의 total_sessions 업데이트
    if (session_number > 0) {
      const { data: currentCase } = await supabase
        .from('clinical_cases')
        .select('total_sessions')
        .eq('id', clinical_case_id)
        .single()

      if (currentCase && (!currentCase.total_sessions || currentCase.total_sessions < session_number)) {
        await supabase
          .from('clinical_cases')
          .update({ 
            total_sessions: session_number,
            latest_session: session_number,
            updated_at: new Date().toISOString()
          })
          .eq('id', clinical_case_id)
      }
    }

    // Storage URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('clinical-photos')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      data: {
        ...photo,
        url: publicUrl
      }
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}