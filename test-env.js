/**
 * 환경 변수 로드 테스트 스크립트
 */
require('dotenv').config();

console.log('===== 환경 변수 로드 테스트 =====');

// Supabase 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✅ 설정됨 (${supabaseUrl})` : '❌ 미설정');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ 설정됨 (${supabaseAnonKey.substring(0, 10)}...)` : '❌ 미설정');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? `✅ 설정됨 (${supabaseServiceKey.substring(0, 10)}...)` : '❌ 미설정');

// URL 유효성 검사
if (supabaseUrl) {
  try {
    console.log('\n===== URL 유효성 테스트 =====');
    const url = new URL(supabaseUrl);
    console.log('URL 객체 생성:', '✅ 성공');
    console.log('프로토콜:', url.protocol);
    console.log('호스트:', url.host);
    console.log('패스명:', url.pathname);
  } catch (err) {
    console.error('URL 객체 생성:', '❌ 실패');
    console.error('오류 메시지:', err.message);
  }
}

// Clerk 환경 변수
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

console.log('\n===== Clerk 환경 변수 =====');
console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:', clerkPublishableKey ? `✅ 설정됨 (${clerkPublishableKey.substring(0, 10)}...)` : '❌ 미설정');
console.log('CLERK_SECRET_KEY:', clerkSecretKey ? `✅ 설정됨 (${clerkSecretKey.substring(0, 10)}...)` : '❌ 미설정');

// 데이터베이스 URL
const databaseUrl = process.env.DATABASE_URL;
console.log('\n===== 데이터베이스 URL =====');
console.log('DATABASE_URL:', databaseUrl ? `✅ 설정됨 (${databaseUrl.substring(0, 15)}...)` : '❌ 미설정');

// Next.js 환경 변수
console.log('\n===== Next.js 환경 변수 =====');
console.log('NODE_ENV:', process.env.NODE_ENV || '기본값: development'); 