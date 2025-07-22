/**
 * Convex 데이터 임포트 스크립트
 * 변환된 데이터를 Convex 데이터베이스로 임포트합니다.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Convex 클라이언트 타입 (실제 환경에서는 import 사용)
interface ConvexClient {
  mutation: (name: string, args: any) => Promise<any>;
  action: (name: string, args: any) => Promise<any>;
  query: (name: string, args?: any) => Promise<any>;
}

// 임포트할 테이블 목록 (의존성 순서 고려)
const IMPORT_ORDER = [
  'profiles', // 기본 사용자 테이블 (다른 테이블의 참조 대상)
  'shop_relationships', // 매장 관계 (profiles 참조)
  'products', // 상품 정보
  'orders', // 주문 (profiles 참조)
  'order_items', // 주문 항목 (orders, products 참조)
  'device_sales', // 디바이스 판매 (profiles 참조)
  'clinical_cases', // 임상 케이스 (profiles 참조)
  'clinical_photos', // 임상 사진 (clinical_cases 참조)
  'consent_files', // 동의서 (clinical_cases 참조)
  'crm_cards', // CRM 카드 (profiles 참조)
  'self_growth_cards', // 자기계발 카드 (profiles 참조)
  'notifications', // 알림 (profiles 참조)
  'commission_calculations', // 수수료 계산 (profiles 참조)
  'audit_logs', // 감사 로그
  'file_metadata', // 파일 메타데이터
] as const;

type TableName = (typeof IMPORT_ORDER)[number];

/**
 * 임포트 진행 상황 추적
 */
interface ImportProgress {
  tableName: string;
  totalRecords: number;
  importedRecords: number;
  errors: string[];
  startTime: number;
  endTime?: number;
}

/**
 * 배치 임포트 관리자
 */
class BatchImporter {
  private batchSize: number = 50; // 한 번에 처리할 레코드 수
  private maxRetries: number = 3; // 최대 재시도 횟수
  private retryDelay: number = 1000; // 재시도 지연 시간 (ms)

  constructor(
    private convexClient: ConvexClient,
    private dryRun: boolean = false
  ) {}

  /**
   * 단일 레코드 임포트 (재시도 포함)
   */
  private async importRecord(
    tableName: string,
    record: any,
    retryCount: number = 0
  ): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      if (this.dryRun) {
        console.log(`[DRY RUN] ${tableName} 레코드 임포트:`, record._id);
        return { success: true, id: record._id };
      }

      // Convex mutation 실행
      const result = await this.convexClient.mutation('migration:importRecord', {
        tableName,
        record,
      });

