import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase } from '@/db/utils';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const headersList = headers();
  
  // 환경 변수 검증
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET 환경 변수가 설정되지 않았습니다.');
    return NextResponse.json(
      { error: 'Webhook secret is not configured' },
      { status: 500 }
    );
  }

  // svix-id, svix-timestamp, svix-signature 헤더 가져오기
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  // 필수 헤더 검증
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('웹훅 헤더 누락:', { svixId, svixTimestamp, svixSignature });
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // 요청 본문 가져오기
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // svix 인스턴스 생성 및 서명 검증
  let evt: WebhookEvent;
  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('웹훅 서명 검증 실패:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // 이벤트 유형 및 데이터 가져오기
  const { type, data } = evt;
  console.log(`웹훅 이벤트: ${type}`);
  
  // user.created 이벤트 처리
  if (type === 'user.created') {
    try {
      if (!data.email_addresses || data.email_addresses.length === 0) {
        console.error('이메일 주소 없음:', data);
        return NextResponse.json({ error: 'No email address found' }, { status: 400 });
      }
      
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
      
      if (!CLERK_SECRET_KEY) {
        console.error('CLERK_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
        return NextResponse.json({ error: 'Clerk API key is not configured' }, { status: 500 });
      }
      
      const response = await fetch(`${CLERK_API}/users/${data.id}/metadata`, {
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
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Clerk API 오류:', errorData);
        return NextResponse.json({ error: 'Clerk API error' }, { status: 500 });
      }
      
      console.log('사용자 등록 완료:', data.id, data.email_addresses[0].email_address);
      return NextResponse.json({ success: true, message: 'User created and metadata updated' });
    } catch (error) {
      console.error('웹훅 처리 오류:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  
  // 다른 이벤트는 성공으로 처리
  return NextResponse.json({ success: true, message: `Webhook received: ${type}` });
} 