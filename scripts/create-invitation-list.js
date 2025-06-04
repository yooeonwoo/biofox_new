/**
 * 기존 사용자를 초대 목록으로 변환하는 스크립트
 * Production에서 초대 기반 시스템을 사용하는 방식
 * 사용법: node scripts/create-invitation-list.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const SUPABASE_URL = 'https://lgzzqoaiukuywmenxzay.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnenpxb2FpdWt1eXdtZW54emF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjY5NjkyMywiZXhwIjoyMDU4MjcyOTIzfQ.d0yzEG6zRa3xs897zgS02f8WGOvH7Qh3GM83DNIdxxA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createInvitationList() {
  try {
    console.log('=== 기존 사용자를 초대 목록으로 변환 시작 ===');

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

    console.log(`변환 대상 사용자: ${existingUsers.length}명`);

    // 2. 백업 테이블 생성 (기존 데이터 보존)
    console.log('기존 사용자 데이터 백업 중...');
    
    const backupData = existingUsers.map(user => ({
      original_id: user.id,
      original_clerk_id: user.clerk_id,
      email: user.email,
      role: user.role,
      name: user.name,
      created_at: user.created_at,
      backup_date: new Date().toISOString(),
      kol_info: user.kols?.[0] ? JSON.stringify(user.kols[0]) : null
    }));

    // 3. 기존 사용자들을 pending 상태로 변경
    console.log('사용자들을 pending 상태로 변경 중...');
    
    const conversionResults = [];
    
    for (const user of existingUsers) {
      try {
        // 새로운 pending clerk_id 생성
        const pendingClerkId = `pending_migrated_${Date.now()}_${user.id}`;
        
        // 사용자를 pending 상태로 업데이트
        const { error: updateError } = await supabase
          .from('users')
          .update({
            clerk_id: pendingClerkId,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(`사용자 업데이트 실패: ${updateError.message}`);
        }

        // KOL인 경우 상태를 pending으로 변경
        if (user.role === 'kol' && user.kols?.[0]) {
          const { error: kolUpdateError } = await supabase
            .from('kols')
            .update({ status: 'pending' })
            .eq('user_id', user.id);

          if (kolUpdateError) {
            console.warn(`KOL 상태 업데이트 실패 (user_id=${user.id}):`, kolUpdateError.message);
          }
        }

        conversionResults.push({
          success: true,
          userId: user.id,
          email: user.email,
          role: user.role,
          oldClerkId: user.clerk_id,
          newPendingId: pendingClerkId,
          kolId: user.kols?.[0]?.id || null
        });

        console.log(`✅ 변환 완료: ${user.email} → pending 상태`);

      } catch (userError) {
        console.error(`❌ 변환 실패 (${user.email}):`, userError.message);
        conversionResults.push({
          success: false,
          userId: user.id,
          email: user.email,
          error: userError.message
        });
      }
    }

    // 4. 결과 요약
    console.log('\n=== 변환 결과 ===');
    const successful = conversionResults.filter(r => r.success);
    const failed = conversionResults.filter(r => !r.success);

    console.log(`성공: ${successful.length}명`);
    console.log(`실패: ${failed.length}명`);

    if (successful.length > 0) {
      console.log('\n✅ 성공적으로 변환된 사용자들:');
      successful.forEach(user => {
        console.log(`- ${user.email} (${user.role}): ${user.oldClerkId} → ${user.newPendingId}`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ 변환 실패한 사용자들:');
      failed.forEach(user => {
        console.log(`- ${user.email}: ${user.error}`);
      });
    }

    // 5. 결과 로그 저장
    const fs = require('fs');
    
    // 백업 데이터 저장
    const backupFileName = `user-backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(backupFileName, JSON.stringify(backupData, null, 2));
    console.log(`\n📄 백업 데이터 저장: ${backupFileName}`);

    // 변환 결과 저장
    const conversionLogData = {
      timestamp: new Date().toISOString(),
      totalUsers: existingUsers.length,
      successful: successful.length,
      failed: failed.length,
      results: conversionResults
    };

    const conversionLogFileName = `conversion-log-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(conversionLogFileName, JSON.stringify(conversionLogData, null, 2));
    console.log(`📄 변환 로그 저장: ${conversionLogFileName}`);

    // 초대 리스트 생성 (이메일 목록)
    if (successful.length > 0) {
      const invitationList = successful.map(user => ({
        email: user.email,
        role: user.role,
        name: user.email.split('@')[0], // 기본 이름
        userId: user.userId,
        kolId: user.kolId
      }));

      const invitationFileName = `invitation-list-${new Date().toISOString().split('T')[0]}.json`;
      fs.writeFileSync(invitationFileName, JSON.stringify(invitationList, null, 2));
      console.log(`📧 초대 목록 저장: ${invitationFileName}`);
    }

    console.log('\n=== 안내사항 ===');
    console.log('1. 이제 모든 기존 사용자가 pending 상태가 되었습니다');
    console.log('2. Production 환경 변수로 전환 후 애플리케이션을 재시작하세요');
    console.log('3. 사용자들이 다시 로그인하면 초대 기반 시스템으로 활성화됩니다');
    console.log('4. 백업 파일들은 안전한 곳에 보관하세요');
    
    console.log('\n=== 변환 완료 ===');

    return {
      success: failed.length === 0,
      totalUsers: existingUsers.length,
      successful: successful.length,
      failed: failed.length
    };

  } catch (error) {
    console.error('변환 실패:', error);
    process.exit(1);
  }
}

// 실행 확인
if (require.main === module) {
  console.log('⚠️  사용자 데이터 변환을 시작하기 전에:');
  console.log('1. 이 과정은 기존 사용자들을 pending 상태로 변경합니다');
  console.log('2. 백업이 자동으로 생성되지만, 별도 백업을 권장합니다');
  console.log('3. 변환 후에는 production 환경 변수로 전환해야 합니다');
  console.log('4. 사용자들은 다시 로그인해야 합니다');
  console.log('\n계속하려면 5초 후 시작됩니다...');
  
  setTimeout(() => {
    createInvitationList();
  }, 5000);
}

module.exports = { createInvitationList };