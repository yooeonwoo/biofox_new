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
        : data.first_name || userEmail.split('@')[0];
      
      console.log(`사용자 ${type === 'user.created' ? '생성' : '업데이트'}: ID=${clerkId}, 이메일=${userEmail}, 이름=${userName}`);
      
      // Clerk Allowlist에서 이 이메일이 허용되는지 확인
      console.log(`🔍 Allowlist 확인 시작: ${userEmail}`);
      let isInAllowlist = false;
      try {
        console.log('🔍 Allowlist API 호출 중...');
        const allowlistResponse = await clerkApi.makeRequest('/allowlist_identifiers');
        const allowlistData = allowlistResponse?.data || allowlistResponse || [];
        
        if (!Array.isArray(allowlistData)) {
          console.error('❌ Allowlist 응답이 배열이 아님:', typeof allowlistData);
          isInAllowlist = false;
        } else {
          console.log(`🔍 Allowlist 데이터 수신됨: ${allowlistData.length}개 항목`);
          isInAllowlist = allowlistData.some((item: any) => item.identifier === userEmail);
          console.log(`🔍 Allowlist 확인 결과: ${isInAllowlist ? '✅ 허용됨' : '❌ 허용되지 않음'}`);
          
          // 디버깅: 유사한 이메일 찾기
          const similarEmails = allowlistData
            .filter((item: any) => item.identifier && item.identifier.includes(userEmail.split('@')[0]))
            .map((item: any) => item.identifier);
          if (similarEmails.length > 0) {
            console.log('🔍 유사한 이메일들:', similarEmails);
          }
        }
        
      } catch (allowlistError) {
        console.error('❌ Allowlist 확인 실패:', allowlistError);
        console.error('❌ Allowlist 오류 상세:', allowlistError.message);
        // Allowlist 확인에 실패하면 기본적으로 거부
        isInAllowlist = false;
      }
      
      // Allowlist에 없는 사용자는 가입 거부
      if (!isInAllowlist) {
        console.log(`🚫 Allowlist에 없는 이메일로 가입 시도: ${userEmail}`);
        console.log(`🚫 Clerk ID: ${clerkId} - 이 사용자는 삭제됩니다.`);
        
        // Clerk에서 사용자 삭제 (가입 차단)
        try {
          await clerkApi.deleteUser(clerkId);
          console.log(`✅ Allowlist에 없는 사용자 Clerk에서 삭제 완료: ${clerkId}`);
        } catch (deleteError: any) {
          // 이미 삭제된 사용자인 경우 오류 무시
          if (deleteError.message?.includes('not found') || deleteError.message?.includes('404')) {
            console.log(`ℹ️ 이미 삭제된 사용자: ${clerkId}`);
          } else {
            console.error(`❌ Clerk 사용자 삭제 실패: ${clerkId}`, deleteError);
          }
        }
        
        return NextResponse.json({ 
          error: 'Not allowed',
          message: '허용되지 않은 이메일입니다. 관리자에게 문의하세요.',
          clerkId: clerkId,
          email: userEmail,
          action: 'deleted'
        }, { status: 403 });
      }
      
      // Supabase에서 기존 사용자 확인
      console.log(`💾 Supabase에서 기존 사용자 확인: ${userEmail}`);
      const { data: existingUser, error: userSearchError } = await supabase
        .from('users')
        .select('id, email, role, clerk_id, name')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (userSearchError) {
        console.error(`❌ 사용자 검색 오류(${userEmail}):`, userSearchError);
        console.error(`❌ 사용자 검색 오류 상세:`, userSearchError.message);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
      
      console.log(`💾 기존 사용자 검색 결과:`, existingUser ? `발견 (ID: ${existingUser.id})` : '없음');
      
      let userId, userRole;
      
      if (existingUser) {
        // 기존 사용자 업데이트
        console.log(`기존 사용자 발견: ID=${existingUser.id}, 기존 Clerk ID=${existingUser.clerk_id}`);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            clerk_id: clerkId,
            name: userName,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);
        
        if (updateError) {
          console.error(`기존 사용자 업데이트 실패(ID=${existingUser.id}):`, updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        userId = existingUser.id;
        userRole = existingUser.role;
        console.log(`✅ 기존 사용자 업데이트 완료: ID=${userId}, Role=${userRole}`);
        
      } else {
        // 새 사용자 생성 (Allowlist에 있지만 DB에는 없는 경우)
        console.log(`🆕 새 사용자 생성 시작: ${userEmail}`);
        
        // 기본 역할을 kol로 설정 (필요시 변경 가능)
        const defaultRole = 'kol';
        console.log(`🆕 기본 역할 설정: ${defaultRole}`);
        
        const userInsertData = {
          clerk_id: clerkId,
          email: userEmail,
          name: userName,
          role: defaultRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log(`🆕 삽입할 데이터:`, userInsertData);
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(userInsertData)
          .select('id, role')
          .single();
        
        if (insertError) {
          console.error(`❌ 새 사용자 생성 실패(${userEmail}):`, insertError);
          console.error(`❌ 새 사용자 생성 오류 상세:`, insertError.message);
          console.error(`❌ 삽입 시도한 데이터:`, userInsertData);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        userId = newUser.id;
        userRole = newUser.role;
        console.log(`✅ 새 사용자 생성 완료: ID=${userId}, Role=${userRole}`);
      }
      
      // KOL 역할인 경우 KOL 테이블에도 추가/업데이트
      if (userRole === 'kol') {
        const { data: existingKol } = await supabase
          .from('kols')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (!existingKol) {
          // KOL 테이블에 새 항목 생성
          const { error: kolInsertError } = await supabase
            .from('kols')
            .insert({
              user_id: userId,
              name: userName,
              shop_name: `${userName}의 샵`, // 기본 샵 이름
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (kolInsertError) {
            console.error(`KOL 데이터 생성 실패(user_id=${userId}):`, kolInsertError);
          } else {
            console.log(`✅ KOL 데이터 생성 완료: user_id=${userId}`);
          }
        } else {
          // 기존 KOL 상태를 active로 업데이트
          const { error: kolUpdateError } = await supabase
            .from('kols')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
          
          if (kolUpdateError) {
            console.error(`KOL 상태 업데이트 실패(user_id=${userId}):`, kolUpdateError);
          } else {
            console.log(`✅ KOL 상태 업데이트 완료: user_id=${userId}`);
          }
        }
      }
      
      // Clerk 메타데이터 업데이트 (user.created 이벤트에서만)
      if (type === 'user.created') {
        try {
          await clerkApi.updateUserMetadata(clerkId, {
            public_metadata: {
              role: userRole,
              userId: userId,
              activated_at: new Date().toISOString()
            }
          });
          
          console.log(`✅ Clerk 메타데이터 설정 완료: ID=${clerkId}, Role=${userRole}, UserId=${userId}`);
        } catch (apiError) {
          console.error('❌ Clerk API 오류:', apiError);
        }
      } else {
        console.log(`ℹ️ user.updated 이벤트이므로 메타데이터 업데이트 생략: ID=${clerkId}`);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `User successfully ${existingUser ? 'updated' : 'created'}`,
        userId: userId,
        role: userRole,
        action: existingUser ? 'updated' : 'created'
      });
      
    } catch (error) {
      console.error('웹훅 처리 오류:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  
  // 다른 이벤트는 성공으로 처리
  return NextResponse.json({ success: true, message: `Webhook received: ${type}` });
} 