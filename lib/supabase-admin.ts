import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL 또는 Service Key가 설정되지 않았습니다. .env 파일을 확인하세요.');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
}

// 서비스 롤 키를 사용한 관리자 클라이언트 생성
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}); 