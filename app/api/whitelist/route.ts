import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

// 화이트리스트 목록 조회
export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId || sessionClaims?.role !== '본사관리자') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('whitelisted_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('화이트리스트 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('화이트리스트 API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 화이트리스트 이메일 추가
export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId || sessionClaims?.role !== '본사관리자') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 이미 존재하는 이메일인지 확인
    const { data: existingEmail } = await supabase
      .from('whitelisted_emails')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists in whitelist' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('whitelisted_emails')
      .insert({ 
        email, 
        role: role || 'kol',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('화이트리스트 추가 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('화이트리스트 API 오류:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}