import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function checkAdminAuth(request: NextRequest) {
  // 개발 환경에서는 인증 스킵
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log(`Development mode: API authentication skipped for ${request.url}`);
    return { authorized: true, user: null };
  }

  // 프로덕션 환경에서만 인증 확인
  const supabase = await createClient();
  
  const authHeader = request.headers.get('authorization');
  let currentUser = null;
  let authError = null as any;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    currentUser = data?.user || null;
    authError = error;
  } else {
    const { data: cookieData, error: cookieError } = await supabase.auth.getUser();
    currentUser = cookieData.user;
    authError = cookieError;
  }

  if (authError || !currentUser) {
    return {
      authorized: false,
      error: NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    };
  }

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    return {
      authorized: false,
      error: NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    };
  }

  return { authorized: true, user: currentUser };
}

export async function checkKolAuth(request: NextRequest) {
  // 개발 환경에서는 인증 스킵
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.log(`Development mode: API authentication skipped for ${request.url}`);
    return { authorized: true, user: null };
  }

  // 프로덕션 환경에서만 인증 확인
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    };
  }

  // KOL 권한 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'kol' && profile?.role !== 'admin') {
    return {
      authorized: false,
      error: NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    };
  }

  return { authorized: true, user };
}