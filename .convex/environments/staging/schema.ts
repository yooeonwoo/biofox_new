// Staging 환경 스키마 설정
import { defineSchema } from 'convex/server';
import { v } from 'convex/values';

// 기본 스키마 import
import baseSchema from '../../schema';

// 환경별 추가 설정
const environmentSettings = {
  environment: 'staging',
  features: {
    enableDebug: true,
    enableAnalytics: false,
    enableBackups: true,
    enableRealtime: true,
  },
  monitoring: {
    enableMetrics: true,
    enableLogs: true,
    logLevel: 'debug',
  },
};

// 환경별 테이블 추가 (필요한 경우)
const environmentTables = {
  // 환경별 로그 테이블
  environment_logs: {
    timestamp: v.number(),
    level: v.string(),
    message: v.string(),
    environment: v.literal('staging'),
    metadata: v.optional(v.any()),
  },

  // 환경별 메트릭스 (프로덕션만)
};

// 스키마 통합
export default defineSchema({
  ...baseSchema.tables,
  ...environmentTables,
});

export { environmentSettings };
