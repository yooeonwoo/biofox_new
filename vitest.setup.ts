/**
 * Vitest 글로벌 설정 파일
 * 모든 테스트 실행 전에 로드됩니다.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// MSW 설정 (테스트용 API 모킹)
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// 환경 변수 검증 및 기본값 설정
// CI 환경에서는 더 관대한 설정 사용
const isCI = process.env.CI === 'true';

// 기본 환경 변수 설정
if (!process.env.NODE_ENV) {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'test',
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

process.env.CONVEX_URL = process.env.CONVEX_URL || 'https://test-convex-url.convex.cloud';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// 전역 테스트 설정
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// MSW 서버 설정
export const server = setupServer();

// 테스트 실행 전 설정
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// 각 테스트 후 핸들러 리셋
afterEach(() => {
  server.resetHandlers();
});

// 테스트 종료 후 서버 정리
afterAll(() => {
  server.close();
});

export { http, HttpResponse };
