/**
 * 계정 역할 업데이트 스크립트
 */

// 수동으로 업데이트해야 할 계정 정보
export const ACCOUNT_UPDATES = [
  {
    id: 'kx7e218hd35mnwkwazgt56xahn7me4an',
    email: 'admin@biofox.com',
    role: 'admin',
    name: '관리자 계정',
    shop_name: '본사',
    region: '서울',
    commission_rate: 0,
  },
  {
    id: 'kx79b64g4pce6f5j70kzt5f6ed7mf66e',
    email: 'sales@test.com',
    role: 'sales',
    name: 'Sales 테스트 계정',
    shop_name: 'Sales 테스트 매장',
    region: '부산',
    commission_rate: 8,
  },
  {
    id: 'kx75z5svd6r7t41wwk341zsem57mekmm',
    email: 'reflance88@gmail.com',
    role: 'kol',
    name: 'KOL 테스트 계정',
    shop_name: 'KOL 테스트 매장',
    region: '서울',
    commission_rate: 10,
  },
] as const;

console.log('프로덕션 배포 전에 다음 계정들을 수동으로 업데이트해주세요:');
console.log(JSON.stringify(ACCOUNT_UPDATES, null, 2));
