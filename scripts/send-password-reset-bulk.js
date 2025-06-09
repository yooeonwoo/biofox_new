/**
 * 마이그레이션된 사용자들에게 패스워드 재설정 이메일 일괄 발송
 */

const { createClerkClient } = require('@clerk/backend');

// Production Clerk 환경 설정
const PROD_CLERK_SECRET_KEY = 'sk_live_t5wqT98GV5ljLycHgBpGX5pDfD0bp2udSDLM9eTYTx';
const clerkClient = createClerkClient({ secretKey: PROD_CLERK_SECRET_KEY });

// 마이그레이션된 사용자 이메일 목록
const migratedUsers = [
  'as03041000@gmail.com',
  'csj3232@gmail.com', 
  'yeojiyoon@temp.com'
];

async function sendPasswordResetEmails() {
  console.log('=== 패스워드 재설정 이메일 일괄 발송 시작 ===');
  
  for (const email of migratedUsers) {
    try {
      console.log(`패스워드 재설정 이메일 발송 중: ${email}`);
      
      // Clerk에서 패스워드 재설정 이메일 발송
      await clerkClient.emails.createPasswordResetEmail({
        emailAddress: email,
        redirectUrl: 'https://app.biofoxi.com/signin' // 로그인 페이지로 리다이렉트
      });
      
      console.log(`✅ 발송 완료: ${email}`);
      
      // 레이트 리밋 방지를 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ 발송 실패 (${email}):`, error.message);
    }
  }
  
  console.log('=== 패스워드 재설정 이메일 발송 완료 ===');
}

// 실행
if (require.main === module) {
  sendPasswordResetEmails();
}

module.exports = { sendPasswordResetEmails };