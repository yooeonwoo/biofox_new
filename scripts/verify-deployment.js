#!/usr/bin/env node

/**
 * Convex 배포 검증 스크립트
 * 배포된 Convex 함수들이 정상적으로 작동하는지 확인합니다.
 */

const { ConvexHttpClient } = require('convex/browser');

const VERIFICATION_TIMEOUT = parseInt(process.env.VERIFICATION_TIMEOUT) || 60000;
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL;

if (!DEPLOYMENT_URL) {
  console.error('❌ DEPLOYMENT_URL 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

console.log('🔍 Convex 배포 검증을 시작합니다...');
console.log(`📍 배포 URL: ${DEPLOYMENT_URL}`);
console.log(`⏱️ 타임아웃: ${VERIFICATION_TIMEOUT}ms`);

class DeploymentVerifier {
  constructor(deploymentUrl) {
    this.client = new ConvexHttpClient(deploymentUrl);
    this.tests = [];
    this.setupTests();
  }

  setupTests() {
    // 기본 연결 테스트
    this.tests.push({
      name: '기본 연결 테스트',
      test: () => this.testBasicConnection(),
      critical: true,
    });

    // 핵심 쿼리 함수 테스트
    this.tests.push({
      name: '대시보드 통계 쿼리 테스트',
      test: () => this.testDashboardStats(),
      critical: true,
    });

    this.tests.push({
      name: '사용자 프로필 쿼리 테스트',
      test: () => this.testUserProfiles(),
      critical: true,
    });

    this.tests.push({
      name: '실시간 기능 테스트',
      test: () => this.testRealtimeFeatures(),
      critical: false,
    });

    // 데이터베이스 무결성 테스트
    this.tests.push({
      name: '데이터베이스 무결성 테스트',
      test: () => this.testDatabaseIntegrity(),
      critical: true,
    });

    // 인증 시스템 테스트
    this.tests.push({
      name: '인증 시스템 테스트',
      test: () => this.testAuthSystem(),
      critical: false,
    });

    // 성능 테스트
    this.tests.push({
      name: '기본 성능 테스트',
      test: () => this.testPerformance(),
      critical: false,
    });
  }

  async testBasicConnection() {
    try {
      // 기본 연결 테스트를 위한 간단한 쿼리
      const result = await Promise.race([
        this.client.query('test.ping', {}),
        new Promise((_, reject) => setTimeout(() => reject(new Error('연결 타임아웃')), 5000)),
      ]);

      console.log('  ✅ 기본 연결 성공');
      return { success: true, details: '기본 연결이 정상적으로 작동합니다.' };
    } catch (error) {
      // ping 함수가 없을 수도 있으므로, 다른 방법으로 연결 테스트
      try {
        await this.client.query('profiles.getCurrentUser', {});
        console.log('  ✅ 대안 연결 방법으로 성공');
        return { success: true, details: '대안 연결 방법으로 연결 확인됨' };
      } catch (secondError) {
        console.log('  ❌ 기본 연결 실패:', error.message);
        return { success: false, error: error.message };
      }
    }
  }

  async testDashboardStats() {
    try {
      const result = await Promise.race([
        this.client.query('realtime.getDashboardStats', {}),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('대시보드 쿼리 타임아웃')), 10000)
        ),
      ]);

      if (!result || typeof result !== 'object') {
        throw new Error('잘못된 응답 형식');
      }

      const requiredFields = ['kolsCount', 'activeShops', 'monthlyOrders', 'monthlyRevenue'];
      const missingFields = requiredFields.filter(field => result[field] === undefined);

      if (missingFields.length > 0) {
        throw new Error(`필수 필드 누락: ${missingFields.join(', ')}`);
      }

      console.log('  ✅ 대시보드 통계 쿼리 성공');
      return {
        success: true,
        details: `KOL: ${result.kolsCount}, 매장: ${result.activeShops}, 주문: ${result.monthlyOrders}`,
      };
    } catch (error) {
      console.log('  ❌ 대시보드 통계 쿼리 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testUserProfiles() {
    try {
      const result = await Promise.race([
        this.client.query('profiles.getCurrentUser', {}),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('사용자 프로필 쿼리 타임아웃')), 8000)
        ),
      ]);

      // 인증되지 않은 상태에서도 쿼리가 실행되어야 함 (null 반환)
      console.log('  ✅ 사용자 프로필 쿼리 성공');
      return {
        success: true,
        details: result ? `사용자 ID: ${result._id}` : '비인증 상태 정상 처리',
      };
    } catch (error) {
      console.log('  ❌ 사용자 프로필 쿼리 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testRealtimeFeatures() {
    try {
      const result = await Promise.race([
        this.client.query('realtime.getRecentActivities', { limit: 5 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('실시간 기능 테스트 타임아웃')), 8000)
        ),
      ]);

      if (!Array.isArray(result)) {
        throw new Error('활동 목록이 배열이 아닙니다.');
      }

      console.log('  ✅ 실시간 기능 테스트 성공');
      return {
        success: true,
        details: `${result.length}개의 최근 활동 조회 성공`,
      };
    } catch (error) {
      console.log('  ❌ 실시간 기능 테스트 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testDatabaseIntegrity() {
    try {
      // 여러 테이블에서 데이터 조회를 통한 무결성 검사
      const tests = [
        { name: 'profiles', query: 'profiles.list', args: { limit: 1 } },
        { name: 'orders', query: 'orders.list', args: { limit: 1 } },
        { name: 'notifications', query: 'notifications.list', args: { limit: 1 } },
      ];

      const results = await Promise.allSettled(
        tests.map(test =>
          Promise.race([
            this.client.query(test.query, test.args),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`${test.name} 테이블 조회 타임아웃`)), 5000)
            ),
          ])
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed > 0) {
        const errors = results
          .filter(r => r.status === 'rejected')
          .map((r, i) => `${tests[i].name}: ${r.reason.message}`)
          .join(', ');

        console.log(`  ⚠️ 데이터베이스 무결성 부분 성공 (${successful}/${tests.length})`);
        return {
          success: successful > 0,
          details: `성공: ${successful}, 실패: ${failed}`,
          warning: errors,
        };
      }

      console.log('  ✅ 데이터베이스 무결성 테스트 성공');
      return {
        success: true,
        details: `모든 테이블 조회 성공 (${successful}/${tests.length})`,
      };
    } catch (error) {
      console.log('  ❌ 데이터베이스 무결성 테스트 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testAuthSystem() {
    try {
      // 인증 시스템의 기본 엔드포인트 테스트
      const result = await Promise.race([
        this.client.query('auth.currentUser', {}),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('인증 시스템 테스트 타임아웃')), 5000)
        ),
      ]);

      console.log('  ✅ 인증 시스템 테스트 성공');
      return {
        success: true,
        details: '인증 시스템이 정상적으로 응답합니다.',
      };
    } catch (error) {
      // 인증 시스템은 선택적 기능이므로 실패해도 경고만 표시
      console.log('  ⚠️ 인증 시스템 테스트 실패 (선택적):', error.message);
      return { success: true, warning: error.message };
    }
  }

  async testPerformance() {
    try {
      const startTime = Date.now();

      await Promise.race([
        this.client.query('realtime.getDashboardStats', {}),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('성능 테스트 타임아웃')), 3000)
        ),
      ]);

      const responseTime = Date.now() - startTime;

      if (responseTime > 2000) {
        console.log(`  ⚠️ 성능 테스트 경고: 응답 시간이 느림 (${responseTime}ms)`);
        return {
          success: true,
          warning: `응답 시간: ${responseTime}ms (권장: <2000ms)`,
        };
      }

      console.log(`  ✅ 성능 테스트 성공 (${responseTime}ms)`);
      return {
        success: true,
        details: `응답 시간: ${responseTime}ms`,
      };
    } catch (error) {
      console.log('  ❌ 성능 테스트 실패:', error.message);
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log('\n🧪 배포 검증 테스트를 실행합니다...\n');

    const results = [];
    let criticalFailures = 0;

    for (const test of this.tests) {
      console.log(`🔍 ${test.name}...`);

      try {
        const result = await test.test();
        results.push({ ...test, result });

        if (!result.success && test.critical) {
          criticalFailures++;
        }
      } catch (error) {
        console.log(`  💥 예외 발생: ${error.message}`);
        results.push({
          ...test,
          result: { success: false, error: error.message },
        });

        if (test.critical) {
          criticalFailures++;
        }
      }
    }

    this.printSummary(results, criticalFailures);
    return criticalFailures === 0;
  }

  printSummary(results, criticalFailures) {
    console.log('\n📋 배포 검증 결과 요약:');
    console.log('═'.repeat(50));

    let successCount = 0;
    let warningCount = 0;
    let failureCount = 0;

    results.forEach(({ name, critical, result }) => {
      const status = result.success ? (result.warning ? '⚠️  경고' : '✅ 성공') : '❌ 실패';

      const criticalMark = critical ? '[중요]' : '[선택]';

      console.log(`${status} ${criticalMark} ${name}`);

      if (result.details) {
        console.log(`     → ${result.details}`);
      }

      if (result.warning) {
        console.log(`     ⚠️ ${result.warning}`);
        warningCount++;
      }

      if (result.error) {
        console.log(`     ❌ ${result.error}`);
        failureCount++;
      }

      if (result.success && !result.warning) {
        successCount++;
      }
    });

    console.log('═'.repeat(50));
    console.log(
      `📊 총 ${results.length}개 테스트 - 성공: ${successCount}, 경고: ${warningCount}, 실패: ${failureCount}`
    );

    if (criticalFailures > 0) {
      console.log(`❌ 중요한 기능 ${criticalFailures}개 실패 - 배포 검증 실패`);
    } else if (failureCount > 0 || warningCount > 0) {
      console.log(`⚠️  일부 문제가 있지만 배포 검증 통과`);
    } else {
      console.log(`🎉 모든 테스트 통과 - 배포 검증 성공!`);
    }
  }
}

// 메인 실행 함수
async function main() {
  const verifier = new DeploymentVerifier(DEPLOYMENT_URL);

  try {
    const success = await Promise.race([
      verifier.runAllTests(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('전체 검증 프로세스 타임아웃')), VERIFICATION_TIMEOUT)
      ),
    ]);

    if (success) {
      console.log('\n🎉 배포 검증이 성공적으로 완료되었습니다!');
      process.exit(0);
    } else {
      console.log('\n❌ 배포 검증이 실패했습니다.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 배포 검증 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  main();
}
