/**
 * 마이그레이션 검증 스크립트
 * 사용법: node scripts/verify-migration.js
 */

const { createClerkClient } = require('@clerk/backend');
const { createClient } = require('@supabase/supabase-js');

// Production Clerk 환경 설정
const PROD_CLERK_SECRET_KEY = 'sk_live_t5wqT98GV5ljLycHgBpGX5pDfD0bp2udSDLM9eTYTx';

// Supabase 설정
const SUPABASE_URL = 'https://lgzzqoaiukuywmenxzay.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA';

const clerkClient = createClerkClient({ secretKey: PROD_CLERK_SECRET_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyMigration() {
  try {
    console.log('=== 마이그레이션 검증 시작 ===');

    // 1. DB의 모든 사용자 조회
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, clerk_id, email, role, name')
      .not('clerk_id', 'like', 'pending_%');

    if (dbError) {
      throw new Error(`DB 조회 실패: ${dbError.message}`);
    }

    console.log(`DB 사용자 수: ${dbUsers.length}명`);

    // 2. 각 사용자가 Clerk에 존재하는지 확인
    const verificationResults = [];

    for (const dbUser of dbUsers) {
      try {
        const clerkUser = await clerkClient.users.getUser(dbUser.clerk_id);
        
        // 이메일 일치 확인
        const emailMatch = clerkUser.emailAddresses.some(
          email => email.emailAddress === dbUser.email
        );

        // 메타데이터 확인
        const roleMatch = clerkUser.publicMetadata?.role === dbUser.role;
        const userIdMatch = clerkUser.publicMetadata?.userId === dbUser.id;

        verificationResults.push({
          success: true,
          dbUserId: dbUser.id,
          email: dbUser.email,
          clerkId: dbUser.clerk_id,
          emailMatch,
          roleMatch,
          userIdMatch,
          allMatch: emailMatch && roleMatch && userIdMatch
        });

        console.log(`✅ ${dbUser.email}: Clerk 사용자 존재 확인`);

      } catch (clerkError) {
        console.log(`❌ ${dbUser.email}: Clerk 사용자 없음`);
        verificationResults.push({
          success: false,
          dbUserId: dbUser.id,
          email: dbUser.email,
          clerkId: dbUser.clerk_id,
          error: clerkError.message
        });
      }
    }

    // 3. 검증 결과 요약
    console.log('\n=== 검증 결과 ===');
    const successful = verificationResults.filter(r => r.success);
    const failed = verificationResults.filter(r => !r.success);
    const fullyMatched = successful.filter(r => r.allMatch);

    console.log(`총 사용자: ${dbUsers.length}명`);
    console.log(`Clerk 존재: ${successful.length}명`);
    console.log(`완전 일치: ${fullyMatched.length}명`);
    console.log(`실패/불일치: ${failed.length}명`);

    // 4. 상세 결과
    if (failed.length > 0) {
      console.log('\n실패한 사용자들:');
      failed.forEach(user => {
        console.log(`- ${user.email}: ${user.error || '알 수 없는 오류'}`);
      });
    }

    const partialMatches = successful.filter(r => !r.allMatch);
    if (partialMatches.length > 0) {
      console.log('\n부분 일치 사용자들:');
      partialMatches.forEach(user => {
        const issues = [];
        if (!user.emailMatch) issues.push('이메일 불일치');
        if (!user.roleMatch) issues.push('역할 불일치');
        if (!user.userIdMatch) issues.push('사용자ID 불일치');
        console.log(`- ${user.email}: ${issues.join(', ')}`);
      });
    }

    // 5. 검증 로그 저장
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      totalUsers: dbUsers.length,
      clerkExists: successful.length,
      fullyMatched: fullyMatched.length,
      failed: failed.length,
      results: verificationResults
    };

    fs.writeFileSync(
      `verification-log-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(logData, null, 2)
    );

    console.log('\n검증 로그가 저장되었습니다.');
    console.log('=== 검증 완료 ===');

    return {
      success: failed.length === 0 && fullyMatched.length === dbUsers.length,
      summary: { totalUsers: dbUsers.length, clerkExists: successful.length, fullyMatched: fullyMatched.length, failed: failed.length }
    };

  } catch (error) {
    console.error('검증 실패:', error);
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  verifyMigration();
}

module.exports = { verifyMigration };