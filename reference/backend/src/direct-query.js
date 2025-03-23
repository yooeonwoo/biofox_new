// 직접 SQL 쿼리 실행 스크립트
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 직접 클라이언트 생성
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL 또는 Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runQuery() {
  try {
    console.log('Supabase 직접 쿼리 테스트 중...');
    
    // 1. 간단한 SELECT 쿼리로 연결 테스트
    console.log('\n1. 간단한 연결 테스트:');
    const { data: testData, error: testError } = await supabase
      .from('roles')
      .select('count(*)', { count: 'exact', head: true });
    
    console.log('결과:', testError ? `오류: ${testError.message}` : `성공: ${testData}`);
    
    // 2. 사용자 권한 확인
    console.log('\n2. 현재 사용자 권한 확인:');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth 결과:', authError ? `오류: ${authError.message}` : `사용자: ${JSON.stringify(authData)}`);
    
    // 3. 스키마 정보
    console.log('\n3. 스키마 정보 확인:');
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .limit(1);
    
    console.log('스키마 결과:', schemaError ? `오류: ${schemaError.message}` : `성공: ${JSON.stringify(schemaData)}`);
    
  } catch (err) {
    console.error('예상치 못한 오류:', err);
  }
}

runQuery().catch(err => {
  console.error('처리되지 않은 오류:', err);
}); 