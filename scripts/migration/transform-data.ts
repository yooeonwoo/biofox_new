/**
 * 데이터 변환 및 정규화 스크립트
 * PostgreSQL에서 추출한 데이터를 Convex 스키마에 정확히 맞게 변환합니다.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// 데이터 변환 유틸리티 함수들
class DataTransformer {
  /**
   * UUID 문자열 유효성 검사 및 변환
   */
  static transformUuid(value: any): string | null {
    if (!value) return null;
    const uuidString = value.toString();
    // UUID 형식 검증 (간단한 정규식)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuidString) ? uuidString : null;
  }

  /**
   * 타임스탬프 변환 (PostgreSQL → Convex)
   */
  static transformTimestamp(value: any): number | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.getTime();
  }

  /**
   * ENUM 값 검증 및 변환
   */
  static transformEnum<T extends string>(value: any, allowedValues: T[]): T | null {
    if (!value) return null;
    const stringValue = value.toString();
    return allowedValues.includes(stringValue as T) ? (stringValue as T) : null;
  }

  /**
   * 배열 데이터 변환
   */
  static transformArray(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        // PostgreSQL 배열 문자열 파싱 시도 (예: {a,b,c})
        if (value.startsWith('{') && value.endsWith('}')) {
          return value
            .slice(1, -1)
            .split(',')
            .map((s: string) => s.trim());
        }
        return [];
      }
    }
    return [];
  }

  /**
   * JSONB 데이터 변환
   */
  static transformJsonb(value: any): any {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * 숫자 변환 (null safe)
   */
  static transformNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * 불린 변환 (null safe)
   */
  static transformBoolean(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  }
}

/**
 * 테이블별 스키마 변환 규칙
 */
class SchemaTransformer {
  /**
   * profiles 테이블 변환 (Convex 스키마 정확 매핑)
   */
  static transformProfiles(data: any[]): any[] {
    return data
      .map(row => {
        // 이미 변환된 데이터인지 확인 (camelCase 필드가 있으면 변환된 것)
        const isAlreadyTransformed = row.hasOwnProperty('shopName') || row.hasOwnProperty('_id');

        const transformed = {
          _id: DataTransformer.transformUuid(row._id || row.id),
          userId: DataTransformer.transformUuid(row.userId || row.id || row._id), // Convex Auth 호환
          email: row.email || '',
          name: row.name || '',
          role: DataTransformer.transformEnum(row.role, ['admin', 'kol', 'ol', 'shop_owner']),
          status: DataTransformer.transformEnum(row.status, ['pending', 'approved', 'rejected']),
          shop_name: isAlreadyTransformed ? row.shopName : row.shop_name || '', // 스키마에서 snake_case 유지
          region: row.region || undefined,
          naver_place_link: isAlreadyTransformed
            ? row.naverPlaceLink
            : row.naver_place_link || undefined,
          approved_at: DataTransformer.transformTimestamp(
            isAlreadyTransformed ? row.approvedAt : row.approved_at
          ),
          approved_by: DataTransformer.transformUuid(
            isAlreadyTransformed ? row.approvedBy : row.approved_by
          ),
          commission_rate: DataTransformer.transformNumber(
            isAlreadyTransformed ? row.commissionRate : row.commission_rate
          ),
          total_subordinates:
            DataTransformer.transformNumber(
              isAlreadyTransformed ? row.totalSubordinates : row.total_subordinates
            ) || 0,
          active_subordinates:
            DataTransformer.transformNumber(
              isAlreadyTransformed ? row.activeSubordinates : row.active_subordinates
            ) || 0,
          metadata: DataTransformer.transformJsonb(row.metadata),
          created_at:
            DataTransformer.transformTimestamp(row._creationTime || row.created_at) || Date.now(),
          updated_at: DataTransformer.transformTimestamp(row.updated_at) || Date.now(),
        };

        // 필수 필드 검증
        if (!transformed.email || !transformed.name || !transformed.role || !transformed.status) {
          console.warn(`⚠️ profiles 레코드 필수 필드 누락:`, row.id || row._id, {
            email: transformed.email,
            name: transformed.name,
            role: transformed.role,
            status: transformed.status,
          });
        }

        return transformed;
      })
      .filter(item => item._id && item.email && item.name && item.role && item.status); // 유효한 레코드만 반환
  }

