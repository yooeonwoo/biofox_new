#!/usr/bin/env node

/**
 * Convex 환경 설정 도구
 * 스테이징 및 프로덕션 환경을 설정하고 검증합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const environments = ['staging', 'production'];
const args = process.argv.slice(2);
const command = args[0] || 'setup';

console.log('🌍 Convex 환경 설정 도구');
console.log(`📋 명령: ${command}`);

class EnvironmentSetup {
  constructor() {
    this.environmentsConfig = {
      staging: {
        name: 'Staging',
        description: '스테이징 테스트 환경',
        domain: 'staging',
        features: {
          enableDebug: true,
          enableAnalytics: false,
          enableBackups: true,
          enableRealtime: true,
        },
        requiredSecrets: ['CONVEX_STAGING_DEPLOYMENT_KEY', 'CONVEX_STAGING_URL'],
      },
      production: {
        name: 'Production',
        description: '프로덕션 서비스 환경',
        domain: 'prod',
        features: {
          enableDebug: false,
          enableAnalytics: true,
          enableBackups: true,
          enableRealtime: true,
        },
        requiredSecrets: ['CONVEX_DEPLOYMENT_KEY', 'CONVEX_URL', 'NEXT_PUBLIC_CONVEX_URL'],
      },
    };
  }

  async run() {
    try {
      switch (command) {
        case 'setup':
          await this.setupEnvironments();
          break;
        case 'validate':
          await this.validateEnvironments();
          break;
        case 'check':
          await this.checkConvexProjects();
          break;
        case 'guide':
          this.showSetupGuide();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error('❌ 오류 발생:', error.message);
      process.exit(1);
    }
  }

  async setupEnvironments() {
    console.log('\n🚀 Convex 환경 설정을 시작합니다...\n');

    for (const env of environments) {
      console.log(`\n📍 ${this.environmentsConfig[env].name} 환경 설정 중...`);
      await this.setupSingleEnvironment(env);
    }

    console.log('\n✅ 모든 환경 설정이 완료되었습니다!');
    console.log('\n📋 다음 단계:');
    console.log('1. Convex 대시보드에서 프로젝트를 생성하세요');
    console.log('2. GitHub Secrets에 배포 키를 추가하세요');
    console.log('3. npm run setup-environments validate 로 검증하세요');
  }

  async setupSingleEnvironment(env) {
    const config = this.environmentsConfig[env];

    try {
      // 1. 환경 디렉토리 생성
      const envDir = path.join('.convex', 'environments', env);
      if (!fs.existsSync(envDir)) {
        fs.mkdirSync(envDir, { recursive: true });
        console.log(`  ✅ 환경 디렉토리 생성: ${envDir}`);
      }

      // 2. 환경별 설정 파일 생성
      await this.createEnvironmentConfig(env, config);

      // 3. 환경별 스키마 설정
      await this.createEnvironmentSchema(env, config);

      // 4. 배포 설정 확인
      await this.checkDeploymentSettings(env, config);
    } catch (error) {
      console.error(`  ❌ ${config.name} 환경 설정 실패:`, error.message);
      throw error;
    }
  }

  async createEnvironmentConfig(env, config) {
    const configPath = path.join('.convex', 'environments', env, 'config.json');

    const envConfig = {
      name: config.name,
      description: config.description,
      environment: env,
      domain: config.domain,
      createdAt: new Date().toISOString(),
      features: config.features,
      deployment: {
        auto: env !== 'production',
        requireApproval: env === 'production',
        backupBeforeDeploy: env === 'production',
      },
      monitoring: {
        enableMetrics: true,
        enableLogs: config.features.enableDebug,
        logLevel: env === 'production' ? 'error' : 'debug',
      },
    };

    fs.writeFileSync(configPath, JSON.stringify(envConfig, null, 2));
    console.log(`  ✅ 환경 설정 파일 생성: ${configPath}`);
  }

  async createEnvironmentSchema(env, config) {
    const schemaPath = path.join('.convex', 'environments', env, 'schema.ts');

    const schemaContent = `// ${config.name} 환경 스키마 설정
import { defineSchema } from "convex/server";
import { v } from "convex/values";

// 기본 스키마 import
import baseSchema from "../../schema";

// 환경별 추가 설정
const environmentSettings = {
  environment: "${env}",
  features: ${JSON.stringify(config.features, null, 2)},
  monitoring: {
    enableMetrics: true,
    enableLogs: ${config.features.enableDebug},
    logLevel: "${env === 'production' ? 'error' : 'debug'}"
  }
};

// 환경별 테이블 추가 (필요한 경우)
const environmentTables = {
  // 환경별 로그 테이블
  environment_logs: {
    timestamp: v.number(),
    level: v.string(),
    message: v.string(),
    environment: v.literal("${env}"),
    metadata: v.optional(v.any())
  },
  
  // 환경별 메트릭스 (프로덕션만)
  ${
    env === 'production'
      ? `
  metrics: {
    timestamp: v.number(),
    name: v.string(),
    value: v.number(),
    tags: v.optional(v.record(v.string(), v.string()))
  },`
      : ''
  }
};

// 스키마 통합
export default defineSchema({
  ...baseSchema.tables,
  ...environmentTables
});

export { environmentSettings };
`;

    fs.writeFileSync(schemaPath, schemaContent);
    console.log(`  ✅ 환경별 스키마 생성: ${schemaPath}`);
  }

  async checkDeploymentSettings(env, config) {
    console.log(`  🔍 ${config.name} 배포 설정 확인 중...`);

    // GitHub Actions 워크플로우에서 환경이 설정되어 있는지 확인
    const workflowPath = '.github/workflows/deploy-convex.yml';
    if (fs.existsSync(workflowPath)) {
      const workflow = fs.readFileSync(workflowPath, 'utf8');

      if (workflow.includes(`deploy-${env}`) || workflow.includes(env)) {
        console.log(`  ✅ GitHub Actions 워크플로우에 ${env} 환경이 설정되어 있습니다`);
      } else {
        console.log(`  ⚠️ GitHub Actions 워크플로우에 ${env} 환경이 설정되지 않았습니다`);
      }
    }

    // 필수 Secrets 확인 (나중에 검증)
    console.log(`  📋 필수 GitHub Secrets: ${config.requiredSecrets.join(', ')}`);
  }

  async validateEnvironments() {
    console.log('\n🔍 환경 검증을 시작합니다...\n');

    let allValid = true;

    for (const env of environments) {
      console.log(`📍 ${this.environmentsConfig[env].name} 환경 검증 중...`);

      const isValid = await this.validateSingleEnvironment(env);
      allValid = allValid && isValid;
    }

    if (allValid) {
      console.log('\n✅ 모든 환경이 올바르게 설정되었습니다!');
    } else {
      console.log('\n❌ 일부 환경에 문제가 있습니다. 위의 오류를 확인하세요.');
      process.exit(1);
    }
  }

  async validateSingleEnvironment(env) {
    const config = this.environmentsConfig[env];
    let isValid = true;

    try {
      // 1. 설정 파일 존재 확인
      const configPath = path.join('.convex', 'environments', env, 'config.json');
      if (!fs.existsSync(configPath)) {
        console.log(`  ❌ 설정 파일이 없습니다: ${configPath}`);
        isValid = false;
      } else {
        console.log(`  ✅ 설정 파일 존재: ${configPath}`);
      }

      // 2. 스키마 파일 존재 확인
      const schemaPath = path.join('.convex', 'environments', env, 'schema.ts');
      if (!fs.existsSync(schemaPath)) {
        console.log(`  ❌ 스키마 파일이 없습니다: ${schemaPath}`);
        isValid = false;
      } else {
        console.log(`  ✅ 스키마 파일 존재: ${schemaPath}`);
      }

      // 3. 환경 변수 확인 (시뮬레이션)
      const missingSecrets = [];
      for (const secret of config.requiredSecrets) {
        // 실제로는 GitHub Secrets에서 확인해야 하지만, 여기서는 시뮬레이션
        if (!process.env[secret]) {
          missingSecrets.push(secret);
        }
      }

      if (missingSecrets.length > 0) {
        console.log(`  ⚠️ 누락된 환경 변수: ${missingSecrets.join(', ')}`);
        console.log(`     GitHub Secrets에서 설정해주세요.`);
      } else {
        console.log(`  ✅ 모든 필수 환경 변수가 설정되었습니다`);
      }
    } catch (error) {
      console.log(`  ❌ 검증 중 오류: ${error.message}`);
      isValid = false;
    }

    return isValid;
  }

  async checkConvexProjects() {
    console.log('\n🔍 Convex 프로젝트 상태 확인 중...\n');

    try {
      // Convex CLI 설치 확인
      await this.runCommand('npx', ['convex', '--version']);
      console.log('✅ Convex CLI 사용 가능');

      // 현재 프로젝트 상태 확인
      try {
        const result = await this.runCommand('npx', ['convex', 'deployments', 'list'], {
          capture: true,
        });
        console.log('✅ Convex 프로젝트 연결됨');
        console.log('📋 현재 배포 상태:');
        console.log(result.stdout);
      } catch (error) {
        console.log('⚠️ Convex 프로젝트가 설정되지 않았거나 연결에 실패했습니다.');
        console.log('   배포 키가 올바르게 설정되어 있는지 확인하세요.');
      }
    } catch (error) {
      console.log('❌ Convex CLI를 찾을 수 없습니다.');
      console.log('   npm install convex 로 설치하세요.');
    }
  }

  showSetupGuide() {
    console.log(`
🌍 Convex 환경 설정 가이드

📋 1단계: 환경 설정 실행
   npm run setup-environments setup

📋 2단계: Convex 프로젝트 생성
   1. https://dashboard.convex.dev 방문
   2. 새 프로젝트 생성:
      • biofox-kol-staging (스테이징용)
      • biofox-kol-prod (프로덕션용)
   3. 각 프로젝트에서 배포 키 생성

📋 3단계: GitHub Secrets 설정
   Repository → Settings → Secrets and variables → Actions

   스테이징 환경:
   • CONVEX_STAGING_DEPLOYMENT_KEY
   • CONVEX_STAGING_URL

   프로덕션 환경:
   • CONVEX_DEPLOYMENT_KEY
   • CONVEX_URL
   • NEXT_PUBLIC_CONVEX_URL

📋 4단계: 환경 검증
   npm run setup-environments validate

📋 5단계: 테스트 배포
   npm run deploy:staging --dry-run
   npm run deploy --dry-run

📚 자세한 내용은 docs/deployment-setup.md를 참조하세요.
`);
  }

  showHelp() {
    console.log(`
🌍 Convex 환경 설정 도구

사용법:
  node scripts/setup-environments.js [command]

명령어:
  setup     환경 설정 파일 생성 (기본값)
  validate  환경 설정 검증
  check     Convex 프로젝트 상태 확인
  guide     설정 가이드 표시
  help      도움말 표시

예시:
  node scripts/setup-environments.js setup
  node scripts/setup-environments.js validate
  node scripts/setup-environments.js check
`);
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const { capture = false, silent = false } = options;

      const child = spawn(command, args, {
        stdio: capture ? 'pipe' : silent ? 'ignore' : 'inherit',
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      if (capture) {
        child.stdout.on('data', data => (stdout += data.toString()));
        child.stderr.on('data', data => (stderr += data.toString()));
      }

      child.on('close', code => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', reject);
    });
  }
}

// 메인 실행
async function main() {
  if (args.includes('--help') || command === 'help') {
    new EnvironmentSetup().showHelp();
    return;
  }

  const setup = new EnvironmentSetup();
  await setup.run();
}

if (require.main === module) {
  main();
}
