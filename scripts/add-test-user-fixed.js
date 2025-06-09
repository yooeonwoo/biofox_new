/**
 * 테스트 사용자를 올바른 Supabase 프로젝트에 추가
 */

const { createClerkClient } = require('@clerk/backend');
const { createClient } = require('@supabase/supabase-js');

// Production Clerk 환경 설정
const PROD_CLERK_SECRET_KEY = 'sk_live_t5wqT98GV5ljLycHgBpGX5pDfD0bp2udSDLM9eTYTx';

// 올바른 Supabase 설정
const SUPABASE_URL = 'https://lgzzqoaiukuywmenxzay.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA';

// 클라이언트 초기화
const clerkClient = createClerkClient({ secretKey: PROD_CLERK_SECRET_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function addTestUser() {
  try {
    const testEmail = 'dbdjsdn123@naver.com';
    
    console.log('=== 테스트 사용자 추가 및 확인 ===');
    
    // 1. Clerk Allowlist 확인
    console.log('1. Clerk Allowlist 확인 중...');
    try {
      const { data: allowlistData } = await clerkClient.allowlistIdentifiers.getAllowlistIdentifierList();
      const existsInAllowlist = allowlistData.find(item => item.identifier === testEmail);
      
      if (existsInAllowlist) {
        console.log('✅ 이미 Allowlist에 존재:', existsInAllowlist.id);
      } else {
        console.log('Allowlist에 추가 중...');
        const response = await clerkClient.allowlistIdentifiers.createAllowlistIdentifier({
          identifier: testEmail,
          notify: false
        });
        console.log('✅ Allowlist 추가 완료:', response.id);
      }
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ 이미 Allowlist에 존재 (중복 오류)');
      } else {
        console.error('❌ Allowlist 처리 실패:', error.message);
      }
    }
    
    // 2. Supabase users 테이블 확인
    console.log('\n2. Supabase users 테이블 확인 중...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (existingUser) {
      console.log('✅ 이미 users 테이블에 존재:', existingUser.clerk_id);
    } else {
      console.log('users 테이블에 추가 중...');
      const { error } = await supabase
        .from('users')
        .insert({
          clerk_id: `pending_${Date.now()}_test`,
          email: testEmail,
          name: '테스트 사용자',
          role: 'kol'
        });
      
      if (error) {
        console.error('❌ users 테이블 추가 실패:', error.message);
      } else {
        console.log('✅ users 테이블 추가 완료');
      }
    }
    
    // 3. 웹훅 테스트를 위한 상태 확인
    console.log('\n3. 현재 상태 요약:');
    const { data: currentUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (currentUser) {
      console.log(`- 이메일: ${currentUser.email}`);
      console.log(`- Clerk ID: ${currentUser.clerk_id}`);
      console.log(`- 역할: ${currentUser.role}`);
      console.log(`- 상태: ${currentUser.clerk_id.startsWith('pending_') ? 'PENDING (초대 대기)' : 'ACTIVE'}`);
    }
    
    console.log('\n✅ 테스트 준비 완료!');
    console.log('이제 https://app.biofoxi.com/signup 에서 dbdjsdn123@naver.com 으로 회원가입을 시도해보세요.');
    
  } catch (error) {
    console.error('테스트 사용자 처리 실패:', error.message);
  }
}

addTestUser();