#!/usr/bin/env node

/**
 * Convex 환경별 배포 테스트 도구
 * 스테이징과 프로덕션 환경의 배포를 테스트합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const environment = args[0] || 'all';
const isDryRun = args.includes('--dry-run');

console.log('🧪 Convex 환경 배포 테스트');
console.log(`📍 대상 환경: ${environment}`);
console.log(`🔍 드라이런: ${isDryRun ? 'Yes' : 'No'}`);

class EnvironmentTester {
  constructor() {
    this.environments = {
      staging: {
        name: 'Staging',
        command: 'deploy:staging',
        url: process.env.CONVEX_STAGING_URL || 'https://staging-project-id.convex.cloud',
        requiredSecrets: ['CONVEX_STAGING_DEPLOYMENT_KEY', 'CONVEX_STAGING_URL'],
      },
      production: {
        name: 'Production',
        command: 'deploy',
        url: process.env.CONVEX_URL || 'https://prod-project-id.convex.cloud',
        requiredSecrets: ['CONVEX_DEPLOYMENT_KEY', 'CONVEX_URL', 'NEXT_PUBLIC_CONVEX_URL'],
      },
    };
  }

  async runTests() {
    try {
      if (environment === 'all') {
        await this.testAllEnvironments();
      } else if (this.environments[environment]) {
        await this.testSingleEnvironment(environment);
      } else {
        throw new Error(`알 수 없는 환경: ${environment}`);
      }

      console.log('\n🎉 모든 환경 테스트가 완료되었습니다!');
    } catch (error) {
      console.error('\n❌ 환경 테스트 실패:', error.message);
      process.exit(1);
    }
  }

  async testAllEnvironments() {
    console.log('\n🔍 모든 환경 테스트를 시작합니다...\n');

    for (const [envName, config] of Object.entries(this.environments)) {
      console.log(`\n📍 ${config.name} 환경 테스트 중...`);
      await this.testSingleEnvironment(envName);
    }
  }

  async testSingleEnvironment(envName) {
    const config = this.environments[envName];

    try {
      // 1. 환경 설정 확인
      await this.checkEnvironmentConfig(envName, config);

      // 2. 필수 환경 변수 확인
      await this.checkEnvironmentVariables(envName, config);

      // 3. 배포 테스트 실행
      if (!isDryRun) {
        await this.runDeploymentTest(envName, config);
      } else {
        await this.runDryRunTest(envName, config);
      }

      // 4. 배포 후 검증 (실제 배포인 경우)
      if (!isDryRun) {
        await this.verifyDeployment(envName, config);
      }

      console.log(`  ✅ ${config.name} 환경 테스트 완료`);
    } catch (error) {
      console.error(`  ❌ ${config.name} 환경 테스트 실패:`, error.message);
      throw error;
    }
  }

  async checkEnvironmentConfig(envName, config) {
    console.log(`  🔍 ${config.name} 환경 설정 확인 중...`);

    // 환경 설정 파일 확인
    const configPath = path.join('.convex', 'environments', envName, 'config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`환경 설정 파일이 없습니다: ${configPath}`);
    }

    // 설정 파일 내용 검증
    const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (envConfig.environment !== envName) {
      throw new Error(`환경 설정이 일치하지 않습니다: ${envName} !== ${envConfig.environment}`);
    }

    console.log(`    ✅ 환경 설정 파일 검증 완료`);
  }

  async checkEnvironmentVariables(envName, config) {
    console.log(`  🔍 환경 변수 확인 중...`);

    const missingVars = config.requiredSecrets.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.log(`    ⚠️ 누락된 환경 변수: ${missingVars.join(', ')}`);
      console.log(`    📋 GitHub Secrets에서 다음 변수들을 설정해주세요:`);
      missingVars.forEach(varName => {
        console.log(`       • ${varName}`);
      });

      if (!isDryRun) {
        throw new Error('필수 환경 변수가 누락되어 실제 배포를 수행할 수 없습니다.');
      }
    } else {
      console.log(`    ✅ 모든 필수 환경 변수가 설정되었습니다`);
    }
  }

  async runDeploymentTest(envName, config) {
    console.log(`  🚀 ${config.name} 실제 배포 테스트 중...`);

    try {
      await this.runCommand('npm', ['run', config.command]);
      console.log(`    ✅ ${config.name} 배포 성공`);
    } catch (error) {
      throw new Error(`${config.name} 배포 실패: ${error.message}`);
    }
  }

  async runDryRunTest(envName, config) {
    console.log(`  🔍 ${config.name} 드라이런 테스트 중...`);

    try {
      // 드라이런 옵션이 있는 경우 사용
      if (config.command === 'deploy') {
        await this.runCommand('npm', ['run', 'deploy:dry-run']);
      } else {
        // 스테이징은 직접 드라이런 옵션 추가
        await this.runCommand('node', ['scripts/deploy-convex.js', envName, '--dry-run']);
      }
      console.log(`    ✅ ${config.name} 드라이런 성공`);
    } catch (error) {
      throw new Error(`${config.name} 드라이런 실패: ${error.message}`);
    }
  }

  async verifyDeployment(envName, config) {
    console.log(`  ✅ ${config.name} 배포 검증 중...`);

    try {
      // 배포 검증 스크립트 실행
      const verificationScript = path.join('scripts', 'verify-deployment.js');

      if (fs.existsSync(verificationScript)) {
        await this.runCommand('node', [verificationScript], {
          env: {
            DEPLOYMENT_URL: config.url,
            VERIFICATION_TIMEOUT: '60000',
          },
        });
        console.log(`    ✅ ${config.name} 배포 검증 성공`);
      } else {
        console.log(`    ⚠️ 배포 검증 스크립트가 없어 기본 검증을 수행합니다`);
        await this.basicVerification(envName, config);
      }
    } catch (error) {
      console.log(`    ⚠️ ${config.name} 배포 검증 실패: ${error.message}`);
      console.log(`    💡 수동으로 ${config.url}에서 확인해주세요`);
    }
  }

  async basicVerification(envName, config) {
    // 기본적인 연결 테스트
    console.log(`    🔍 기본 연결 테스트 수행 중...`);

    try {
      // Convex CLI를 통한 기본 검증
      await this.runCommand('npx', ['convex', 'deployments', 'list'], {
        timeout: 30000,
        env: {
          CONVEX_DEPLOY_KEY: process.env[config.requiredSecrets[0]],
        },
      });
      console.log(`    ✅ 기본 연결 검증 성공`);
    } catch (error) {
      throw new Error(`기본 검증 실패: ${error.message}`);
    }
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        env = {},
        capture = false,
        silent = false,
        timeout = 300000, // 5분
      } = options;

      const fullEnv = { ...process.env, ...env };
      const child = spawn(command, args, {
        stdio: capture ? 'pipe' : silent ? 'ignore' : 'inherit',
        env: fullEnv,
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      if (capture) {
        child.stdout.on('data', data => (stdout += data.toString()));
        child.stderr.on('data', data => (stderr += data.toString()));
      }

      const timeoutId = setTimeout(() => {
        child.kill();
        reject(new Error('명령 실행 타임아웃'));
      }, timeout);

      child.on('close', code => {
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`명령 실행 실패 (exit code: ${code})`));
        }
      });

      child.on('error', error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  showHelp() {
    console.log(`
🧪 Convex 환경 배포 테스트 도구

사용법:
  node scripts/test-environments.js [environment] [options]

환경:
  all         모든 환경 테스트 (기본값)
  staging     스테이징 환경만 테스트
  production  프로덕션 환경만 테스트

옵션:
  --dry-run   실제 배포 없이 드라이런만 수행
  --help      도움말 표시

예시:
  node scripts/test-environments.js all --dry-run
  node scripts/test-environments.js staging
  node scripts/test-environments.js production --dry-run
`);
  }
}

// 메인 실행
async function main() {
  if (args.includes('--help')) {
    new EnvironmentTester().showHelp();
    return;
  }

  const tester = new EnvironmentTester();
  await tester.runTests();
}

if (require.main === module) {
  main();
}
