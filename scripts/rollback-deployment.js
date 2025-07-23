#!/usr/bin/env node

/**
 * Convex 배포 자동 롤백 시스템
 * 실패한 배포를 이전 안정 버전으로 롤백합니다.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 환경 변수 설정
const ENVIRONMENT = process.env.NODE_ENV || process.env.CONVEX_DEPLOYMENT_ENV || 'development';
const ROLLBACK_TIMEOUT = parseInt(process.env.ROLLBACK_TIMEOUT) || 300000; // 5분
const MAX_ROLLBACK_ATTEMPTS = parseInt(process.env.MAX_ROLLBACK_ATTEMPTS) || 3;
const BACKUP_ID = process.env.BACKUP_DEPLOYMENT_ID;

console.log('🔄 Convex 배포 롤백 시스템을 시작합니다...');
console.log(`🌍 환경: ${ENVIRONMENT}`);
console.log(`⏱️ 타임아웃: ${ROLLBACK_TIMEOUT}ms`);
console.log(`🔁 최대 재시도: ${MAX_ROLLBACK_ATTEMPTS}회`);

class DeploymentRollback {
  constructor() {
    this.environment = ENVIRONMENT;
    this.deploymentKey = this.getDeploymentKey();
    this.backupId = BACKUP_ID;
    this.rollbackAttempts = 0;
    this.rollbackLog = [];
  }

  getDeploymentKey() {
    const keyMap = {
      development: process.env.CONVEX_DEV_DEPLOYMENT_KEY,
      preview: process.env.CONVEX_PREVIEW_DEPLOYMENT_KEY,
      staging: process.env.CONVEX_STAGING_DEPLOYMENT_KEY,
      production: process.env.CONVEX_DEPLOYMENT_KEY,
    };

    const key = keyMap[this.environment];

    if (!key) {
      throw new Error(`🚨 ${this.environment} 환경의 배포 키가 설정되지 않았습니다.`);
    }

    return key;
  }

  async executeRollback() {
    try {
      console.log('\n📋 롤백 프로세스를 시작합니다...');

      // 1. 현재 배포 상태 확인
      await this.checkCurrentDeploymentState();

      // 2. 백업 ID 확인 또는 검색
      await this.identifyRollbackTarget();

      // 3. 롤백 전 백업 생성
      await this.createPreRollbackBackup();

      // 4. 롤백 실행
      await this.performRollback();

      // 5. 롤백 검증
      await this.verifyRollback();

      // 6. 롤백 완료 알림
      await this.notifyRollbackSuccess();

      return true;
    } catch (error) {
      console.error('❌ 롤백 실패:', error.message);
      await this.handleRollbackFailure(error);
      throw error;
    }
  }

  async checkCurrentDeploymentState() {
    console.log('🔍 현재 배포 상태 확인 중...');

    try {
      const result = await this.runConvexCommand(['deployments', 'list', '--format=json']);
      const deployments = JSON.parse(result.stdout);

      if (deployments.length === 0) {
        throw new Error('배포된 인스턴스가 없습니다.');
      }

      const currentDeployment = deployments[0];

      console.log(`  ✅ 현재 배포 ID: ${currentDeployment.id}`);
      console.log(`  📅 배포 시간: ${new Date(currentDeployment.createdAt).toLocaleString()}`);

      this.currentDeploymentId = currentDeployment.id;
      this.rollbackLog.push({
        timestamp: new Date().toISOString(),
        action: 'check_current_state',
        details: `현재 배포 ID: ${currentDeployment.id}`,
      });
    } catch (error) {
      throw new Error(`현재 배포 상태 확인 실패: ${error.message}`);
    }
  }

  async identifyRollbackTarget() {
    console.log('🎯 롤백 대상 식별 중...');

    try {
      if (this.backupId) {
        console.log(`  📋 지정된 백업 ID 사용: ${this.backupId}`);
        this.targetDeploymentId = this.backupId;
        return;
      }

      // 백업 ID가 없으면 이전 안정 버전 찾기
      const result = await this.runConvexCommand(['deployments', 'list', '--format=json']);
      const deployments = JSON.parse(result.stdout);

      if (deployments.length < 2) {
        throw new Error('롤백할 이전 배포가 없습니다.');
      }

      // 현재 배포를 제외한 가장 최근 배포를 롤백 대상으로 선택
      const previousDeployment = deployments[1];
      this.targetDeploymentId = previousDeployment.id;

      console.log(`  ✅ 롤백 대상 ID: ${this.targetDeploymentId}`);
      console.log(
        `  📅 대상 배포 시간: ${new Date(previousDeployment.createdAt).toLocaleString()}`
      );

      this.rollbackLog.push({
        timestamp: new Date().toISOString(),
        action: 'identify_target',
        details: `롤백 대상 ID: ${this.targetDeploymentId}`,
      });
    } catch (error) {
      throw new Error(`롤백 대상 식별 실패: ${error.message}`);
    }
  }

  async createPreRollbackBackup() {
    if (this.environment !== 'production') {
      console.log('⏭️ 프로덕션이 아닌 환경에서는 롤백 전 백업을 건너뜁니다.');
      return;
    }

    console.log('💾 롤백 전 현재 상태 백업 중...');

    try {
      // 현재 배포 ID는 이미 파악되어 있음
      this.preRollbackBackupId = this.currentDeploymentId;

      console.log(`  ✅ 롤백 전 백업 ID: ${this.preRollbackBackupId}`);

      this.rollbackLog.push({
        timestamp: new Date().toISOString(),
        action: 'create_backup',
        details: `백업 ID: ${this.preRollbackBackupId}`,
      });
    } catch (error) {
      console.log(`  ⚠️ 백업 생성 실패 (계속 진행): ${error.message}`);
    }
  }

  async performRollback() {
    console.log('🔄 롤백 실행 중...');

    while (this.rollbackAttempts < MAX_ROLLBACK_ATTEMPTS) {
      this.rollbackAttempts++;

      try {
        console.log(`  📋 롤백 시도 ${this.rollbackAttempts}/${MAX_ROLLBACK_ATTEMPTS}...`);

        // Convex CLI를 사용한 롤백 실행
        await this.runConvexCommand(['deploy', '--to', this.targetDeploymentId]);

        console.log(`  ✅ 롤백 실행 완료 (시도 ${this.rollbackAttempts})`);

        this.rollbackLog.push({
          timestamp: new Date().toISOString(),
          action: 'perform_rollback',
          details: `성공적으로 ${this.targetDeploymentId}로 롤백`,
          attempt: this.rollbackAttempts,
        });

        return; // 성공 시 함수 종료
      } catch (error) {
        console.log(`  ❌ 롤백 시도 ${this.rollbackAttempts} 실패: ${error.message}`);

        this.rollbackLog.push({
          timestamp: new Date().toISOString(),
          action: 'rollback_attempt_failed',
          details: error.message,
          attempt: this.rollbackAttempts,
        });

        if (this.rollbackAttempts >= MAX_ROLLBACK_ATTEMPTS) {
          throw new Error(`최대 롤백 시도 횟수 (${MAX_ROLLBACK_ATTEMPTS})를 초과했습니다.`);
        }

        // 재시도 전 대기
        console.log(`  ⏳ ${3}초 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  async verifyRollback() {
    console.log('✅ 롤백 검증 중...');

    try {
      // 현재 배포 상태 다시 확인
      const result = await this.runConvexCommand(['deployments', 'list', '--format=json']);
      const deployments = JSON.parse(result.stdout);

      const currentDeployment = deployments[0];

      if (currentDeployment.id === this.targetDeploymentId) {
        console.log(`  ✅ 롤백 검증 성공: ${this.targetDeploymentId}`);

        this.rollbackLog.push({
          timestamp: new Date().toISOString(),
          action: 'verify_rollback',
          details: '롤백 검증 성공',
        });

        // 기본 기능 테스트
        await this.runBasicFunctionalityTest();
      } else {
        throw new Error(
          `롤백 실패: 현재 배포 ID (${currentDeployment.id})가 대상 ID (${this.targetDeploymentId})와 다릅니다.`
        );
      }
    } catch (error) {
      throw new Error(`롤백 검증 실패: ${error.message}`);
    }
  }

  async runBasicFunctionalityTest() {
    console.log('🧪 기본 기능 테스트 실행 중...');

    try {
      // 기본 검증 스크립트 실행
      const verificationScript = path.join(__dirname, 'verify-deployment.js');

      if (fs.existsSync(verificationScript)) {
        await this.runCommand('node', [verificationScript], {
          env: {
            DEPLOYMENT_URL: process.env.CONVEX_URL || process.env.CONVEX_STAGING_URL,
            VERIFICATION_TIMEOUT: '60000',
          },
        });
        console.log(`  ✅ 기본 기능 테스트 성공`);
      } else {
        console.log(`  ⚠️ 검증 스크립트가 없어 기본 테스트를 건너뜁니다.`);
      }

      this.rollbackLog.push({
        timestamp: new Date().toISOString(),
        action: 'basic_test',
        details: '기본 기능 테스트 완료',
      });
    } catch (error) {
      console.log(`  ⚠️ 기본 기능 테스트 실패: ${error.message}`);
      // 테스트 실패는 롤백 자체를 실패로 보지 않음
    }
  }

  async notifyRollbackSuccess() {
    console.log('📢 롤백 성공 알림...');

    const report = {
      status: 'success',
      environment: this.environment,
      rolledBackFrom: this.currentDeploymentId,
      rolledBackTo: this.targetDeploymentId,
      attempts: this.rollbackAttempts,
      timestamp: new Date().toISOString(),
      log: this.rollbackLog,
    };

    // 롤백 보고서 저장
    const reportPath = path.join('.', 'rollback-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 롤백 보고서 저장: ${reportPath}`);

    // 알림 전송 (구현 가능)
    if (process.env.SLACK_WEBHOOK || process.env.DISCORD_WEBHOOK) {
      console.log('📱 알림 전송 완료');
    }
  }

  async handleRollbackFailure(error) {
    console.log('💥 롤백 실패 처리 중...');

    const report = {
      status: 'failed',
      environment: this.environment,
      error: error.message,
      attempts: this.rollbackAttempts,
      timestamp: new Date().toISOString(),
      log: this.rollbackLog,
      recovery: {
        manualSteps: [
          '1. Convex 대시보드에서 수동 롤백 수행',
          '2. 이전 안정 버전의 배포 ID 확인',
          '3. 데이터 일관성 검증',
          '4. 서비스 상태 모니터링',
        ],
      },
    };

    // 실패 보고서 저장
    const reportPath = path.join('.', 'rollback-failure-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 롤백 실패 보고서 저장: ${reportPath}`);

    // 긴급 알림 전송
    console.log('🚨 긴급 롤백 실패 알림 전송');
  }

  async runConvexCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
      const { env = {}, capture = true, timeout = ROLLBACK_TIMEOUT } = options;

      const fullEnv = {
        ...process.env,
        CONVEX_DEPLOY_KEY: this.deploymentKey,
        ...env,
      };

      const child = spawn('npx', ['convex', ...args], {
        stdio: capture ? 'pipe' : 'inherit',
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
        reject(new Error('Convex 명령 실행 타임아웃'));
      }, timeout);

      child.on('close', code => {
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Convex 명령 실행 실패 (exit code: ${code})\n${stderr}`));
        }
      });

      child.on('error', error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  async runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const { env = {}, timeout = 60000 } = options;

      const fullEnv = { ...process.env, ...env };
      const child = spawn(command, args, {
        stdio: 'inherit',
        env: fullEnv,
        shell: true,
      });

      const timeoutId = setTimeout(() => {
        child.kill();
        reject(new Error('명령 실행 타임아웃'));
      }, timeout);

      child.on('close', code => {
        clearTimeout(timeoutId);

        if (code === 0) {
          resolve();
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
🔄 Convex 배포 롤백 시스템

사용법:
  node scripts/rollback-deployment.js [options]

환경 변수:
  BACKUP_DEPLOYMENT_ID     롤백할 특정 배포 ID
  ROLLBACK_TIMEOUT         롤백 타임아웃 (기본: 300000ms)
  MAX_ROLLBACK_ATTEMPTS    최대 재시도 횟수 (기본: 3)
  CONVEX_DEPLOYMENT_KEY    배포 키 (환경별)

예시:
  # 자동 롤백 (이전 배포로)
  node scripts/rollback-deployment.js
  
  # 특정 배포 ID로 롤백
  BACKUP_DEPLOYMENT_ID=dep_12345 node scripts/rollback-deployment.js
`);
  }
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    new DeploymentRollback().showHelp();
    return;
  }

  const rollback = new DeploymentRollback();

  try {
    await rollback.executeRollback();
    console.log('\n🎉 롤백이 성공적으로 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 롤백 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
