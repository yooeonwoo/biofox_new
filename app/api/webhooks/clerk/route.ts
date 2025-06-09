import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase';
import { WebhookEvent } from '@clerk/nextjs/server';
import clerkApi from '@/lib/clerk-direct-api';

export async function POST(req: Request) {
  console.log('========== 웹훅 호출 시작 ==========');
  console.log('요청 시간:', new Date().toISOString());
  
  // Next.js 15의 비동기 headers API 처리
  const headersList = await headers();
  console.log('수신된 헤더들:', Object.fromEntries(headersList.entries()));
  
  // 환경 변수 검증
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  console.log('웹훅 시크릿 설정 여부:', !!CLERK_WEBHOOK_SECRET);
  
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
  console.log('웹훅 페이로드:', JSON.stringify(payload, null, 2));

  // svix 인스턴스 생성 및 서명 검증
  let evt: WebhookEvent;
  try {
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
    console.log('웹훅 서명 검증 성공');
  } catch (err) {
    console.error('웹훅 서명 검증 실패:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // 이벤트 유형 및 데이터 가져오기
  const { type, data } = evt;
  console.log(`========== 웹훅 이벤트: ${type} ==========`);
  console.log('이벤트 데이터:', JSON.stringify(data, null, 2));
  
  // 사용자 관련 이벤트 처리
  if (type === 'user.created' || type === 'user.updated' || type === 'user.deleted') {
    try {
      if (type === 'user.deleted') {
        // 사용자 삭제 이벤트 처리
        const clerkId = data.id;
        console.log(`사용자 삭제 이벤트: Clerk ID=${clerkId}`);
        
        // Supabase에서 사용자 찾기
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkId)
          .single();
        
        if (userError) {
          console.log(`삭제할 사용자를 찾을 수 없음: clerk_id=${clerkId}`);
          return NextResponse.json({ message: 'User not found for deletion' });
        }
        
        // 사용자 clerk_id를 삭제됨으로 표시
        const { error: updateError } = await supabase
          .from('users')
          .update({ clerk_id: `deleted_${Date.now()}` })
          .eq('id', userData.id);
        
        if (updateError) {
          console.error(`사용자 삭제 상태 업데이트 실패(ID=${userData.id}):`, updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        console.log(`사용자 삭제 처리 완료: ID=${userData.id}`);
        return NextResponse.json({ success: true, message: 'User marked as deleted' });
      }
      
      // 사용자 생성 또는 업데이트 이벤트 처리
      if (!data.email_addresses || data.email_addresses.length === 0) {
        console.error('이메일 주소 없음:', data);
        return NextResponse.json({ error: 'No email address found' }, { status: 400 });
      }
      
      const clerkId = data.id;
      const userEmail = data.email_addresses[0].email_address;
      const userName = (data.first_name && data.last_name) 
        ? `${data.first_name} ${data.last_name}`
        : data.first_name || '';
      
      console.log(`사용자 ${type === 'user.created' ? '생성' : '업데이트'}: ID=${clerkId}, 이메일=${userEmail}, 이름=${userName || 'N/A'}`);
      
      // 초대된 사용자만 회원가입 허용 - 이메일로 pending 사용자 검색
      console.log(`초대 여부 확인: ${userEmail}`);
      const { data: invitedUser, error: emailError } = await supabase
        .from('users')
        .select('id, email, role, clerk_id, name')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (emailError) {
        console.error(`초대 사용자 검색 오류(${userEmail}):`, emailError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      
      // 초대되지 않은 사용자는 가입 거부
      if (!invitedUser) {
        console.log(`🚫 초대되지 않은 이메일로 가입 시도: ${userEmail}`);
        console.log(`🚫 Clerk ID: ${clerkId} - 이 사용자는 삭제됩니다.`);
        
        // Clerk에서 사용자 삭제 (가입 차단)
        try {
          const { deleteUser: clerkDeleteUser } = await import("@/lib/clerk/admin");
          await clerkDeleteUser(clerkId);
          console.log(`✅ 초대되지 않은 사용자 Clerk에서 삭제 완료: ${clerkId}`);
        } catch (deleteError) {
          console.error(`❌ Clerk 사용자 삭제 실패: ${clerkId}`, deleteError);
          
          // 삭제 실패 시 더 강력한 방법 시도
          try {
            console.log(`🔄 Clerk API 직접 호출로 재시도: ${clerkId}`);
            const response = await fetch(`https://api.clerk.dev/v1/users/${clerkId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              console.log(`✅ Clerk API 직접 호출로 삭제 성공: ${clerkId}`);
            } else {
              console.error(`❌ Clerk API 직접 호출도 실패: ${response.status} ${response.statusText}`);
            }
          } catch (directApiError) {
            console.error(`❌ Clerk API 직접 호출 오류:`, directApiError);
          }
        }
        
        return NextResponse.json({ 
          error: 'Not invited',
          message: '초대되지 않은 이메일입니다. 관리자에게 문의하세요.',
          clerkId: clerkId,
          email: userEmail,
          action: 'deleted'
        }, { status: 403 });
      }
      
      console.log(`초대된 사용자 발견: ID=${invitedUser.id}, 현재 Clerk ID=${invitedUser.clerk_id}`);
      
      // pending 상태가 아니면 이미 가입된 사용자
      if (!invitedUser.clerk_id.startsWith('pending_')) {
        console.log(`이미 가입된 사용자: ID=${invitedUser.id}, Clerk ID=${invitedUser.clerk_id}`);
        
        // 기존 사용자 정보 업데이트 (이름 등)
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            name: userName || invitedUser.name || userEmail.split('@')[0]
          })
          .eq('id', invitedUser.id);
        
        if (updateError) {
          console.error(`기존 사용자 정보 업데이트 실패(ID=${invitedUser.id}):`, updateError);
        }
        
        // Clerk 메타데이터 업데이트
        try {
          await clerkApi.updateUserMetadata(clerkId, {
            public_metadata: {
              role: invitedUser.role,
              userId: invitedUser.id,
              updated_at: new Date().toISOString()
            }
          });
          
          console.log(`기존 사용자 Clerk 메타데이터 업데이트: ID=${clerkId}`);
        } catch (apiError) {
          console.error('Clerk API 오류:', apiError);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Existing user updated',
          userId: invitedUser.id,
          role: invitedUser.role
        });
      }
      
      // pending 사용자를 실제 가입으로 전환
      console.log(`Pending 사용자를 가입으로 전환: ID=${invitedUser.id}`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          clerk_id: clerkId,
          name: userName || invitedUser.name || userEmail.split('@')[0]
        })
        .eq('id', invitedUser.id);
      
      if (updateError) {
        console.error(`Pending 사용자 업데이트 실패(ID=${invitedUser.id}):`, updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      console.log(`Pending 사용자 업데이트 성공: ID=${invitedUser.id}, Clerk ID=${clerkId}`);
      
      // KOL 역할인 경우 KOL 상태도 active로 변경
      if (invitedUser.role === 'kol') {
        const { error: kolUpdateError } = await supabase
          .from('kols')
          .update({ status: 'active' })
          .eq('user_id', invitedUser.id);
        
        if (kolUpdateError) {
          console.error(`KOL 상태 업데이트 실패(user_id=${invitedUser.id}):`, kolUpdateError);
        } else {
          console.log(`KOL 상태를 active로 변경: user_id=${invitedUser.id}`);
        }
      }
      
      // Clerk 메타데이터 업데이트
      try {
        await clerkApi.updateUserMetadata(clerkId, {
          public_metadata: {
            role: invitedUser.role,
            userId: invitedUser.id,
            activated_at: new Date().toISOString()
          }
        });
        
        console.log(`새 가입 사용자 Clerk 메타데이터 설정 완료: ID=${clerkId}, Role=${invitedUser.role}`);
      } catch (apiError) {
        console.error('Clerk API 오류:', apiError);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invited user successfully activated',
        userId: invitedUser.id,
        role: invitedUser.role
      });
    } catch (error) {
      console.error('웹훅 처리 오류:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  
  // 다른 이벤트는 성공으로 처리
  return NextResponse.json({ success: true, message: `Webhook received: ${type}` });
} 