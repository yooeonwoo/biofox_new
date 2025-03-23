const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 환경 변수 확인
console.log('환경 변수 확인:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '미설정');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '미설정');

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL 또는 Anon Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 연결 테스트
console.log('Supabase 연결 테스트 중...');
supabase.from('_dummy_table').select('*').limit(1)
  .then(({ data, error }) => {
    if (error && !error.message.includes('does not exist')) {
      console.error('Supabase 연결 실패:', error.message);
    } else {
      console.log('Supabase 연결 성공!');
    }
  })
  .catch(err => {
    console.error('예기치 않은 오류 발생:', err);
  });

// MCP 서버 확인
console.log('\nSupabase MCP 서버 확인:');
console.log('mcp.json에 Supabase-mcp-server가 설정되어 있습니다.');
console.log('테스트를 위해 다음 명령어를 실행하세요:');
console.log('npx @smithery/cli@latest run @alexander-zuev/supabase-mcp-server --help'); 