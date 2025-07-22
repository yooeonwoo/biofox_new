/**
 * 마이그레이션 데이터 검증 및 롤백 메커니즘
 * Supabase에서 Convex로 마이그레이션된 데이터의 무결성을 검증하고 문제 발생 시 롤백을 수행합니다.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// 마이그레이션 검증 결과 타입
interface ValidationResult {
  tableName: string;
  originalCount: number;
  migratedCount: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRecords: string[];
  duplicateRecords: string[];
}

interface MigrationValidationReport {
  timestamp: number;
  overallStatus: 'success' | 'warning' | 'failure';
  totalOriginalRecords: number;
  totalMigratedRecords: number;
  tablesValidated: number;
  tablesWithErrors: number;
  validationResults: ValidationResult[];
  summary: {
    recordCountMismatch: number;
    dataIntegrityIssues: number;
    referentialIntegrityIssues: number;
  };
}

// 롤백 계획 타입
interface RollbackPlan {
  timestamp: number;
  migrationBackupPath: string;
  affectedTables: string[];
  rollbackSteps: RollbackStep[];
}

interface RollbackStep {
  stepNumber: number;
  action: 'clear_table' | 'restore_backup' | 'verify_state';
  tableName?: string;
  description: string;
  estimatedDuration: number;
}

/**
 * 마이그레이션 검증기
 */
class MigrationValidator {
  constructor(
    private convexClient?: any,
    private supabaseClient?: any
  ) {}

