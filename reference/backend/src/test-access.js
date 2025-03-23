// 테이블 접근 권한 테스트 스크립트
require('dotenv').config();
const supabase = require('./utils/supabase');

async function testAccess() {
  try {
    console.log('테이블 접근 권한 테스트 중...');
    console.log('사용 중인 키:', process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'ANON_KEY');
    
    // roles 테이블에 대한 간단한 INSERT 쿼리 시도
    const testRole = {
      name: 'TEST_ROLE',
      description: '테스트용 역할 (자동 삭제됨)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('roles 테이블에 테스트 데이터 삽입 시도...');
    const { data: insertData, error: insertError } = await supabase
      .from('roles')
      .insert(testRole)
      .select();
    
    if (insertError) {
      console.error('삽입 오류:', insertError);
      
      // 테이블 존재 확인
      console.log('\nroles 테이블 존재 여부 확인...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', 'roles');
      
      if (tableError) {
        console.error('테이블 확인 오류:', tableError);
      } else {
        console.log('테이블 정보:', tableInfo);
      }
      
      // SQL 쿼리 직접 실행 시도
      console.log('\nSQL 쿼리 직접 실행 시도...');
      const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: "SELECT * FROM roles LIMIT 1;"
      });
      
      if (sqlError) {
        console.error('SQL 실행 오류:', sqlError);
      } else {
        console.log('SQL 결과:', sqlData);
      }
    } else {
      console.log('테스트 데이터 삽입 성공:', insertData);
      
      // 테스트 데이터 삭제
      console.log('\n테스트 데이터 삭제 중...');
      const { error: deleteError } = await supabase
        .from('roles')
        .delete()
        .eq('name', 'TEST_ROLE');
      
      if (deleteError) {
        console.error('삭제 오류:', deleteError);
      } else {
        console.log('테스트 데이터 삭제 완료');
      }
    }
    
  } catch (err) {
    console.error('예상치 못한 오류:', err);
  }
}

testAccess().catch(err => {
  console.error('처리되지 않은 오류:', err);
}); 