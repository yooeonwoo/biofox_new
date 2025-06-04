/**
 * 기존 사용자를 Production Clerk 환경으로 마이그레이션하는 스크립트 (수정된 버전)
 * 문제 해결: 패스워드 요구사항 및 레이트 리밋 대응
 * 사용법: node scripts/migrate-users-to-production-fixed.js
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

// 임시 패스워드 생성 함수
function generateTempPassword() {
  return `TempPass${Date.now()}!${Math.random().toString(36).substr(2, 9)}`;
}

// 레이트 리밋 대응을 위한 지연 함수
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateUsersToProductionFixed() {
  try {
    console.log('=== 사용자 Production 마이그레이션 시작 (수정된 버전) ===');

    // 1. 현재 DB의 모든 활성 사용자 조회
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select(`
        id,
        clerk_id,
        email,
        role,
        name,
        created_at,
        kols (
          id,
          name,
          shop_name,
          region,
          status
        )
      `)
      .not('clerk_id', 'like', 'pending_%'); // pending 사용자 제외

    if (fetchError) {
      throw new Error(`DB 사용자 조회 실패: ${fetchError.message}`);
    }

    console.log(`마이그레이션 대상 사용자: ${existingUsers.length}명`);

    // 2. 각 사용자를 Production Clerk에 생성
    const migrationResults = [];
    const BATCH_SIZE = 5; // 배치 크기 감소
    const DELAY_BETWEEN_REQUESTS = 3000; // 3초 지연

    for (let i = 0; i < existingUsers.length; i += BATCH_SIZE) {
      const batch = existingUsers.slice(i, i + BATCH_SIZE);
      console.log(`\n배치 ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(existingUsers.length/BATCH_SIZE)} 처리 중...`);

      for (const user of batch) {
        try {
          console.log(`사용자 마이그레이션 중: ${user.email}`);

          // 임시 패스워드 생성
          const tempPassword = generateTempPassword();

          // Production Clerk에 사용자 생성 (패스워드 포함)
          const clerkUser = await clerkClient.users.createUser({
            emailAddress: [user.email],
            password: tempPassword, // 임시 패스워드 추가
            firstName: user.name?.split(' ')[0] || user.email.split('@')[0],
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            skipPasswordRequirement: false, // 패스워드 요구사항 준수
            publicMetadata: {
              role: user.role,
              userId: user.id,
              migrated: true,
              migratedAt: new Date().toISOString(),
              tempPassword: true // 임시 패스워드임을 표시
            },
            privateMetadata: {
              originalClerkId: user.clerk_id,
              kolId: user.kols?.[0]?.id || null,
              tempPasswordHash: tempPassword // 개발용 - 실제 운영에서는 제거
            }
          });

          console.log(`✅ Clerk 사용자 생성 성공: ${clerkUser.id}`);

          // 3. DB의 clerk_id 업데이트
          const { error: updateError } = await supabase
            .from('users')
            .update({
              clerk_id: clerkUser.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) {
            throw new Error(`DB 업데이트 실패: ${updateError.message}`);
          }

          migrationResults.push({
            success: true,
            userId: user.id,
            email: user.email,
            oldClerkId: user.clerk_id,
            newClerkId: clerkUser.id,
            tempPassword: tempPassword // 개발용 - 실제 운영에서는 제거
          });

          console.log(`✅ 사용자 마이그레이션 완료: ${user.email}`);

        } catch (userError) {
          console.error(`❌ 사용자 마이그레이션 실패 (${user.email}):`, userError.message);
          
          // 429 에러인 경우 더 긴 지연
          if (userError.status === 429) {
            console.log(`⏳ 레이트 리밋으로 인한 추가 대기 (30초)...`);
            await delay(30000);
          }

          migrationResults.push({
            success: false,
            userId: user.id,
            email: user.email,
            error: userError.message,
            errorCode: userError.status
          });
        }

        // 각 요청 후 지연
        await delay(DELAY_BETWEEN_REQUESTS);
      }

      // 배치 간 추가 지연
      if (i + BATCH_SIZE < existingUsers.length) {
        console.log(`⏳ 다음 배치까지 대기 중 (10초)...`);
        await delay(10000);
      }
    }

    // 4. 마이그레이션 결과 출력
    console.log('\n=== 마이그레이션 결과 ===');
    const successful = migrationResults.filter(r => r.success);
    const failed = migrationResults.filter(r => !r.success);

    console.log(`성공: ${successful.length}명`);
    console.log(`실패: ${failed.length}명`);

    if (successful.length > 0) {
      console.log('\n✅ 성공한 사용자들:');
      successful.forEach(user => {
        console.log(`- ${user.email}: ${user.oldClerkId} → ${user.newClerkId}`);
        console.log(`  임시 패스워드: ${user.tempPassword}`); // 개발용
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ 실패한 사용자들:');
      failed.forEach(user => {
        console.log(`- ${user.email}: ${user.error} (코드: ${user.errorCode || 'N/A'})`);
      });
    }

    // 5. 마이그레이션 로그를 파일로 저장
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      totalUsers: existingUsers.length,
      successful: successful.length,
      failed: failed.length,
      results: migrationResults
    };

    const logFileName = `migration-log-fixed-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(logFileName, JSON.stringify(logData, null, 2));

    console.log(`\n📄 마이그레이션 로그 저장: ${logFileName}`);
    
    // 임시 패스워드 목록 별도 저장
    if (successful.length > 0) {
      const passwordList = successful.map(user => ({
        email: user.email,
        tempPassword: user.tempPassword,
        clerkId: user.newClerkId
      }));
      
      const passwordFileName = `temp-passwords-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(passwordFileName, JSON.stringify(passwordList, null, 2));
      console.log(`🔑 임시 패스워드 목록 저장: ${passwordFileName}`);
      console.log('⚠️  보안상 이 파일은 마이그레이션 완료 후 삭제하세요!');
    }

    console.log('=== 마이그레이션 완료 ===');

    return {
      success: failed.length === 0,
      totalUsers: existingUsers.length,
      successful: successful.length,
      failed: failed.length
    };

  } catch (error) {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행 확인
if (require.main === module) {
  console.log('⚠️  Production 마이그레이션을 시작하기 전에:');
  console.log('1. Production Clerk 인스턴스가 준비되었는지 확인하세요');
  console.log('2. 백업이 완료되었는지 확인하세요');
  console.log('3. 이 스크립트는 임시 패스워드를 생성합니다');
  console.log('4. 마이그레이션 후 사용자들에게 패스워드 재설정을 안내하세요');
  console.log('\n계속하려면 10초 후 시작됩니다...');
  
  setTimeout(() => {
    migrateUsersToProductionFixed();
  }, 10000);
}

module.exports = { migrateUsersToProductionFixed };