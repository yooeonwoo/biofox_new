// 테이블 존재 여부 확인 스크립트
require('dotenv').config();
const supabase = require('./utils/supabase');

async function checkTables() {
  try {
    console.log('Checking if tables exist in Supabase...');
    
    // 간단한 쿼리로 테이블 확인 시도
    const tables = ['roles', 'permissions', 'users', 'lead_sources', 'lead_statuses', 
                    'product_categories', 'regions', 'leads', 'shops', 'products'];
    
    for (const table of tables) {
      console.log(`Checking table '${table}'...`);
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error checking table '${table}':`, error);
      } else {
        console.log(`Table '${table}' exists with ${count} rows.`);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkTables().catch(err => {
  console.error('Unhandled error:', err);
}); 