      return { success: true, id: result };
    } catch (error: any) {
      const errorMessage = error.message || error.toString();

      if (retryCount < this.maxRetries) {
        console.warn(
          `⚠️ ${tableName} 레코드 임포트 실패 (재시도 ${retryCount + 1}/${this.maxRetries}):`,
          errorMessage
        );
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.importRecord(tableName, record, retryCount + 1);
      }

      console.error(`❌ ${tableName} 레코드 임포트 최종 실패:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 테이블별 배치 임포트
   */
  async importTable(tableName: string, records: any[]): Promise<ImportProgress> {
    const progress: ImportProgress = {
      tableName,
      totalRecords: records.length,
      importedRecords: 0,
      errors: [],
      startTime: Date.now(),
    };

    if (records.length === 0) {
      console.log(`ℹ️ ${tableName}: 임포트할 레코드가 없습니다.`);
      progress.endTime = Date.now();
      return progress;
    }

    console.log(`🚀 ${tableName} 임포트 시작: ${records.length}개 레코드`);

    // 배치별로 처리
    for (let i = 0; i < records.length; i += this.batchSize) {
      const batch = records.slice(i, i + this.batchSize);
      const batchNumber = Math.floor(i / this.batchSize) + 1;
      const totalBatches = Math.ceil(records.length / this.batchSize);

      console.log(`  📦 배치 ${batchNumber}/${totalBatches} 처리 중... (${batch.length}개 레코드)`);

      // 배치 내 모든 레코드를 병렬로 처리
      const batchPromises = batch.map(record => this.importRecord(tableName, record));
      const batchResults = await Promise.all(batchPromises);

      // 결과 집계
      for (const result of batchResults) {
        if (result.success) {
          progress.importedRecords++;
        } else {
          progress.errors.push(result.error || 'Unknown error');
        }
      }

      // 진행률 표시
      const progressPercent = (
        ((progress.importedRecords + progress.errors.length) / records.length) *
        100
      ).toFixed(1);
      console.log(
        `  📊 진행률: ${progressPercent}% (성공: ${progress.importedRecords}, 실패: ${progress.errors.length})`
      );

      // 배치 간 짧은 대기 (API 부하 조절)
      if (i + this.batchSize < records.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    progress.endTime = Date.now();
    const duration = ((progress.endTime - progress.startTime) / 1000).toFixed(2);

    if (progress.errors.length === 0) {
      console.log(
        `✅ ${tableName} 임포트 완료: ${progress.importedRecords}개 레코드 (${duration}초)`
      );
    } else {
      console.log(
        `⚠️ ${tableName} 임포트 부분 완료: ${progress.importedRecords}/${progress.totalRecords}개 성공, ${progress.errors.length}개 실패 (${duration}초)`
      );
    }

    return progress;
  }
}

/**
 * 데이터 검증 및 전처리
 */
class DataValidator {
  /**
   * 레코드 유효성 검사
   */
  static validateRecord(tableName: string, record: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 공통 필수 필드 검사
    if (!record._id) {
      errors.push('_id 필드가 누락되었습니다.');
    }

    // 테이블별 유효성 검사
    switch (tableName) {
      case 'profiles':
        if (!record.email) errors.push('email 필드가 필요합니다.');
        if (!record.name) errors.push('name 필드가 필요합니다.');
        if (!record.role) errors.push('role 필드가 필요합니다.');
        if (!record.status) errors.push('status 필드가 필요합니다.');
        if (!record.shop_name) errors.push('shop_name 필드가 필요합니다.');
        break;

      case 'orders':
        if (!record.shop_id) errors.push('shop_id 필드가 필요합니다.');
        if (!record.created_by) errors.push('created_by 필드가 필요합니다.');
        if (typeof record.total_amount !== 'number') errors.push('total_amount는 숫자여야 합니다.');
        break;

      case 'clinical_cases':
        if (!record.shop_id) errors.push('shop_id 필드가 필요합니다.');
        if (!record.subject_type) errors.push('subject_type 필드가 필요합니다.');
        if (!record.name) errors.push('name 필드가 필요합니다.');
        if (!record.status) errors.push('status 필드가 필요합니다.');
        if (!record.consent_status) errors.push('consent_status 필드가 필요합니다.');
        break;

      case 'notifications':
        if (!record.user_id) errors.push('user_id 필드가 필요합니다.');
        if (!record.type) errors.push('type 필드가 필요합니다.');
        if (!record.title) errors.push('title 필드가 필요합니다.');
        if (!record.message) errors.push('message 필드가 필요합니다.');
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 데이터 전처리
   */
  static preprocessRecord(tableName: string, record: any): any {
    const processed = { ...record };

    // Convex에서 _id 필드는 시스템에서 관리하므로 제거
    // 대신 originalId로 저장하여 참조 관계 유지
    if (processed._id) {
      processed.originalId = processed._id;
      delete processed._id;
    }

    // undefined 값을 null로 변경 (Convex 호환성)
    Object.keys(processed).forEach(key => {
      if (processed[key] === undefined) {
        processed[key] = null;
      }
    });

    return processed;
  }
}

/**
 * Convex 임포트 메인 함수
 */
async function importToConvex(
  inputDir: string = 'migration-data-transformed',
  options: {
    dryRun?: boolean;
    skipValidation?: boolean;
    tablesToImport?: string[];
  } = {}
): Promise<void> {
  const { dryRun = false, skipValidation = false, tablesToImport } = options;

  console.log('🚀 Convex 데이터 임포트 시작...');
  if (dryRun) {
    console.log('🔍 DRY RUN 모드: 실제 데이터 변경 없이 테스트만 실행됩니다.');
  }

  const inputPath = join(process.cwd(), inputDir);

  if (!existsSync(inputPath)) {
    throw new Error(`입력 디렉토리를 찾을 수 없습니다: ${inputPath}`);
  }

  // Convex 클라이언트 초기화 (실제 환경에서는 ConvexClient 사용)
  const convexClient: ConvexClient = {
    mutation: async (name: string, args: any) => {
      // 실제 구현에서는 ConvexClient.mutation() 호출
      if (dryRun) {
        return `dry-run-id-${Date.now()}`;
      }
      throw new Error('Convex 클라이언트가 구현되지 않았습니다.');
    },
    action: async (name: string, args: any) => {
      throw new Error('Convex 클라이언트가 구현되지 않았습니다.');
    },
    query: async (name: string, args?: any) => {
      throw new Error('Convex 클라이언트가 구현되지 않았습니다.');
    },
  };

  const importer = new BatchImporter(convexClient, dryRun);
  const importResults: ImportProgress[] = [];
  let totalRecords = 0;
  let totalImported = 0;
  let totalErrors = 0;

  // 테이블별 순차 임포트 (의존성 순서 준수)
  const tablesToProcess = tablesToImport || IMPORT_ORDER;

  for (const tableName of tablesToProcess) {
    const tableFilePath = join(inputPath, `${tableName}.json`);

    if (!existsSync(tableFilePath)) {
      console.log(`ℹ️ ${tableName}.json 파일이 없습니다. 건너뜁니다.`);
      continue;
    }

    try {
      // 데이터 로드
      const rawData = JSON.parse(readFileSync(tableFilePath, 'utf-8'));

      if (!Array.isArray(rawData)) {
        console.error(`❌ ${tableName}: 배열 형태의 데이터가 아닙니다.`);
        continue;
      }

      // 데이터 검증 및 전처리
      const validRecords: any[] = [];
      const validationErrors: string[] = [];

      for (const record of rawData) {
        if (!skipValidation) {
          const validation = DataValidator.validateRecord(tableName, record);
          if (!validation.isValid) {
            validationErrors.push(
              `레코드 ${record._id || 'unknown'}: ${validation.errors.join(', ')}`
            );
            continue;
          }
        }

        const processedRecord = DataValidator.preprocessRecord(tableName, record);
        validRecords.push(processedRecord);
      }

      if (validationErrors.length > 0) {
        console.warn(`⚠️ ${tableName} 유효성 검사 실패: ${validationErrors.length}개 레코드`);
        validationErrors.slice(0, 5).forEach(error => console.warn(`  - ${error}`));
        if (validationErrors.length > 5) {
          console.warn(`  ... 및 ${validationErrors.length - 5}개 추가 오류`);
        }
      }

      // 테이블 임포트 실행
      const progress = await importer.importTable(tableName, validRecords);
      importResults.push(progress);

      totalRecords += progress.totalRecords;
      totalImported += progress.importedRecords;
      totalErrors += progress.errors.length;
    } catch (error) {
      console.error(`❌ ${tableName} 임포트 실패:`, error);
      importResults.push({
        tableName,
        totalRecords: 0,
        importedRecords: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        startTime: Date.now(),
        endTime: Date.now(),
      });
    }
  }

  // 최종 결과 요약
  console.log('\n🎉 Convex 임포트 완료!');
  console.log(
    `📊 전체 결과: ${totalImported}/${totalRecords}개 레코드 임포트 (${totalErrors}개 오류)`
  );
  console.log('\n📋 테이블별 결과:');

  importResults.forEach(result => {
    const duration = result.endTime
      ? ((result.endTime - result.startTime) / 1000).toFixed(2) + 's'
      : 'N/A';
    const status = result.errors.length === 0 ? '✅' : result.importedRecords > 0 ? '⚠️' : '❌';
    console.log(
      `  ${status} ${result.tableName}: ${result.importedRecords}/${result.totalRecords} (${duration})`
    );
  });

  if (totalErrors > 0) {
    console.log('\n⚠️ 일부 레코드 임포트에 실패했습니다. 로그를 확인하세요.');
  }
}

/**
 * 스크립트 실행
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipValidation = args.includes('--skip-validation');
  const inputDir =
    args.find(arg => arg.startsWith('--input='))?.split('=')[1] || 'migration-data-transformed';
  const tablesArg = args.find(arg => arg.startsWith('--tables='))?.split('=')[1];
  const tablesToImport = tablesArg ? tablesArg.split(',') : undefined;

  importToConvex(inputDir, { dryRun, skipValidation, tablesToImport })
    .then(() => {
      console.log('✨ 임포트 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 임포트 스크립트 실패:', error);
      process.exit(1);
    });
}

export { importToConvex, BatchImporter, DataValidator };
