/**
 * 기존 사용자를 Production Clerk 환경으로 마이그레이션하는 스크립트
 * 사용법: node scripts/migrate-users-to-production.js
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

async function migrateUsersToProduction() {
  try {
    console.log('=== 사용자 Production 마이그레이션 시작 ===');

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

    for (const user of existingUsers) {
      try {
        console.log(`\n사용자 마이그레이션 중: ${user.email}`);

        // Production Clerk에 사용자 생성
        const clerkUser = await clerkClient.users.createUser({
          emailAddress: [user.email],
          firstName: user.name?.split(' ')[0] || user.email.split('@')[0],
          lastName: user.name?.split(' ').slice(1).join(' ') || '',
          publicMetadata: {
            role: user.role,
            userId: user.id,
            migrated: true,
            migratedAt: new Date().toISOString()
          },
          privateMetadata: {
            originalClerkId: user.clerk_id,
            kolId: user.kols?.[0]?.id || null
          }
        });

        console.log(`Clerk 사용자 생성 성공: ${clerkUser.id}`);

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
          newClerkId: clerkUser.id
        });

        console.log(`사용자 마이그레이션 완료: ${user.email}`);
        
        // API 레이트 리밋 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (userError) {
        console.error(`사용자 마이그레이션 실패 (${user.email}):`, userError);
        migrationResults.push({
          success: false,
          userId: user.id,
          email: user.email,
          error: userError.message
        });
      }
    }

    // 4. 마이그레이션 결과 출력
    console.log('\n=== 마이그레이션 결과 ===');
    const successful = migrationResults.filter(r => r.success);
    const failed = migrationResults.filter(r => !r.success);

    console.log(`성공: ${successful.length}명`);
    console.log(`실패: ${failed.length}명`);

    if (successful.length > 0) {
      console.log('\n성공한 사용자들:');
      successful.forEach(user => {
        console.log(`- ${user.email}: ${user.oldClerkId} → ${user.newClerkId}`);
      });
    }

    if (failed.length > 0) {
      console.log('\n실패한 사용자들:');
      failed.forEach(user => {
        console.log(`- ${user.email}: ${user.error}`);
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

    fs.writeFileSync(
      `migration-log-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(logData, null, 2)
    );

    console.log('\n마이그레이션 로그가 저장되었습니다.');
    console.log('=== 마이그레이션 완료 ===');

  } catch (error) {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행 확인
if (require.main === module) {
  console.log('⚠️  Production 마이그레이션을 시작하기 전에:');
  console.log('1. PROD_CLERK_SECRET_KEY를 실제 production 키로 교체하세요');
  console.log('2. Production Clerk 인스턴스가 준비되었는지 확인하세요');
  console.log('3. 백업이 완료되었는지 확인하세요');
  console.log('\n계속하려면 5초 후 시작됩니다...');
  
  setTimeout(() => {
    migrateUsersToProduction();
  }, 5000);
}

module.exports = { migrateUsersToProduction };