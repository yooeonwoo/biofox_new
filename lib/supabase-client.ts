import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 프로젝트 정보 읽기
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[supabase-client] 환경 변수(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다. Supabase 기능이 정상 동작하지 않을 수 있습니다.'
  );
}

// 클라이언트 측: 공개 ANON 키 사용
export const supabaseBrowser: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// 서버 측: 서비스 역할 키 우선, 없으면 ANON 키 사용
export const supabaseServer: SupabaseClient | null =
  SUPABASE_URL && (SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_ANON_KEY)
    : null;

export function assertSupabaseClient(client: SupabaseClient | null): SupabaseClient {
  if (!client) {
    throw new Error('Supabase client 초기화 실패: 환경 변수가 올바르게 설정되지 않았습니다.');
  }
  return client;
}
