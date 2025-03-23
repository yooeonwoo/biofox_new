// 비어있는 테이블 확인 스크립트
require('dotenv').config();
const supabase = require('./utils/supabase');

async function checkMissingTables() {
  console.log('===== 테이블 데이터 상태 확인 =====');
  
  // 테이블 목록 (수정1.md에 정의된 순서대로)
  const tables = [
    'roles', 'permissions', 'role_permissions',
    'users', 'user_roles',
    'lead_sources', 'lead_statuses', 'product_categories', 'regions', 'settings',
    'leads', 'shops', 'kols',
    'products', 'customers',
    'sales', 'commissions', 'sales_activities',
    'seminars', 'seminar_attendees',
    'tasks', 'notifications', 'activities'
  ];
  
  // 각 테이블의 레코드 수 확인
  console.log('테이블별 레코드 수:');
  console.log('---------------------');
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`${table}: 오류 (${error.message})`);
      } else {
        console.log(`${table}: ${count} 레코드`);
        
        // 비어있는 테이블에 대한 추가 정보
        if (count === 0) {
          console.log(`  => 목업 데이터 필요`);
        }
      }
    } catch (err) {
      console.log(`${table}: 확인 실패 (${err.message})`);
    }
  }
  
  console.log('\n===== 테이블 관계 요약 =====');
  console.log('수정1.md에 따른 테이블 삽입 순서:');
  console.log('1. 독립 테이블: roles, permissions');
  console.log('2. 관계 테이블: role_permissions');
  console.log('3. 사용자 관련: users, user_roles');
  console.log('4. 기본 데이터: lead_sources, lead_statuses, product_categories, regions, settings');
  console.log('5. 핵심 데이터: leads, shops, kols');
  console.log('6. 비즈니스 데이터: products, customers, sales, commissions, sales_activities');
  console.log('7. 추가 데이터: seminars, seminar_attendees, tasks, notifications, activities');
}

checkMissingTables().catch(console.error); 