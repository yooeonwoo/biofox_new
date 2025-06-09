/**
 * 테스트 사용자를 Allowlist에 추가하는 스크립트
 */

const { createClerkClient } = require('@clerk/backend');

// Production Clerk 환경 설정
const PROD_CLERK_SECRET_KEY = 'sk_live_t5wqT98GV5ljLycHgBpGX5pDfD0bp2udSDLM9eTYTx';

// 클라이언트 초기화
const clerkClient = createClerkClient({ secretKey: PROD_CLERK_SECRET_KEY });

async function addTestUserToAllowlist() {
  try {
    const testEmail = 'dbdjsdn123@naver.com';
    
    console.log(`테스트 사용자를 Allowlist에 추가: ${testEmail}`);
    
    // Clerk Allowlist에 추가 (초대 이메일 발송하지 않음)
    const response = await clerkClient.allowlistIdentifiers.createAllowlistIdentifier({
      identifier: testEmail,
      notify: false
    });

    console.log('✅ 테스트 사용자 Allowlist 추가 성공:', response.id);
    
    // Supabase에도 pending 상태로 추가
    const { createClient } = require('@supabase/supabase-js');
    const SUPABASE_URL = 'https://lgzzqoaiukuywmenxzay.supabase.co';
    const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA';
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: `pending_${Date.now()}_test`,
        email: testEmail,
        name: '테스트 사용자',
        role: 'kol'
      });
    
    if (error && !error.message.includes('duplicate')) {
      console.error('Supabase 사용자 추가 실패:', error.message);
    } else {
      console.log('✅ Supabase에 pending 사용자 추가 완료');
    }
    
    console.log('테스트 준비 완료! 이제 회원가입을 시도해보세요.');
    
  } catch (error) {
    console.error('테스트 사용자 추가 실패:', error.message);
  }
}

addTestUserToAllowlist();