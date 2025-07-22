/**
 * Convex Deployment Configuration
 * 환경별 배포 설정을 관리합니다.
 */

export interface ConvexDeploymentConfig {
  name: string;
  description: string;
  deploymentKey: string;
  url: string;
  environment: 'development' | 'preview' | 'staging' | 'production';
  features: {
    enableRealtime: boolean;
    enableAuth: boolean;
    enableMigrations: boolean;
    enableBackups: boolean;
  };
}

/**
 * 환경별 Convex 배포 설정
 */
export const deploymentConfigs: Record<string, ConvexDeploymentConfig> = {
  development: {
    name: 'Development',
    description: '로컬 개발 환경',
    deploymentKey: process.env.CONVEX_DEV_DEPLOYMENT_KEY || '',
    url: process.env.CONVEX_DEV_URL || '',
    environment: 'development',
    features: {
      enableRealtime: true,
      enableAuth: true,
      enableMigrations: true,
      enableBackups: false,
    },
  },

  preview: {
    name: 'Preview',
    description: 'Pull Request 미리보기 환경',
    deploymentKey: process.env.CONVEX_PREVIEW_DEPLOYMENT_KEY || '',
    url: process.env.CONVEX_PREVIEW_URL || '',
    environment: 'preview',
    features: {
      enableRealtime: true,
      enableAuth: true,
      enableMigrations: false,
      enableBackups: false,
    },
  },

  staging: {
    name: 'Staging',
    description: '스테이징 테스트 환경',
    deploymentKey: process.env.CONVEX_STAGING_DEPLOYMENT_KEY || '',
    url: process.env.CONVEX_STAGING_URL || '',
    environment: 'staging',
    features: {
      enableRealtime: true,
      enableAuth: true,
      enableMigrations: true,
      enableBackups: true,
    },
  },

  production: {
    name: 'Production',
    description: '프로덕션 운영 환경',
    deploymentKey: process.env.CONVEX_DEPLOYMENT_KEY || '',
    url: process.env.CONVEX_URL || '',
    environment: 'production',
    features: {
      enableRealtime: true,
      enableAuth: true,
      enableMigrations: true,
      enableBackups: true,
    },
  },
};

/**
 * 현재 환경에 맞는 배포 설정을 가져옵니다.
 */
export function getCurrentDeploymentConfig(): ConvexDeploymentConfig {
  const environment = process.env.NODE_ENV || 'development';
  const deploymentEnv = process.env.CONVEX_DEPLOYMENT_ENV || environment;

  const config = deploymentConfigs[deploymentEnv];

  if (!config) {
    throw new Error(`Invalid deployment environment: ${deploymentEnv}`);
  }

  return config;
}

/**
 * 배포 설정 검증
 */
export function validateDeploymentConfig(config: ConvexDeploymentConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.deploymentKey) {
    errors.push(`Missing deployment key for ${config.environment} environment`);
  }

  if (!config.url) {
    errors.push(`Missing URL for ${config.environment} environment`);
  }

  if (config.environment === 'production' && !config.features.enableBackups) {
    errors.push('Backups should be enabled for production environment');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 환경별 필요한 환경 변수 목록
 */
export const requiredEnvironmentVariables: Record<string, string[]> = {
  development: ['CONVEX_DEV_DEPLOYMENT_KEY', 'CONVEX_DEV_URL'],
  preview: ['CONVEX_PREVIEW_DEPLOYMENT_KEY', 'CONVEX_PREVIEW_URL'],
  staging: ['CONVEX_STAGING_DEPLOYMENT_KEY', 'CONVEX_STAGING_URL'],
  production: ['CONVEX_DEPLOYMENT_KEY', 'CONVEX_URL', 'NEXT_PUBLIC_CONVEX_URL'],
};

/**
 * 환경 변수 검증
 */
export function validateEnvironmentVariables(environment: string): {
  isValid: boolean;
  missing: string[];
} {
  const required = requiredEnvironmentVariables[environment] || [];
  const missing = required.filter(varName => !process.env[varName]);

  return {
    isValid: missing.length === 0,
    missing,
  };
}