  /**
   * shop_relationships 테이블 변환
   */
  static transformShopRelationships(data: any[]): any[] {
    return data
      .map(row => ({
        _id: DataTransformer.transformUuid(row.id),
        shop_owner_id: DataTransformer.transformUuid(row.shop_owner_id),
        parent_id: DataTransformer.transformUuid(row.parent_id),
        started_at: DataTransformer.transformTimestamp(row.started_at) || Date.now(),
        ended_at: DataTransformer.transformTimestamp(row.ended_at),
        is_active: DataTransformer.transformBoolean(row.is_active),
        relationship_type: DataTransformer.transformEnum(row.relationship_type, [
          'direct',
          'transferred',
          'temporary',
        ]),
        notes: row.notes || undefined,
        created_at: DataTransformer.transformTimestamp(row.created_at) || Date.now(),
        updated_at: DataTransformer.transformTimestamp(row.updated_at) || Date.now(),
        created_by: DataTransformer.transformUuid(row.created_by),
      }))
      .filter(item => item._id && item.shop_owner_id);
  }

  /**
   * products 테이블 변환
   */
  static transformProducts(data: any[]): any[] {
    return data
      .map(row => ({
        _id: DataTransformer.transformUuid(row.id),
        name: row.name || '',
        code: row.code || undefined,
        category: DataTransformer.transformEnum(row.category, [
          'skincare',
          'device',
          'supplement',
          'cosmetic',
          'accessory',
        ]),
        price: DataTransformer.transformNumber(row.price) || 0,
        is_active: DataTransformer.transformBoolean(row.is_active),
        is_featured: DataTransformer.transformBoolean(row.is_featured),
        sort_order: DataTransformer.transformNumber(row.sort_order),
        description: row.description || undefined,
        specifications: DataTransformer.transformJsonb(row.specifications),
        images: DataTransformer.transformArray(row.images),
        default_commission_rate: DataTransformer.transformNumber(row.default_commission_rate),
        min_commission_rate: DataTransformer.transformNumber(row.min_commission_rate),
        max_commission_rate: DataTransformer.transformNumber(row.max_commission_rate),
        created_at: DataTransformer.transformTimestamp(row.created_at) || Date.now(),
        updated_at: DataTransformer.transformTimestamp(row.updated_at) || Date.now(),
        created_by: DataTransformer.transformUuid(row.created_by),
      }))
      .filter(item => item._id && item.name);
  }

  /**
   * orders 테이블 변환
   */
  static transformOrders(data: any[]): any[] {
    return data
      .map(row => ({
        _id: DataTransformer.transformUuid(row.id),
        shop_id: DataTransformer.transformUuid(row.shop_id),
        order_date: DataTransformer.transformTimestamp(row.order_date) || Date.now(),
        order_number: row.order_number || undefined,
        total_amount: DataTransformer.transformNumber(row.total_amount) || 0,
        commission_rate: DataTransformer.transformNumber(row.commission_rate),
        commission_amount: DataTransformer.transformNumber(row.commission_amount),
        commission_status: DataTransformer.transformEnum(row.commission_status, [
          'calculated',
          'adjusted',
          'paid',
          'cancelled',
        ]),
        order_status: DataTransformer.transformEnum(row.order_status, [
          'pending',
          'completed',
          'cancelled',
          'refunded',
        ]),
        is_self_shop_order: DataTransformer.transformBoolean(row.is_self_shop_order),
        notes: row.notes || undefined,
        metadata: DataTransformer.transformJsonb(row.metadata),
        created_at: DataTransformer.transformTimestamp(row.created_at) || Date.now(),
        updated_at: DataTransformer.transformTimestamp(row.updated_at) || Date.now(),
        created_by: DataTransformer.transformUuid(row.created_by),
      }))
      .filter(item => item._id && item.shop_id && item.created_by);
  }

