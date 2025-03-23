const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config();

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL 또는 Service Role Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// SQL 파일 읽기
const sqlFilePath = path.join(__dirname, 'supabase-setup.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// SQL 스크립트를 명령별로 분리
const sqlCommands = sqlContent
  .split(';')
  .map(command => command.trim())
  .filter(command => command.length > 0);

// 각 SQL 명령 실행
async function executeCommands() {
  for (let i = 0; i < sqlCommands.length; i++) {
    const command = sqlCommands[i] + ';';
    console.log(`명령 ${i + 1}/${sqlCommands.length} 실행 중...`);
    
    try {
      const { error } = await supabase.rpc('pgql', { query: command });
      
      if (error) {
        console.error(`명령 ${i + 1} 실행 오류:`, error);
      } else {
        console.log(`명령 ${i + 1} 성공적으로 실행됨`);
      }
    } catch (err) {
      console.error(`명령 ${i + 1} 예외 발생:`, err);
    }
  }
  
  console.log('모든 SQL 명령이 처리되었습니다.');
}

executeCommands().catch(err => {
  console.error('SQL 스크립트 실행 중 오류 발생:', err);
  process.exit(1);
}); 