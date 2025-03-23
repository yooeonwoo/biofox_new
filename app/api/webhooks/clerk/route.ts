import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const headersList = headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Webhook 시크릿 키
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return new Response('Error: Missing webhook secret', { status: 500 });
  }

  // Clerk 이벤트 검증
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const webhook = new Webhook(webhookSecret);
  
  try {
    webhook.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook 검증 오류:', err);
    return new Response('Error: Invalid webhook signature', { status: 400 });
  }

  // 이벤트 처리
  const { type, data } = payload;
  
  if (type === 'user.created') {
    try {
      // users 테이블에서 이메일 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, role')
        .eq('email', data.email_addresses[0].email_address)
        .single();

      if (userError || !userData) {
        console.log('등록되지 않은 이메일:', data.email_addresses[0].email_address);
        // 등록되지 않은 이메일인 경우 처리
        return NextResponse.json({ message: 'Email not approved' });
      }

      // Supabase에 사용자 정보 업데이트
      const { error: updateError } = await supabase
        .from('users')
        .update({
          clerk_id: data.id,
        })
        .eq('email', data.email_addresses[0].email_address);

      if (updateError) {
        console.error('Supabase 사용자 업데이트 오류:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Clerk 사용자 메타데이터 업데이트
      const CLERK_API = 'https://api.clerk.dev/v1';
      const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
      
      await fetch(`${CLERK_API}/users/${data.id}/metadata`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_metadata: {
            role: userData.role || 'kol',
          },
        }),
      });
      
      console.log('사용자 등록 완료:', data.id, data.email_addresses[0].email_address);
      return NextResponse.json({ success: true, message: 'User created and metadata updated' });
    } catch (error) {
      console.error('웹훅 처리 오류:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Webhook processed' });
} 