  /**
   * clinical_cases 테이블 변환
   */
  static transformClinicalCases(data: any[]): any[] {
    return data
      .map(row => ({
        _id: DataTransformer.transformUuid(row.id),
        shop_id: DataTransformer.transformUuid(row.shop_id),
        subject_type: DataTransformer.transformEnum(row.subject_type, ['self', 'customer']),
        name: row.name || '',
        gender: DataTransformer.transformEnum(row.gender, ['male', 'female', 'other']),
        age: DataTransformer.transformNumber(row.age),
        status: DataTransformer.transformEnum(row.status, [
          'in_progress',
          'completed',
          'paused',
          'cancelled',
        ]),
        treatment_item: row.treatment_item || undefined,
        start_date: DataTransformer.transformTimestamp(row.start_date),
        end_date: DataTransformer.transformTimestamp(row.end_date),
        total_sessions: DataTransformer.transformNumber(row.total_sessions),
        consent_status: DataTransformer.transformEnum(row.consent_status, [
          'no_consent',
          'consented',
          'pending',
        ]),
        consent_date: DataTransformer.transformTimestamp(row.consent_date),
        marketing_consent: DataTransformer.transformBoolean(row.marketing_consent),
        notes: row.notes || undefined,
        tags: DataTransformer.transformArray(row.tags),
        custom_fields: DataTransformer.transformJsonb(row.custom_fields),
        photo_count: DataTransformer.transformNumber(row.photo_count) || 0,
        latest_session: DataTransformer.transformNumber(row.latest_session) || 0,
        created_at: DataTransformer.transformTimestamp(row.created_at) || Date.now(),
        updated_at: DataTransformer.transformTimestamp(row.updated_at) || Date.now(),
        created_by: DataTransformer.transformUuid(row.created_by),
      }))
      .filter(
        item =>
          item._id &&
          item.shop_id &&
          item.subject_type &&
          item.name &&
          item.status &&
          item.consent_status
      );
  }

  /**
   * notifications 테이블 변환
   */
  static transformNotifications(data: any[]): any[] {
    return data
      .map(row => ({
        _id: DataTransformer.transformUuid(row.id),
        user_id: DataTransformer.transformUuid(row.user_id),
        type: DataTransformer.transformEnum(row.type, [
          'system',
          'crm_update',
          'order_created',
          'commission_paid',
          'clinical_progress',
          'approval_required',
          'status_changed',
          'reminder',
        ]),
        title: row.title || '',
        message: row.message || '',
        related_type: row.related_type || undefined,
        related_id: row.related_id || undefined,
        action_url: row.action_url || undefined,
        is_read: DataTransformer.transformBoolean(row.is_read),
        read_at: DataTransformer.transformTimestamp(row.read_at),
        is_archived: DataTransformer.transformBoolean(row.is_archived),
        archived_at: DataTransformer.transformTimestamp(row.archived_at),
        priority: DataTransformer.transformEnum(row.priority, ['low', 'normal', 'high', 'urgent']),
        metadata: DataTransformer.transformJsonb(row.metadata),
        created_at: DataTransformer.transformTimestamp(row.created_at) || Date.now(),
        expires_at: DataTransformer.transformTimestamp(row.expires_at),
      }))
      .filter(item => item._id && item.user_id && item.type && item.title && item.message);
  }
}

/**
 * 데이터 변환 및 검증
 */
