/**
 * 데이터 마이그레이션을 위한 통합 실행 스크립트
 */

// 모든 테이블 삽입 함수 임포트
const insertRoles = require('./tables/roles');
const insertPermissions = require('./tables/permissions');
const insertRolePermissions = require('./tables/rolePermissions');
const insertUsers = require('./tables/users');
const insertUserRoles = require('./tables/userRoles');
const insertLeadSources = require('./tables/leadSources');
const insertLeadStatuses = require('./tables/leadStatuses');
const insertProductCategories = require('./tables/productCategories');
const insertRegions = require('./tables/regions');
const insertSettings = require('./tables/settings');
const insertLeads = require('./tables/leads');
const insertShops = require('./tables/shops');
const insertProducts = require('./tables/products');
const insertKols = require('./tables/kols');
const insertCustomers = require('./tables/customers');
const updateShopKolRelationships = require('./tables/updateShopKolRelationships');

/**
 * 데이터 마이그레이션 실행
 */
async function migrateData() {
  console.log('='.repeat(50));
  console.log('STARTING DATA MIGRATION');
  console.log('='.repeat(50));
  
  try {
    // 1. 독립적인 기본 테이블
    console.log('\n--- 기본 테이블 데이터 삽입 ---');
    await insertRoles();
    await insertPermissions();
    await insertRolePermissions();
    
    // 2. 사용자 관련
    console.log('\n--- 사용자 관련 데이터 삽입 ---');
    await insertUsers();
    await insertUserRoles();
    
    // 3. 업무 관련 기본 데이터
    console.log('\n--- 업무 관련 기본 데이터 삽입 ---');
    await insertLeadSources();
    await insertLeadStatuses();
    await insertProductCategories();
    await insertRegions();
    await insertSettings();
    
    // 4. 핵심 비즈니스 데이터
    console.log('\n--- 핵심 비즈니스 데이터 삽입 ---');
    await insertLeads();
    await insertShops();
    await insertProducts();
    
    // 5. 추가 데이터 (KOL, 고객 등)
    console.log('\n--- 추가 데이터 삽입 ---');
    await insertKols();
    await insertCustomers();
    
    // 6. 샵-KOL 연동 업데이트 (양방향 참조 처리)
    console.log('\n--- 양방향 참조 관계 업데이트 ---');
    await updateShopKolRelationships();
    
    console.log('\n='.repeat(50));
    console.log('DATA MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('\n='.repeat(50));
    console.error('ERROR DURING MIGRATION:');
    console.error(error);
    console.error('='.repeat(50));
    process.exit(1);
  }
}

// 실행
migrateData().catch(error => {
  console.error('Unhandled error during migration:', error);
  process.exit(1);
}); 