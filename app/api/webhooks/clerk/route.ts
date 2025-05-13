import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { serverSupabase as supabase } from '@/lib/supabase';
import { WebhookEvent } from '@clerk/nextjs/server';
import clerkApi from '@/lib/clerk-direct-api';

export async function POST(req: Request) {
  // Next.js 15의 비동기 headers API 처리
  const headersList = await headers();
  
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
      
      // 이메일로 직접 사용자 검색 (가장 정확한 방법)
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('id, email, role, clerk_id, name')
        .eq('email', userEmail)
        .maybeSingle();
      
      if (emailError) {
        console.error(`이메일 검색 오류(${userEmail}):`, emailError);
      }
      
      if (userByEmail) {
        console.log(`이메일로 사용자 발견: ID=${userByEmail.id}, 기존 Clerk ID=${userByEmail.clerk_id}`);
        
        // 사용자 정보 업데이트 필요 여부 확인
        const needsUpdate = !userByEmail.clerk_id || 
                            userByEmail.clerk_id.startsWith('pending_') || 
                            userByEmail.clerk_id !== clerkId;
                            
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              clerk_id: clerkId,
              name: userName || userByEmail.name || userEmail.split('@')[0]
            })
            .eq('id', userByEmail.id);
          
          if (updateError) {
            console.error(`사용자 정보 업데이트 실패(ID=${userByEmail.id}):`, updateError);
          } else {
            console.log(`사용자 정보 업데이트 성공: ID=${userByEmail.id}, Clerk ID=${clerkId}`);
            
            // KOL 정보 확인 및 필요시 생성
            if (userByEmail.role === 'kol') {
              const { data: kolData, error: kolError } = await supabase
                .from('kols')
                .select('id')
                .eq('user_id', userByEmail.id)
                .maybeSingle();
              
              if (kolError) {
                console.error(`KOL 정보 조회 오류(user_id=${userByEmail.id}):`, kolError);
              }
              
              if (!kolData) {
                // KOL 정보 자동 생성
                const displayName = userName || userByEmail.name || userEmail.split('@')[0];
                const { data: newKolData, error: createKolError } = await supabase
                  .from('kols')
                  .insert({
                    user_id: userByEmail.id,
                    name: displayName,
                    shop_name: `${displayName}의 매장`,
                    status: 'active'
                  })
                  .select()
                  .single();
                
                if (createKolError) {
                  console.error(`KOL 정보 자동 생성 실패(user_id=${userByEmail.id}):`, createKolError);
                } else {
                  console.log(`KOL 정보 자동 생성 성공: ID=${newKolData.id}, Name=${newKolData.name}`);
                }
              } else {
                console.log(`KOL 정보 이미 존재: KOL ID=${kolData.id}, User ID=${userByEmail.id}`);
              }
            }
          }
        } else {
          console.log(`사용자 정보 업데이트 불필요: ID=${userByEmail.id}, Clerk ID=${userByEmail.clerk_id}`);
        }
        
        // Clerk 사용자 메타데이터 업데이트 - 항상 최신 정보로 업데이트
        try {
          await clerkApi.updateUserMetadata(clerkId, {
            public_metadata: {
              role: userByEmail.role || 'kol',
              userId: userByEmail.id,
              // 타임스탬프 추가로 메타데이터 최신 상태 확인 가능
              updated_at: new Date().toISOString()
            }
          });
          
          console.log(`Clerk 메타데이터 업데이트 완료: ID=${clerkId}, User ID=${userByEmail.id}, 역할=${userByEmail.role || 'kol'}`);
        } catch (apiError) {
          console.error('Clerk API 오류:', apiError);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `User ${needsUpdate ? 'updated' : 'already up to date'}`,
          userId: userByEmail.id,
          role: userByEmail.role
        });
      }
      
      // 사용자를 찾지 못한 경우: clerk_id로 검색 (기존 코드 호환성)
      console.log(`이메일(${userEmail})로 사용자를 찾지 못했습니다. Clerk ID로 검색 시도...`);
      const { data: userByClerkId, error: clerkIdError } = await supabase
        .from('users')
        .select('id, email, role, clerk_id')
        .eq('clerk_id', clerkId)
        .maybeSingle();
      
      if (userByClerkId) {
        console.log(`Clerk ID로 사용자 발견: ID=${userByClerkId.id}, Email=${userByClerkId.email}`);
        
        // 이메일 주소 업데이트
        if (userByClerkId.email !== userEmail) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ email: userEmail })
            .eq('id', userByClerkId.id);
          
          if (updateError) {
            console.error(`사용자 이메일 업데이트 실패(ID=${userByClerkId.id}):`, updateError);
          } else {
            console.log(`사용자 이메일 업데이트 성공: ID=${userByClerkId.id}, 새 이메일=${userEmail}`);
          }
        }
        
        // Clerk 메타데이터 업데이트
        try {
          await clerkApi.updateUserMetadata(clerkId, {
            public_metadata: {
              role: userByClerkId.role || 'kol',
              userId: userByClerkId.id,
              updated_at: new Date().toISOString()
            }
          });
          
          console.log(`Clerk 메타데이터 업데이트 완료: ID=${clerkId}`);
        } catch (apiError) {
          console.error('Clerk API 오류:', apiError);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'User found by Clerk ID and updated',
          userId: userByClerkId.id
        });
      }
      
      // 여전히 사용자를 찾지 못한 경우: 최신 pending 사용자 검색
      console.log(`Clerk ID(${clerkId})로도 사용자를 찾지 못했습니다. Pending 사용자 검색...`);
      const { data: pendingUsers, error: pendingError } = await supabase
        .from('users')
        .select('id, email, role, clerk_id')
        .like('clerk_id', 'pending_%')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!pendingError && pendingUsers && pendingUsers.length > 0) {
        const pendingUser = pendingUsers[0];
        console.log(`Pending 사용자 발견: ID=${pendingUser.id}, Email=${pendingUser.email}`);
        
        // Pending 사용자 업데이트
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            clerk_id: clerkId,
            email: userEmail  // 이메일도 업데이트
          })
          .eq('id', pendingUser.id);
        
        if (updateError) {
          console.error(`Pending 사용자 업데이트 실패(ID=${pendingUser.id}):`, updateError);
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        
        // Clerk 메타데이터 업데이트
        try {
          await clerkApi.updateUserMetadata(clerkId, {
            public_metadata: {
              role: pendingUser.role || 'kol',
              userId: pendingUser.id,
              updated_at: new Date().toISOString()
            }
          });
          
          console.log(`Clerk 메타데이터 업데이트 완료: ID=${clerkId}`);
        } catch (apiError) {
          console.error('Clerk API 오류:', apiError);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Pending user updated with Clerk ID',
          userId: pendingUser.id
        });
      }
      
      // 완전히 새로운 사용자인 경우: 새 사용자 생성
      console.log(`등록된 사용자를 찾을 수 없음. 새 사용자 생성 필요: ${userEmail}`);
      
      // 기본 role을 'kol'로 설정하고 Clerk metadata 업데이트
      try {
        const defaultRole = 'kol';
        
        // 새 사용자 생성
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            clerk_id: clerkId,
            email: userEmail,
            name: userName || userEmail.split('@')[0],
            role: defaultRole
          })
          .select()
          .single();
        
        if (insertError) {
          console.error(`새 사용자 생성 실패(${userEmail}):`, insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        
        console.log(`새 사용자 생성 성공: ID=${newUser.id}, Email=${newUser.email}`);
        
        // Clerk 메타데이터 업데이트
        await clerkApi.updateUserMetadata(clerkId, {
          public_metadata: {
            role: defaultRole,
            userId: newUser.id,
            created_at: new Date().toISOString()
          }
        });
        
        console.log(`새 사용자 Clerk 메타데이터 설정 완료: ID=${clerkId}, Role=${defaultRole}`);
        
        // KOL 기본 정보도 생성
        const displayName = userName || userEmail.split('@')[0];
        const { data: newKol, error: kolError } = await supabase
          .from('kols')
          .insert({
            user_id: newUser.id,
            name: displayName,
            shop_name: `${displayName}의 매장`,
            status: 'active'
          })
          .select()
          .single();
        
        if (kolError) {
          console.error(`KOL 기본 정보 생성 실패(user_id=${newUser.id}):`, kolError);
        } else {
          console.log(`KOL 기본 정보 생성 성공: ID=${newKol.id}`);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'New user created with default role',
          userId: newUser.id,
          role: defaultRole
        });
      } catch (createError) {
        console.error('새 사용자 생성 중 오류:', createError);
        return NextResponse.json({ error: 'Failed to create new user' }, { status: 500 });
      }
    } catch (error) {
      console.error('웹훅 처리 오류:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  
  // 다른 이벤트는 성공으로 처리
  return NextResponse.json({ success: true, message: `Webhook received: ${type}` });
} 