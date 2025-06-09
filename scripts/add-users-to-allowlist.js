/**
 * 기존 사용자들을 Clerk Allowlist에 추가하는 스크립트
 * 사용법: node scripts/add-users-to-allowlist.js
 */

const { createClerkClient } = require('@clerk/backend');
const { createClient } = require('@supabase/supabase-js');

// Production Clerk 환경 설정
const PROD_CLERK_SECRET_KEY = 'sk_live_t5wqT98GV5ljLycHgBpGX5pDfD0bp2udSDLM9eTYTx';

// Supabase 설정
const SUPABASE_URL = 'https://lgzzqoaiukuywmenxzay.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA';

// 클라이언트 초기화
const clerkClient = createClerkClient({ secretKey: PROD_CLERK_SECRET_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 레이트 리밋 대응을 위한 지연 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function addUsersToAllowlist() {
  try {
    console.log('=== Clerk Allowlist에 기존 사용자 추가 시작 ===');

    // 1. 현재 DB의 모든 사용자 이메일 조회
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('email, role, name')
      .not('email', 'is', null);

    if (fetchError) {
      throw new Error(`DB 사용자 조회 실패: ${fetchError.message}`);
    }

    console.log(`Allowlist 추가 대상 사용자: ${users.length}명`);

    // 2. 기존 Allowlist 조회 (중복 방지)
    let existingAllowlist = [];
    try {
      const { data: allowlistData } = await clerkClient.allowlistIdentifiers.getAllowlistIdentifierList();
      existingAllowlist = allowlistData.map(item => item.identifier);
      console.log(`기존 Allowlist 항목: ${existingAllowlist.length}개`);
    } catch (error) {
      console.warn('기존 Allowlist 조회 실패 (빈 Allowlist로 가정):', error.message);
    }

    // 3. 각 사용자 이메일을 Allowlist에 추가
    const results = [];
    const DELAY_BETWEEN_REQUESTS = 2000; // 2초 지연

    for (const user of users) {
      try {
        // 이미 Allowlist에 있는지 확인
        if (existingAllowlist.includes(user.email)) {
          console.log(`⏭️  이미 Allowlist에 존재: ${user.email}`);
          results.push({
            success: true,
            email: user.email,
            status: 'already_exists'
          });
          continue;
        }

        console.log(`Allowlist에 추가 중: ${user.email} (${user.role})`);

        // Clerk Allowlist에 추가 (아직 초대 이메일은 보내지 않음)
        const response = await clerkClient.allowlistIdentifiers.createAllowlistIdentifier({
          identifier: user.email,
          notify: false  // 아직 초대 이메일 보내지 않음
        });

        console.log(`✅ Allowlist 추가 성공: ${user.email}`);

        results.push({
          success: true,
          email: user.email,
          role: user.role,
          allowlistId: response.id,
          status: 'added'
        });

        // 레이트 리밋 방지를 위한 지연
        await delay(DELAY_BETWEEN_REQUESTS);

      } catch (error) {
        console.error(`❌ Allowlist 추가 실패 (${user.email}):`, error.message);
        
        // 429 에러인 경우 더 긴 지연
        if (error.status === 429) {
          console.log(`⏳ 레이트 리밋으로 인한 추가 대기 (30초)...`);
          await delay(30000);
        }

        results.push({
          success: false,
          email: user.email,
          error: error.message,
          errorCode: error.status
        });
      }
    }

    // 4. 결과 출력
    console.log('\n=== Allowlist 추가 결과 ===');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const alreadyExists = results.filter(r => r.status === 'already_exists');
    const newlyAdded = results.filter(r => r.status === 'added');

    console.log(`전체: ${results.length}명`);
    console.log(`성공: ${successful.length}명 (기존: ${alreadyExists.length}, 신규: ${newlyAdded.length})`);
    console.log(`실패: ${failed.length}명`);

    if (newlyAdded.length > 0) {
      console.log('\n✅ 새로 추가된 사용자들:');
      newlyAdded.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ 실패한 사용자들:');
      failed.forEach(user => {
        console.log(`- ${user.email}: ${user.error} (코드: ${user.errorCode || 'N/A'})`);
      });
    }

    // 5. 결과를 파일로 저장
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      totalUsers: users.length,
      successful: successful.length,
      failed: failed.length,
      alreadyExists: alreadyExists.length,
      newlyAdded: newlyAdded.length,
      results: results
    };

    const logFileName = `allowlist-addition-log-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(logFileName, JSON.stringify(logData, null, 2));

    console.log(`\n📄 Allowlist 추가 로그 저장: ${logFileName}`);
    console.log('=== Allowlist 추가 완료 ===');

    return {
      success: failed.length === 0,
      totalUsers: users.length,
      successful: successful.length,
      failed: failed.length,
      newlyAdded: newlyAdded.length
    };

  } catch (error) {
    console.error('Allowlist 추가 실패:', error);
    process.exit(1);
  }
}

// 실행 확인
if (require.main === module) {
  console.log('⚠️  Allowlist 추가를 시작하기 전에:');
  console.log('1. Clerk Dashboard에서 Allowlist 기능이 활성화되어 있는지 확인하세요');
  console.log('2. 이 스크립트는 초대 이메일을 보내지 않습니다 (notify: false)');
  console.log('3. 나중에 별도로 초대 이메일을 발송할 수 있습니다');
  console.log('\n계속하려면 5초 후 시작됩니다...');
  
  setTimeout(() => {
    addUsersToAllowlist();
  }, 5000);
}

module.exports = { addUsersToAllowlist };