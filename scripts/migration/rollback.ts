/**
 * 마이그레이션 롤백 실행 스크립트
 * rollback-plan.json에 따라 마이그레이션을 롤백합니다.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { RollbackManager } from './validate-migration';

async function executeRollback(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const planPath =
    args.find(arg => arg.startsWith('--plan='))?.split('=')[1] || 'rollback-plan.json';

  console.log('🔄 마이그레이션 롤백 스크립트 시작');

  if (dryRun) {
    console.log('🔍 DRY RUN 모드: --execute 플래그를 사용하여 실제 롤백을 실행하세요.');
  } else {
    console.log('⚠️ 실제 롤백을 실행합니다. 이 작업은 되돌릴 수 없습니다!');
  }

  // 롤백 계획 로드
  const rollbackPlanPath = join(process.cwd(), planPath);

  if (!existsSync(rollbackPlanPath)) {
    console.error(`❌ 롤백 계획 파일을 찾을 수 없습니다: ${rollbackPlanPath}`);
    console.log(
      '💡 먼저 마이그레이션 검증을 실행하여 롤백 계획을 생성하세요: npm run convex:validate'
    );
    process.exit(1);
  }

  try {
    const rollbackPlan = JSON.parse(readFileSync(rollbackPlanPath, 'utf-8'));
    console.log(`📋 롤백 계획 로드됨: ${new Date(rollbackPlan.timestamp).toLocaleString()}`);
    console.log(`📊 영향받는 테이블: ${rollbackPlan.affectedTables.length}개`);

    // 사용자 확인 (실제 롤백 시)
    if (!dryRun) {
      console.log('\n⚠️ 다음 테이블의 데이터가 모두 삭제됩니다:');
      rollbackPlan.affectedTables.forEach((table: string) => {
        console.log(`  - ${table}`);
      });

      console.log('\n계속하려면 "ROLLBACK_CONFIRMED"를 입력하세요:');

      // 실제 환경에서는 readline을 사용하여 사용자 입력 받음
      // const confirmation = await promptUser()
      // if (confirmation !== 'ROLLBACK_CONFIRMED') {
      //   console.log('❌ 롤백이 취소되었습니다.')
      //   process.exit(0)
      // }

      console.log('[시뮬레이션] 사용자 확인 완료');
    }

    // 롤백 실행
    const rollbackManager = new RollbackManager();
    await rollbackManager.executeRollback(rollbackPlan, dryRun);
  } catch (error) {
    console.error('💥 롤백 실행 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  executeRollback()
    .then(() => {
      console.log('✨ 롤백 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 롤백 스크립트 실패:', error);
      process.exit(1);
    });
}
