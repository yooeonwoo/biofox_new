import path from 'path';
import { config } from 'dotenv';

// .env.test가 존재하면 로드, 그렇지 않으면 기본 .env(.local) 로드
config({ path: '.env.test', override: false });

// Node 18+ 환경이 아닌 경우 fetch 폴리필 (Optional)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.fetch = require('node-fetch');
}

// 테스트 환경에서 ENV 누락 시 경고만 출력하고 테스트를 건너뛸 수 있게 함
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URL 가 설정되지 않았습니다. 일부 통합 테스트가 건너뜁니다.');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. 일부 통합 테스트가 건너뜁니다.');
}

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test_key';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test_anon_key';
