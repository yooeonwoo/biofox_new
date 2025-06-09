/**
 * 기존 사용자들의 Clerk ID를 pending 상태로 초기화하는 스크립트
 * 사용법: node scripts/reset-users-to-pending.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://lgzzqoaiukuywmenxzay.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA';

// 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function resetUsersToPending() {
  try {
    console.log('=== 사용자 Clerk ID 초기화 시작 ===');
    
    // 제외할 이메일 목록
    const excludeEmails = ['dbdjsdn123@naver.com', 'as03041000@gmail.com'];
    console.log('제외할 이메일:', excludeEmails);

    // 1. 현재 활성 사용자들 조회 (pending이 아닌 사용자들)
    const { data: allActiveUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, email, clerk_id, name, role')
      .not('clerk_id', 'like', 'pending_%')
      .not('clerk_id', 'like', 'deleted_%');
      
    if (fetchError) {
      throw new Error(`활성 사용자 조회 실패: ${fetchError.message}`);
    }
    
    // 제외할 사용자 필터링
    const activeUsers = allActiveUsers.filter(user => !excludeEmails.includes(user.email));
    const excludedUsers = allActiveUsers.filter(user => excludeEmails.includes(user.email));
    
    console.log(`전체 활성 사용자: ${allActiveUsers.length}명`);
    console.log(`제외할 사용자: ${excludedUsers.length}명`);
    console.log(`초기화 대상 사용자: ${activeUsers.length}명`);
    
    if (excludedUsers.length > 0) {
      console.log('\n제외된 사용자 목록:');
      excludedUsers.forEach(user => {
        console.log(`- ${user.email} (${user.clerk_id})`);
      });
    }

    console.log(`초기화 대상 사용자: ${activeUsers.length}명`);

    if (activeUsers.length === 0) {
      console.log('초기화할 사용자가 없습니다.');
      return;
    }

    // 2. 백업을 위해 현재 상태 저장
    const fs = require('fs');
    const backupData = {
      timestamp: new Date().toISOString(),
      users: activeUsers
    };
    
    const backupFileName = `user-backup-before-reset-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    console.log(`📄 백업 파일 생성: ${backupFileName}`);

    // 3. 각 사용자의 clerk_id를 pending 상태로 변경
    const results = [];

    for (const user of activeUsers) {
      try {
        const newClerkId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            clerk_id: newClerkId,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`사용자 업데이트 실패: ${updateError.message}`);
        }

        console.log(`✅ 사용자 초기화 완료: ${user.email} (${user.clerk_id} → ${newClerkId})`);

        results.push({
          success: true,
          userId: user.id,
          email: user.email,
          oldClerkId: user.clerk_id,
          newClerkId: newClerkId
        });

      } catch (error) {
        console.error(`❌ 사용자 초기화 실패 (${user.email}):`, error.message);
        
        results.push({
          success: false,
          userId: user.id,
          email: user.email,
          error: error.message
        });
      }
    }

    // 4. KOL 상태도 pending으로 변경
    console.log('\nKOL 상태 업데이트 중...');
    const { error: kolUpdateError } = await supabase
      .from('kols')
      .update({ status: 'pending' })
      .in('user_id', activeUsers.map(u => u.id));

    if (kolUpdateError) {
      console.warn('KOL 상태 업데이트 실패:', kolUpdateError.message);
    } else {
      console.log('✅ KOL 상태를 pending으로 변경 완료');
    }

    // 5. 결과 출력
    console.log('\n=== 사용자 초기화 결과 ===');
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`전체: ${results.length}명`);
    console.log(`성공: ${successful.length}명`);
    console.log(`실패: ${failed.length}명`);

    if (failed.length > 0) {
      console.log('\n❌ 실패한 사용자들:');
      failed.forEach(user => {
        console.log(`- ${user.email}: ${user.error}`);
      });
    }

    // 6. 결과를 파일로 저장
    const logData = {
      timestamp: new Date().toISOString(),
      totalUsers: activeUsers.length,
      successful: successful.length,
      failed: failed.length,
      results: results
    };

    const logFileName = `user-reset-log-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(logFileName, JSON.stringify(logData, null, 2));

    console.log(`\n📄 초기화 로그 저장: ${logFileName}`);
    console.log('=== 사용자 초기화 완료 ===');

    return {
      success: failed.length === 0,
      totalUsers: activeUsers.length,
      successful: successful.length,
      failed: failed.length
    };

  } catch (error) {
    console.error('사용자 초기화 실패:', error);
    process.exit(1);
  }
}

// 실행 확인
if (require.main === module) {
  console.log('⚠️  사용자 Clerk ID 초기화를 시작하기 전에:');
  console.log('1. 이 작업은 모든 사용자가 다시 회원가입해야 함을 의미합니다');
  console.log('2. 백업 파일이 자동으로 생성됩니다');
  console.log('3. Allowlist에 사용자 이메일이 추가되어 있어야 합니다');
  console.log('4. 이 작업 후에는 기존 사용자들이 로그인할 수 없습니다');
  console.log('\n정말로 계속하시겠습니까? 10초 후 시작됩니다...');
  
  setTimeout(() => {
    resetUsersToPending();
  }, 10000);
}

module.exports = { resetUsersToPending };