/**
 * Clerk와 Supabase 연동 테스트 스크립트
 * 
 * 이 스크립트는 환경 변수 설정 확인 및 Clerk, Supabase 연결 상태를 검증합니다.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 환경 변수 확인
console.log('===== 환경 변수 확인 =====');

// Supabase 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 미설정');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 미설정');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ 설정됨' : '❌ 미설정');
console.log('DATABASE_URL:', databaseUrl ? '✅ 설정됨' : '❌ 미설정');

// Clerk 환경 변수
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

console.log('\n----- Clerk 환경 변수 -----');
console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', clerkPublishableKey ? '✅ 설정됨' : '❌ 미설정');
console.log('CLERK_SECRET_KEY:', clerkSecretKey ? '✅ 설정됨' : '❌ 미설정');
console.log('CLERK_WEBHOOK_SECRET:', clerkWebhookSecret ? '✅ 설정됨' : '❌ 미설정');

// Supabase 연결 테스트
console.log('\n===== Supabase 연결 테스트 =====');
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

async function testSupabase() {
  try {
    console.log('Supabase 클라이언트 생성 중...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('테이블 목록 조회 중...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('Supabase 쿼리 오류:', error.message);
      return false;
    }
    
    console.log('Supabase 연결 성공! 사용자 테이블 조회 결과:', data.length > 0 ? `${data.length}개 레코드 조회됨` : '레코드 없음');
    return true;
  } catch (error) {
    console.error('Supabase 연결 오류:', error.message);
    return false;
  }
}

// Clerk API 테스트
console.log('\n===== Clerk API 테스트 =====');
if (!clerkSecretKey) {
  console.error('Clerk Secret Key가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

async function testClerk() {
  try {
    console.log('Clerk API 호출 중...');
    const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Clerk API 오류:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('Clerk API 연결 성공! 사용자 수:', data.total_count);
    return true;
  } catch (error) {
    console.error('Clerk API 연결 오류:', error.message);
    return false;
  }
}

// 연동 테스트 실행
async function runTests() {
  const supabaseResult = await testSupabase();
  const clerkResult = await testClerk();
  
  console.log('\n===== 종합 결과 =====');
  console.log('Supabase 연결:', supabaseResult ? '✅ 성공' : '❌ 실패');
  console.log('Clerk API 연결:', clerkResult ? '✅ 성공' : '❌ 실패');
  
  if (supabaseResult && clerkResult) {
    console.log('\n✅ Clerk와 Supabase가 모두 정상 작동 중입니다.');
    console.log('웹훅 테스트는 애플리케이션을 배포한 후 수행해야 합니다. Clerk 대시보드에서 웹훅을 설정하세요.');
  } else {
    console.log('\n❌ 일부 서비스 연결에 문제가 있습니다. 위 오류 메시지를 확인하고 환경 변수 설정을 점검하세요.');
  }
}

runTests().catch(error => {
  console.error('테스트 실행 중 오류 발생:', error);
  process.exit(1);
}); 