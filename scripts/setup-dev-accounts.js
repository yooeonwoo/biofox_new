/**
 * 개발용 계정 설정 스크립트
 * 프로덕션 배포 전 계정들을 올바른 역할로 설정
 */

import { ConvexHttpClient } from 'convex/browser';

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function setupDevAccounts() {
  try {
    console.log('🚀 개발용 계정 설정 시작...');

    // 모든 프로필 조회
    const profiles = await client.query('profiles.js:getAllProfiles');
    console.log('현재 프로필 수:', profiles.length);

    // 각 계정 업데이트
    const updates = [
      {
        email: 'reflance88@gmail.com',
        role: 'kol',
        name: 'KOL 테스트 계정',
        shop_name: 'KOL 테스트 매장',
        region: '서울',
        commission_rate: 10,
      },
      {
        email: 'sales@test.com',
        role: 'sales',
        name: 'Sales 테스트 계정',
        shop_name: 'Sales 테스트 매장',
        region: '부산',
        commission_rate: 8,
      },
      {
        email: 'dbdjsdn123@naver.com',
        role: 'admin',
        name: '관리자 계정',
        shop_name: '본사',
        region: '서울',
        commission_rate: 0,
      },
    ];

    for (const update of updates) {
      const profile = profiles.find(p => p.email === update.email);
      if (profile) {
        console.log(`📝 ${update.email} 계정 업데이트 중...`);

        await client.mutation('profiles.js:updateProfile', {
          profileId: profile._id,
          ...update,
        });

        // 승인 처리
        await client.mutation('profiles.js:approveProfile', {
          profileId: profile._id,
          approved: true,
          approvedBy: profile._id, // 자기 자신으로 승인
          commission_rate: update.commission_rate,
        });

        console.log(`✅ ${update.email} 계정 설정 완료 (${update.role})`);
      } else {
        console.log(`❌ ${update.email} 계정을 찾을 수 없습니다.`);
      }
    }

    console.log('🎉 모든 계정 설정 완료!');
  } catch (error) {
    console.error('❌ 계정 설정 중 오류:', error);
  }
}

if (import.meta.url === new URL(import.meta.url).href) {
  setupDevAccounts();
}

export { setupDevAccounts };
