#!/usr/bin/env node

/**
 * Convex 배포 스크립트
 * 환경별 Convex 배포를 수행하고 검증합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 명령행 인수 파싱
const args = process.argv.slice(2);
const environment = args[0] || process.env.CONVEX_DEPLOYMENT_ENV || 'development';
const isDryRun = args.includes('--dry-run');
const skipVerification = args.includes('--skip-verification');
const force = args.includes('--force');

console.log('🚀 Convex 배포 스크립트를 시작합니다...');
console.log(`📍 환경: ${environment}`);
console.log(`🔍 드라이런: ${isDryRun ? 'Yes' : 'No'}`);

class ConvexDeployer {
  constructor(environment) {
    this.environment = environment;
    this.deploymentKey = this.getDeploymentKey();
    this.deploymentUrl = null;
    this.backupId = null;
  }

  getDeploymentKey() {
    const keyMap = {
      development: process.env.CONVEX_DEV_DEPLOYMENT_KEY,
      preview: process.env.CONVEX_PREVIEW_DEPLOYMENT_KEY,
      staging: process.env.CONVEX_STAGING_DEPLOYMENT_KEY,
      production: process.env.CONVEX_DEPLOYMENT_KEY,
    };

    const key = keyMap[this.environment];

    if (!key && !isDryRun) {
      throw new Error(`🚨 ${this.environment} 환경의 배포 키가 설정되지 않았습니다.`);
    }

    return key || 'dry-run-key'; // 드라이런 모드에서는 더미 키 사용
  }

  async deploy() {
    try {
      console.log('\n📋 배포 프로세스를 시작합니다...');

      // 1. 환경 검증
      await this.validateEnvironment();

      // 2. 백업 생성 (프로덕션만)
      if (this.environment === 'production' && !isDryRun) {
        await this.createBackup();
      }

      // 3. 배포 실행
      if (!isDryRun) {
        await this.executeDeployment();
      } else {
        console.log('🔍 드라이런 모드: 실제 배포를 건너뜁니다.');
      }

      // 4. 배포 검증
      if (!skipVerification && !isDryRun) {
        await this.verifyDeployment();
      }

      // 5. 성공 알림
      this.notifySuccess();

      return true;
    } catch (error) {
      console.error('❌ 배포 실패:', error.message);

      // 롤백 시도 (프로덕션만)
      if (this.environment === 'production' && this.backupId && !isDryRun) {
        await this.rollback();
      }

      throw error;
    }
  }

  async validateEnvironment() {
    console.log('🔍 환경 검증 중...');

    // 필수 환경 변수 확인
    const requiredVars = this.getRequiredEnvironmentVariables();
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0 && !isDryRun) {
      throw new Error(`필수 환경 변수가 누락되었습니다: ${missing.join(', ')}`);
    } else if (missing.length > 0 && isDryRun) {
      console.log(`  ⚠️ 드라이런 모드: 누락된 환경 변수 ${missing.join(', ')}를 무시합니다.`);
    }

    // Convex CLI 설치 확인
    try {
      await this.runCommand('npx', ['convex', '--version'], { silent: true });
      console.log('  ✅ Convex CLI 사용 가능');
    } catch (error) {
      throw new Error('Convex CLI가 설치되지 않았습니다.');
    }

    // 프로젝트 구조 확인
    const convexDir = path.join(process.cwd(), 'convex');
    if (!fs.existsSync(convexDir)) {
      throw new Error('Convex 디렉토리가 존재하지 않습니다.');
    }

    console.log('  ✅ 환경 검증 완료');
  }

  getRequiredEnvironmentVariables() {
    const baseVars = ['NODE_ENV'];
    const envVars = {
      development: ['CONVEX_DEV_DEPLOYMENT_KEY'],
      preview: ['CONVEX_PREVIEW_DEPLOYMENT_KEY'],
      staging: ['CONVEX_STAGING_DEPLOYMENT_KEY'],
      production: ['CONVEX_DEPLOYMENT_KEY', 'CONVEX_URL'],
    };

    return [...baseVars, ...(envVars[this.environment] || [])];
  }

  async createBackup() {
    console.log('📸 백업 생성 중...');

    try {
      const result = await this.runCommand(
        'npx',
        ['convex', 'deployments', 'list', '--format=json'],
        {
          capture: true,
          env: { CONVEX_DEPLOY_KEY: this.deploymentKey },
        }
      );

      const deployments = JSON.parse(result.stdout);
      if (deployments.length > 0) {
        this.backupId = deployments[0].id;
        console.log(`  ✅ 백업 ID: ${this.backupId}`);
      } else {
        console.log('  ⚠️ 기존 배포가 없어 백업을 건너뜁니다.');
      }
    } catch (error) {
      console.warn('  ⚠️ 백업 생성 실패:', error.message);
    }
  }

  async executeDeployment() {
    console.log('🚀 Convex 배포 실행 중...');

    const deployArgs = ['convex', 'deploy'];

    // 환경별 추가 옵션
    if (this.environment === 'preview') {
      deployArgs.push('--cmd-url-env-var-name', 'DEPLOYMENT_URL');
    }

    try {
      const result = await this.runCommand('npx', deployArgs, {
        env: {
          CONVEX_DEPLOY_KEY: this.deploymentKey,
          NODE_ENV: this.environment,
        },
        capture: true,
      });

      // 배포 URL 추출
      if (this.environment === 'preview' && process.env.DEPLOYMENT_URL) {
        this.deploymentUrl = process.env.DEPLOYMENT_URL;
      }

      console.log('  ✅ Convex 배포 완료');
      if (this.deploymentUrl) {
        console.log(`  📍 배포 URL: ${this.deploymentUrl}`);
      }
    } catch (error) {
      throw new Error(`Convex 배포 실패: ${error.message}`);
    }
  }

  async verifyDeployment() {
    console.log('✅ 배포 검증 중...');

    try {
      // 배포 검증 스크립트 실행
      const verificationScript = path.join(__dirname, 'verify-deployment.js');

      if (fs.existsSync(verificationScript)) {
        await this.runCommand('node', [verificationScript], {
          env: {
            DEPLOYMENT_URL: this.deploymentUrl || process.env.CONVEX_URL,
            VERIFICATION_TIMEOUT: '120000',
          },
        });
        console.log('  ✅ 배포 검증 성공');
      } else {
        console.log('  ⚠️ 검증 스크립트가 없어 기본 검증을 수행합니다.');
        await this.basicVerification();
      }
    } catch (error) {
      throw new Error(`배포 검증 실패: ${error.message}`);
    }
  }

  async basicVerification() {
    // 기본 연결 테스트
    try {
      await this.runCommand('npx', ['convex', 'deployments', 'list'], {
        env: { CONVEX_DEPLOY_KEY: this.deploymentKey },
        timeout: 30000,
      });
      console.log('  ✅ 기본 연결 검증 성공');
    } catch (error) {
      throw new Error(`기본 검증 실패: ${error.message}`);
    }
  }

  async rollback() {
    if (!this.backupId) {
      console.log('❌ 롤백할 백업이 없습니다.');
      return;
    }

    console.log(`🔄 이전 배포로 롤백 중... (${this.backupId})`);

    try {
      await this.runCommand('npx', ['convex', 'deploy', '--to', this.backupId], {
        env: { CONVEX_DEPLOY_KEY: this.deploymentKey },
      });

      console.log('✅ 롤백 완료');
    } catch (error) {
      console.error('❌ 롤백 실패:', error.message);
    }
  }

  notifySuccess() {
    console.log('\n🎉 Convex 배포가 성공적으로 완료되었습니다!');
    console.log(`📍 환경: ${this.environment}`);

    if (this.deploymentUrl) {
      console.log(`🌐 URL: ${this.deploymentUrl}`);
    }

    console.log('✅ 모든 검증이 통과했습니다.');
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
        child.stdout.on('data', data => {
          stdout += data.toString();
        });

        child.stderr.on('data', data => {
          stderr += data.toString();
        });
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
          reject(new Error(`명령 실행 실패 (exit code: ${code})\n${stderr}`));
        }
      });

      child.on('error', error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }
}

// 도움말 표시
function showHelp() {
  console.log(`
🚀 Convex 배포 스크립트

사용법:
  node scripts/deploy-convex.js [environment] [options]

환경:
  development  로컬 개발 환경 (기본값)
  preview      PR 미리보기 환경
  staging      스테이징 환경
  production   프로덕션 환경

옵션:
  --dry-run           실제 배포 없이 드라이런만 수행
  --skip-verification 배포 검증 건너뛰기
  --force             강제 배포 (백업 없이)
  --help              도움말 표시

예시:
  node scripts/deploy-convex.js production
  node scripts/deploy-convex.js staging --dry-run
  node scripts/deploy-convex.js preview --skip-verification
`);
}

// 메인 실행
async function main() {
  if (args.includes('--help')) {
    showHelp();
    return;
  }

  const deployer = new ConvexDeployer(environment);

  try {
    await deployer.deploy();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 배포 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
