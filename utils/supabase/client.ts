import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // 디버깅: 사용 중인 URL 확인
  if (typeof window !== 'undefined') {
    console.log('Supabase Client URL:', url);
  }
  
  return createBrowserClient(url, key);
}
