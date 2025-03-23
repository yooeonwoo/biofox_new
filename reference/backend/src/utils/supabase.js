require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL 또는 Service Key가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

// 서비스 키를 사용하여 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 서비스 롤 사용 여부 확인
console.log('Supabase 클라이언트 생성 완료');

module.exports = supabase; 