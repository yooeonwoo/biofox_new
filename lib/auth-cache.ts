import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

// 🚀 사용자 인증 캐싱을 통한 성능 최적화
// 중복된 사용자/KOL 조회를 방지하여 데이터베이스 부하 감소

interface CachedUserData {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface CachedKolData {
  id: number;
  name: string;
  shop_name: string;
  user_id: number;
}

interface AuthResult {
  user: CachedUserData;
  kol: CachedKolData;
}

// 메모리 캐시 (요청 수명 동안 유지)
const authCache = new Map<string, AuthResult>();

export async function getAuthenticatedKol(): Promise<AuthResult> {
  // 1. Clerk 인증 확인
  const { userId } = await auth();
  if (!userId) {
    throw new Error('인증되지 않은 요청입니다.');
  }

  // 2. 캐시에서 확인
  if (authCache.has(userId)) {
    console.log(`캐시에서 사용자 정보 반환: ${userId}`);
    return authCache.get(userId)!;
  }

  console.log(`새로운 사용자 인증 처리: ${userId}`);

  // 3. 사용자 정보 조회
  let { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('clerk_id', userId)
    .single();

  if (userError) {
    console.error(`사용자 정보 조회 오류(clerk_id=${userId}):`, userError);
    
    // 백업 로직 - 기존 대시보드 API와 동일
    try {
      const { data: userByEmail, error: emailError } = await supabase
        .rpc('find_user_by_clerk_metadata', { clerk_user_id: userId });
      
      if (emailError) {
        throw new Error('보조 검색 오류: ' + emailError.message);
      }
      
      if (!userByEmail || typeof userByEmail.id === 'undefined') {
        const { data: pendingUsers, error: pendingError } = await supabase
          .from('users')
          .select('id, email, name, role')
          .like('clerk_id', 'pending_%')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (pendingError || !pendingUsers || pendingUsers.length === 0) {
          throw new Error('시스템에 등록된 사용자를 찾을 수 없습니다. 관리자에게 문의하세요.');
        }
        
        userData = pendingUsers[0];
        console.log(`최신 Pending 사용자 발견: ID=${userData.id}, Email=${userData.email}`);
      } else {
        userData = userByEmail;
        console.log(`보조 검색으로 사용자 발견: ID=${userData.id}, Email=${userData.email}`);
      }
      
      // 사용자 정보 업데이트
      if (userData && typeof userData.id !== 'undefined') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ clerk_id: userId })
          .eq('id', userData.id);
          
        if (updateError) {
          console.error(`사용자 정보 업데이트 실패(ID=${userData.id}):`, updateError);
        } else {
          console.log(`사용자 정보 업데이트 성공: ID=${userData.id}, Clerk ID=${userId}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      throw new Error(`사용자 정보를 찾을 수 없습니다. ${errorMessage}`);
    }
  }

  if (!userData || typeof userData.id === 'undefined') {
    throw new Error('사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.');
  }

  // 4. 사용자 역할 확인
  if (userData.role !== 'kol') {
    throw new Error('KOL 역할이 아닙니다.');
  }

  console.log(`사용자 조회 성공: ID=${userData.id}, Email=${userData.email}`);

  // 5. KOL 정보 조회
  let { data: kolData, error: kolError } = await supabase
    .from('kols')
    .select('id, name, shop_name, user_id')
    .eq('user_id', userData.id)
    .single();

  if (kolError) {
    console.error(`KOL 정보 조회 오류(user_id=${userData.id}):`, kolError);
    
    // KOL 정보 자동 생성
    const { data: newKolData, error: createKolError } = await supabase
      .from('kols')
      .insert({
        user_id: userData.id,
        name: userData.name || userData.email.split('@')[0],
        shop_name: `${userData.name || userData.email.split('@')[0]}의 매장`,
        status: 'active'
      })
      .select('id, name, shop_name, user_id')
      .single();
      
    if (createKolError) {
      throw new Error(`KOL 정보를 찾을 수 없고 자동 생성에 실패했습니다. ${createKolError.message}`);
    }
    
    console.log(`KOL 정보 자동 생성 성공: ID=${newKolData.id}, Name=${newKolData.name}`);
    kolData = newKolData;
  }

  if (!kolData) {
    throw new Error('KOL 정보를 찾을 수 없습니다. 관리자에게 문의하세요.');
  }

  console.log(`KOL 조회 성공: ID=${kolData.id}, Name=${kolData.name}`);

  // 6. 결과 캐싱
  const result: AuthResult = {
    user: userData,
    kol: kolData
  };

  authCache.set(userId, result);
  console.log(`사용자 정보 캐시 저장: ${userId}`);

  return result;
}

// 캐시 클리어 함수 (필요시 사용)
export function clearAuthCache(userId?: string) {
  if (userId) {
    authCache.delete(userId);
    console.log(`특정 사용자 캐시 삭제: ${userId}`);
  } else {
    authCache.clear();
    console.log('모든 인증 캐시 삭제');
  }
}

// 캐시 상태 확인 함수 (디버깅용)
export function getAuthCacheStats() {
  return {
    size: authCache.size,
    keys: Array.from(authCache.keys())
  };
}