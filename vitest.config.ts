import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/*.e2e.test.*'],
    // Convex 테스트 환경 설정
    environmentMatchGlobs: [
      // convex/ 디렉토리의 모든 테스트는 edge-runtime 환경에서 실행
      ['convex/**', 'edge-runtime'],
      // 나머지 모든 테스트는 jsdom 환경 사용
      ['**', 'jsdom'],
    ],
    server: {
      deps: {
        inline: ['convex-test'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'coverage/',
        '.next/',
        'out/',
        'convex/_generated/',
        'public/',
        '**/*.config.{ts,js,mjs}',
        '**/*.d.ts',
        'scripts/',
        'migration-data/',
        '.github/',
        '.cursor/',
        '.taskmaster/',
        'docs/',
        'stories/',
        'legacy_ui/',
        'backups/',
        'drizzle/',
        'supabase/',
        'test-exports/',
        'mcp/',
        'playwright-report/',
        'simple-xano-mcp/',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80,
        },
      },
      watermarks: {
        statements: [50, 80],
        functions: [50, 75],
        branches: [50, 70],
        lines: [50, 80],
      },
    },
    // 병렬 실행 최적화
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    // 테스트 타임아웃 설정
    testTimeout: 10000,
    hookTimeout: 10000,
    // 리포터 설정
    reporters: process.env.CI ? ['verbose', 'json', 'junit'] : ['verbose', 'html'],
    outputFile: {
      json: './coverage/test-results.json',
      junit: './coverage/junit.xml',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
