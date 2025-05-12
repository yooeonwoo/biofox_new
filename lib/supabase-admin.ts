import { createClient } from '@supabase/supabase-js';

// Supabase Admin 클라이언트 생성 (서비스 롤 사용)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// 단일 객체로 내보내기 (ESLint 경고 방지)
const supabaseAdminExports = {
  supabaseAdmin
};

export default supabaseAdminExports; 