async function transformMigrationData(inputDir: string = 'migration-data'): Promise<void> {
  console.log('🔄 데이터 변환 및 정규화 시작...');

  const inputPath = join(process.cwd(), inputDir);
  const outputPath = join(process.cwd(), `${inputDir}-transformed`);

  if (!existsSync(inputPath)) {
    throw new Error(`입력 디렉토리를 찾을 수 없습니다: ${inputPath}`);
  }

  // 출력 디렉토리 생성
  if (!existsSync(outputPath)) {
    require('fs').mkdirSync(outputPath, { recursive: true });
  }

  const transformationResults: Record<
    string,
    { original: number; transformed: number; errors: string[] }
  > = {};

  // 테이블별 변환 실행
  const transformations = [
    { table: 'profiles', transformer: SchemaTransformer.transformProfiles },
    { table: 'shop_relationships', transformer: SchemaTransformer.transformShopRelationships },
    { table: 'products', transformer: SchemaTransformer.transformProducts },
    { table: 'orders', transformer: SchemaTransformer.transformOrders },
    { table: 'clinical_cases', transformer: SchemaTransformer.transformClinicalCases },
    { table: 'notifications', transformer: SchemaTransformer.transformNotifications },
  ];

  for (const { table, transformer } of transformations) {
    const filePath = join(inputPath, `${table}.json`);

    if (!existsSync(filePath)) {
      console.log(`ℹ️ ${table}.json 파일이 없습니다. 건너뜁니다.`);
      continue;
    }

    try {
      const rawData = JSON.parse(readFileSync(filePath, 'utf-8'));
      const originalCount = rawData.length;

      console.log(`🔄 ${table} 변환 중... (${originalCount}개 레코드)`);

      const transformedData = transformer(rawData);
      const transformedCount = transformedData.length;

      // 변환된 데이터 저장
      const outputFilePath = join(outputPath, `${table}.json`);
      writeFileSync(outputFilePath, JSON.stringify(transformedData, null, 2), 'utf-8');

      transformationResults[table] = {
        original: originalCount,
        transformed: transformedCount,
        errors:
          originalCount !== transformedCount
            ? [`${originalCount - transformedCount}개 레코드 필터링됨`]
            : [],
      };

      if (transformedCount > 0) {
        console.log(`✅ ${table}: ${transformedCount}개 레코드 변환 완료`);
      } else {
        console.log(`ℹ️ ${table}: 변환된 유효 레코드 없음`);
      }
    } catch (error) {
      console.error(`❌ ${table} 변환 실패:`, error);
      transformationResults[table] = {
        original: 0,
        transformed: 0,
        errors: [`변환 실패: ${error}`],
      };
    }
  }

  // 변환 결과 메타데이터 생성
  const metadata = {
    transformedAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    convexCompatible: true,
    totalOriginalRecords: Object.values(transformationResults).reduce(
      (sum, result) => sum + result.original,
      0
    ),
    totalTransformedRecords: Object.values(transformationResults).reduce(
      (sum, result) => sum + result.transformed,
      0
    ),
    transformationResults,
    validation: {
      allTablesProcessed: transformations.every(({ table }) => table in transformationResults),
      noErrors: Object.values(transformationResults).every(result => result.errors.length === 0),
    },
  };

  const metadataPath = join(outputPath, 'transformation-metadata.json');
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  console.log('🎉 데이터 변환 완료!');
  console.log(
    `📊 총 ${metadata.totalTransformedRecords}개 레코드 변환 (원본: ${metadata.totalOriginalRecords}개)`
  );
  console.log(`📁 출력 경로: ${outputPath}`);
  console.log('📋 변환 결과:');

  Object.entries(transformationResults).forEach(([table, result]) => {
    const status = result.errors.length > 0 ? '⚠️' : '✅';
    console.log(`  ${status} ${table}: ${result.transformed}/${result.original}`);
    if (result.errors.length > 0) {
      result.errors.forEach(error => console.log(`    - ${error}`));
    }
  });
}

/**
 * 스크립트 실행
 */
if (require.main === module) {
  const inputDir = process.argv[2] || 'migration-data';

  transformMigrationData(inputDir)
    .then(() => {
      console.log('✨ 데이터 변환 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 데이터 변환 스크립트 실패:', error);
      process.exit(1);
    });
}

export { transformMigrationData, DataTransformer, SchemaTransformer };