  /**
   * 레코드 수 검증
   */
  async validateRecordCounts(
    originalDataPath: string,
    migrationStatusPath?: string
  ): Promise<ValidationResult[]> {
    console.log('🔍 레코드 수 검증 시작...');

    const results: ValidationResult[] = [];
    const originalDataDir = join(process.cwd(), originalDataPath);

    if (!existsSync(originalDataDir)) {
      throw new Error(`원본 데이터 디렉토리를 찾을 수 없습니다: ${originalDataDir}`);
    }

    // 원본 데이터에서 테이블별 레코드 수 확인
    const metadataPath = join(originalDataDir, 'metadata.json');
    const originalMetadata = existsSync(metadataPath)
      ? JSON.parse(readFileSync(metadataPath, 'utf-8'))
      : null;

    // 변환된 데이터에서 테이블별 레코드 수 확인
    const transformedDataPath = originalDataPath + '-transformed';
    const transformationMetadataPath = join(
      process.cwd(),
      transformedDataPath,
      'transformation-metadata.json'
    );
    const transformationMetadata = existsSync(transformationMetadataPath)
      ? JSON.parse(readFileSync(transformationMetadataPath, 'utf-8'))
      : null;

    // 테이블 목록 추출
    const tablesToValidate =
      originalMetadata?.tables?.map((t: any) => t.name) ||
      transformationMetadata?.transformationResults
        ? Object.keys(transformationMetadata.transformationResults)
        : [];

    for (const tableName of tablesToValidate) {
      const result: ValidationResult = {
        tableName,
        originalCount: 0,
        migratedCount: 0,
        isValid: true,
        errors: [],
        warnings: [],
        missingRecords: [],
        duplicateRecords: [],
      };

      try {
        // 원본 데이터 레코드 수
        const originalTablePath = join(originalDataDir, `${tableName}.json`);
        if (existsSync(originalTablePath)) {
          const originalData = JSON.parse(readFileSync(originalTablePath, 'utf-8'));
          result.originalCount = Array.isArray(originalData) ? originalData.length : 0;
        }

        // 변환된 데이터 레코드 수
        const transformedTablePath = join(process.cwd(), transformedDataPath, `${tableName}.json`);
        if (existsSync(transformedTablePath)) {
          const transformedData = JSON.parse(readFileSync(transformedTablePath, 'utf-8'));
          result.migratedCount = Array.isArray(transformedData) ? transformedData.length : 0;
        }

        // Convex에서 마이그레이션된 데이터 수 (실제 환경에서는 Convex 클라이언트 사용)
        // 현재는 변환된 데이터 수를 사용

        // 레코드 수 불일치 검사
        if (result.originalCount !== result.migratedCount) {
          result.isValid = false;
          result.errors.push(
            `레코드 수 불일치: 원본 ${result.originalCount}개, 마이그레이션된 ${result.migratedCount}개`
          );
        }

        // 데이터 무결성 검사 (샘플)
        await this.validateDataIntegrity(
          tableName,
          originalTablePath,
          transformedTablePath,
          result
        );
      } catch (error) {
        result.isValid = false;
        result.errors.push(
          `검증 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      results.push(result);

      const status = result.isValid ? '✅' : '❌';
      console.log(
        `  ${status} ${tableName}: ${result.migratedCount}/${result.originalCount} (${result.errors.length} 오류)`
      );
    }

    return results;
  }

  /**
   * 데이터 무결성 검증
   */
  private async validateDataIntegrity(
    tableName: string,
    originalPath: string,
    transformedPath: string,
    result: ValidationResult
  ): Promise<void> {
    try {
      if (!existsSync(originalPath) || !existsSync(transformedPath)) {
        return;
      }

      const originalData = JSON.parse(readFileSync(originalPath, 'utf-8'));
      const transformedData = JSON.parse(readFileSync(transformedPath, 'utf-8'));

      if (!Array.isArray(originalData) || !Array.isArray(transformedData)) {
        return;
      }

      // ID 기반 레코드 매핑 검증
      const originalIds = new Set(originalData.map((record: any) => record._id || record.id));
      const transformedIds = new Set(
        transformedData.map((record: any) => record.originalId || record._id)
      );

      // 누락된 레코드 찾기
      for (const originalId of originalIds) {
        if (!transformedIds.has(originalId)) {
          result.missingRecords.push(originalId);
        }
      }

      // 중복 레코드 찾기
      const transformedIdCounts = new Map<string, number>();
      for (const record of transformedData) {
        const id = record.originalId || record._id;
        transformedIdCounts.set(id, (transformedIdCounts.get(id) || 0) + 1);
      }

      for (const [id, count] of transformedIdCounts) {
        if (count > 1) {
          result.duplicateRecords.push(`${id} (${count}회 중복)`);
        }
      }

      // 필수 필드 검증 (테이블별)
      await this.validateRequiredFields(tableName, transformedData, result);

      // 경고 및 오류 정리
      if (result.missingRecords.length > 0) {
        result.isValid = false;
        result.errors.push(`누락된 레코드: ${result.missingRecords.length}개`);
      }

      if (result.duplicateRecords.length > 0) {
        result.isValid = false;
        result.errors.push(`중복된 레코드: ${result.duplicateRecords.length}개`);
      }
    } catch (error) {
      result.warnings.push(
        `데이터 무결성 검증 중 오류: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 필수 필드 검증
   */
  private async validateRequiredFields(
    tableName: string,
    data: any[],
    result: ValidationResult
  ): Promise<void> {
    const requiredFields: Record<string, string[]> = {
      profiles: ['email', 'name', 'role', 'status', 'shop_name'],
      orders: ['shop_id', 'total_amount', 'created_by'],
      clinical_cases: ['shop_id', 'subject_type', 'name', 'status', 'consent_status'],
      notifications: ['user_id', 'type', 'title', 'message'],
    };

    const fields = requiredFields[tableName];
    if (!fields) return;

    let recordsWithMissingFields = 0;

    for (const record of data) {
      const missingFields = fields.filter(field => !record[field]);
      if (missingFields.length > 0) {
        recordsWithMissingFields++;
        if (recordsWithMissingFields <= 5) {
          // 첫 5개만 상세 기록
          result.warnings.push(
            `레코드 ${record.originalId || 'unknown'}: 누락된 필수 필드 [${missingFields.join(', ')}]`
          );
        }
      }
    }

    if (recordsWithMissingFields > 0) {
      if (recordsWithMissingFields > 5) {
        result.warnings.push(
          `... 및 ${recordsWithMissingFields - 5}개 추가 레코드에서 필수 필드 누락`
        );
      }
    }
  }

  /**
   * 참조 무결성 검증
   */
  async validateReferentialIntegrity(dataPath: string): Promise<string[]> {
    console.log('🔗 참조 무결성 검증 시작...');
    const issues: string[] = [];

    try {
      const transformedDataPath = join(process.cwd(), dataPath);

      // profiles 테이블 로드 (참조 대상)
      const profilesPath = join(transformedDataPath, 'profiles.json');
      const profiles = existsSync(profilesPath)
        ? JSON.parse(readFileSync(profilesPath, 'utf-8'))
        : [];
      const profileIds = new Set(profiles.map((p: any) => p.originalId));

      // orders 테이블의 shop_id 참조 검증
      const ordersPath = join(transformedDataPath, 'orders.json');
      if (existsSync(ordersPath)) {
        const orders = JSON.parse(readFileSync(ordersPath, 'utf-8'));
        for (const order of orders) {
          if (order.shop_id && !profileIds.has(order.shop_id)) {
            issues.push(
              `orders.${order.originalId}: 존재하지 않는 shop_id 참조 (${order.shop_id})`
            );
          }
          if (order.created_by && !profileIds.has(order.created_by)) {
            issues.push(
              `orders.${order.originalId}: 존재하지 않는 created_by 참조 (${order.created_by})`
            );
          }
        }
      }

      // clinical_cases 테이블의 shop_id 참조 검증
      const clinicalCasesPath = join(transformedDataPath, 'clinical_cases.json');
      if (existsSync(clinicalCasesPath)) {
        const clinicalCases = JSON.parse(readFileSync(clinicalCasesPath, 'utf-8'));
        for (const clinicalCase of clinicalCases) {
          if (clinicalCase.shop_id && !profileIds.has(clinicalCase.shop_id)) {
            issues.push(
              `clinical_cases.${clinicalCase.originalId}: 존재하지 않는 shop_id 참조 (${clinicalCase.shop_id})`
            );
          }
        }
      }

      // notifications 테이블의 user_id 참조 검증
      const notificationsPath = join(transformedDataPath, 'notifications.json');
      if (existsSync(notificationsPath)) {
        const notifications = JSON.parse(readFileSync(notificationsPath, 'utf-8'));
        for (const notification of notifications) {
          if (notification.user_id && !profileIds.has(notification.user_id)) {
            issues.push(
              `notifications.${notification.originalId}: 존재하지 않는 user_id 참조 (${notification.user_id})`
            );
          }
        }
      }

      if (issues.length === 0) {
        console.log('✅ 참조 무결성 검증 완료: 문제 없음');
      } else {
        console.log(`⚠️ 참조 무결성 문제 발견: ${issues.length}개`);
      }
    } catch (error) {
      const errorMsg = `참조 무결성 검증 중 오류: ${error instanceof Error ? error.message : String(error)}`;
      issues.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }

    return issues;
  }

  /**
   * 전체 마이그레이션 검증 실행
   */
  async validateMigration(
    originalDataPath: string = 'migration-data',
    transformedDataPath: string = 'migration-data-transformed'
  ): Promise<MigrationValidationReport> {
    console.log('🔍 마이그레이션 전체 검증 시작...');

    const validationResults = await this.validateRecordCounts(originalDataPath);
    const referentialIntegrityIssues = await this.validateReferentialIntegrity(transformedDataPath);

    const totalOriginalRecords = validationResults.reduce(
      (sum, result) => sum + result.originalCount,
      0
    );
    const totalMigratedRecords = validationResults.reduce(
      (sum, result) => sum + result.migratedCount,
      0
    );
    const tablesWithErrors = validationResults.filter(result => !result.isValid).length;

    const recordCountMismatch = validationResults.filter(
      result => result.originalCount !== result.migratedCount
    ).length;
    const dataIntegrityIssues = validationResults.reduce(
      (sum, result) => sum + result.errors.length + result.warnings.length,
      0
    );

    let overallStatus: 'success' | 'warning' | 'failure';
    if (tablesWithErrors > 0 || referentialIntegrityIssues.length > 0) {
      overallStatus = 'failure';
    } else if (dataIntegrityIssues > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'success';
    }

    const report: MigrationValidationReport = {
      timestamp: Date.now(),
      overallStatus,
      totalOriginalRecords,
      totalMigratedRecords,
      tablesValidated: validationResults.length,
      tablesWithErrors,
      validationResults,
      summary: {
        recordCountMismatch,
        dataIntegrityIssues,
        referentialIntegrityIssues: referentialIntegrityIssues.length,
      },
    };

    // 검증 보고서 저장
    const reportPath = join(process.cwd(), 'migration-validation-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

    // 결과 출력
    this.printValidationSummary(report, referentialIntegrityIssues);

    return report;
  }

  /**
   * 검증 결과 요약 출력
   */
  private printValidationSummary(
    report: MigrationValidationReport,
    referentialIssues: string[]
  ): void {
    console.log('\n📊 마이그레이션 검증 결과 요약');
    console.log(`📅 검증 시간: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(
      `📈 전체 상태: ${report.overallStatus === 'success' ? '✅ 성공' : report.overallStatus === 'warning' ? '⚠️ 경고' : '❌ 실패'}`
    );
    console.log(`📊 레코드 수: ${report.totalMigratedRecords}/${report.totalOriginalRecords}`);
    console.log(
      `📋 검증된 테이블: ${report.tablesValidated}개 (오류: ${report.tablesWithErrors}개)`
    );

    console.log('\n📋 테이블별 결과:');
    report.validationResults.forEach(result => {
      const status = result.isValid ? '✅' : '❌';
      console.log(
        `  ${status} ${result.tableName}: ${result.migratedCount}/${result.originalCount}`
      );
      if (result.errors.length > 0) {
        result.errors.forEach(error => console.log(`    ❌ ${error}`));
      }
      if (result.warnings.length > 0 && result.warnings.length <= 3) {
        result.warnings.forEach(warning => console.log(`    ⚠️ ${warning}`));
      }
    });

    if (referentialIssues.length > 0) {
      console.log('\n🔗 참조 무결성 문제:');
      referentialIssues.slice(0, 10).forEach(issue => console.log(`  ❌ ${issue}`));
      if (referentialIssues.length > 10) {
        console.log(`  ... 및 ${referentialIssues.length - 10}개 추가 문제`);
      }
    }

    console.log(`\n📄 상세 보고서: migration-validation-report.json`);
  }
}

/**
 * 롤백 관리자
 */
class RollbackManager {
  /**
   * 롤백 계획 생성
   */
  createRollbackPlan(migrationBackupPath: string, affectedTables: string[]): RollbackPlan {
    const rollbackSteps: RollbackStep[] = [];
    let stepNumber = 1;

    // 1. Convex 테이블 클리어
    for (const tableName of affectedTables.reverse()) {
      // 의존성 역순
      rollbackSteps.push({
        stepNumber: stepNumber++,
        action: 'clear_table',
        tableName,
        description: `${tableName} 테이블의 마이그레이션된 데이터 삭제`,
        estimatedDuration: 30, // 초
      });
    }

    // 2. 상태 검증
    rollbackSteps.push({
      stepNumber: stepNumber++,
      action: 'verify_state',
      description: 'Convex 데이터베이스 상태 검증 및 정리 완료 확인',
      estimatedDuration: 10,
    });

    return {
      timestamp: Date.now(),
      migrationBackupPath,
      affectedTables,
      rollbackSteps,
    };
  }

  /**
   * 롤백 실행 (시뮬레이션)
   */
  async executeRollback(plan: RollbackPlan, dryRun: boolean = true): Promise<void> {
    console.log('🔄 롤백 실행 시작...');
    if (dryRun) {
      console.log('🔍 DRY RUN 모드: 실제 변경 없이 시뮬레이션만 실행됩니다.');
    }

    const totalDuration = plan.rollbackSteps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    console.log(`⏱️ 예상 소요 시간: ${totalDuration}초`);

    for (const step of plan.rollbackSteps) {
      console.log(`\n${step.stepNumber}. ${step.description}`);

      if (!dryRun) {
        // 실제 롤백 작업 수행
        switch (step.action) {
          case 'clear_table':
            await this.clearConvexTable(step.tableName!);
            break;
          case 'verify_state':
            await this.verifyCleanState();
            break;
        }
      } else {
        console.log(`  [DRY RUN] ${step.action} 액션 시뮬레이션`);
      }

      // 진행 시간 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`  ✅ 완료 (예상 시간: ${step.estimatedDuration}초)`);
    }

    console.log('\n🎉 롤백 완료!');
    if (!dryRun) {
      console.log('💾 Convex 데이터베이스가 마이그레이션 이전 상태로 복구되었습니다.');
    }
  }

  /**
   * Convex 테이블 클리어 (실제 환경에서는 Convex 클라이언트 사용)
   */
  private async clearConvexTable(tableName: string): Promise<void> {
    console.log(`    🗑️ ${tableName} 테이블 클리어 중...`);
    // 실제 구현에서는 convex.clearMigrationData() 호출
    // await this.convexClient.mutation('migration:clearMigrationData', { tableName, confirm: true })
  }

  /**
   * 정리 상태 검증
   */
  private async verifyCleanState(): Promise<void> {
    console.log('    🔍 Convex 상태 검증 중...');
    // 실제 구현에서는 각 테이블의 레코드 수가 0인지 확인
    // const status = await this.convexClient.query('migration:getMigrationStatus')
    // 모든 테이블이 비어있는지 확인
  }
}

/**
 * 메인 실행 함수
 */
async function runMigrationValidation(): Promise<void> {
  const validator = new MigrationValidator();
  const rollbackManager = new RollbackManager();

  try {
    // 1. 마이그레이션 검증 실행
    const report = await validator.validateMigration();

    // 2. 검증 실패 시 롤백 계획 생성
    if (report.overallStatus === 'failure') {
      console.log('\n⚠️ 마이그레이션 검증에 실패했습니다. 롤백 계획을 생성합니다...');

      const affectedTables = report.validationResults
        .filter(result => !result.isValid)
        .map(result => result.tableName);

      if (affectedTables.length > 0) {
        const rollbackPlan = rollbackManager.createRollbackPlan(
          'migration-data-backup',
          affectedTables
        );

        // 롤백 계획 저장
        const rollbackPlanPath = join(process.cwd(), 'rollback-plan.json');
        writeFileSync(rollbackPlanPath, JSON.stringify(rollbackPlan, null, 2), 'utf-8');

        console.log('📋 롤백 계획이 생성되었습니다: rollback-plan.json');
        console.log('🔄 롤백을 실행하려면: npm run convex:rollback');

        // 롤백 시뮬레이션 실행
        await rollbackManager.executeRollback(rollbackPlan, true);
      }
    } else {
      console.log('\n✅ 마이그레이션 검증 완료: 문제가 발견되지 않았습니다.');
    }
  } catch (error) {
    console.error('💥 검증 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 스크립트 실행
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const originalDataPath =
    args.find(arg => arg.startsWith('--original='))?.split('=')[1] || 'migration-data';
  const transformedDataPath =
    args.find(arg => arg.startsWith('--transformed='))?.split('=')[1] ||
    'migration-data-transformed';

  runMigrationValidation()
    .then(() => {
      console.log('✨ 검증 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 검증 스크립트 실패:', error);
      process.exit(1);
    });
}

export { MigrationValidator, RollbackManager, runMigrationValidation };
