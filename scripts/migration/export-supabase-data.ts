/**
 * Supabase 데이터 익스포트 스크립트
 * PostgreSQL 데이터베이스에서 Convex로 마이그레이션할 데이터를 추출합니다.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Supabase 연결 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 익스포트할 테이블 목록 정의
const TABLES_TO_EXPORT = [
  'profiles',
  'shop_relationships',
  'products',
  'orders',
  'order_items',
  'device_sales',
  'crm_cards',
  'self_growth_cards',
  'clinical_cases',
  'clinical_photos',
  'consent_files',
  'notifications',
  'audit_logs',
  'commission_calculations',
  'kol_device_accumulator',
  'file_metadata',
] as const;

type TableName = (typeof TABLES_TO_EXPORT)[number];

// 데이터 변환 함수들
const transformers = {
  // UUID 문자열로 변환
  transformUuid: (value: any) => value?.toString() || null,

  // PostgreSQL timestamp를 Unix timestamp(ms)로 변환
  transformTimestamp: (value: any) => {
    if (!value) return null;
    return new Date(value).getTime();
  },

  // PostgreSQL ENUM을 문자열로 변환
  transformEnum: (value: any) => value?.toString() || null,

  // PostgreSQL 배열 처리
  transformArray: (value: any) => {
    if (!value) return null;
    return Array.isArray(value) ? value : [];
  },

  // JSONB 처리
  transformJsonb: (value: any) => {
    if (!value) return {};
    return typeof value === 'object' ? value : JSON.parse(value);
  },
};

/**
 * 테이블별 데이터 변환 로직
 */
const getTableTransformer = (tableName: TableName) => {
  const commonTransforms = (row: any) => ({
    ...row,
    id: transformers.transformUuid(row.id),
    created_at: transformers.transformTimestamp(row.created_at),
    updated_at: transformers.transformTimestamp(row.updated_at),
  });

  switch (tableName) {
    case 'profiles':
      return (row: any) => ({
        ...commonTransforms(row),
        userId: transformers.transformUuid(row.id), // Convex Auth 호환
        email: row.email,
        name: row.name,
        role: transformers.transformEnum(row.role),
        status: transformers.transformEnum(row.status),
        shop_name: row.shop_name,
        region: row.region,
        naver_place_link: row.naver_place_link,
        approved_at: transformers.transformTimestamp(row.approved_at),
        approved_by: transformers.transformUuid(row.approved_by),
        commission_rate: row.commission_rate ? parseFloat(row.commission_rate) : null,
        total_subordinates: row.total_subordinates || 0,
        active_subordinates: row.active_subordinates || 0,
        metadata: transformers.transformJsonb(row.metadata),
      });

    case 'shop_relationships':
      return (row: any) => ({
        ...commonTransforms(row),
        shop_owner_id: transformers.transformUuid(row.shop_owner_id),
        parent_id: transformers.transformUuid(row.parent_id),
        started_at: transformers.transformTimestamp(row.started_at),
        ended_at: transformers.transformTimestamp(row.ended_at),
        is_active: row.is_active || false,
        relationship_type: transformers.transformEnum(row.relationship_type),
        notes: row.notes,
        created_by: transformers.transformUuid(row.created_by),
      });

    case 'products':
      return (row: any) => ({
        ...commonTransforms(row),
        name: row.name,
        code: row.code,
        category: transformers.transformEnum(row.category),
        price: parseFloat(row.price),
        is_active: row.is_active || true,
        is_featured: row.is_featured || false,
        sort_order: row.sort_order || 0,
        description: row.description,
        specifications: transformers.transformJsonb(row.specifications),
        images: transformers.transformArray(row.images),
        default_commission_rate: row.default_commission_rate
          ? parseFloat(row.default_commission_rate)
          : null,
        min_commission_rate: row.min_commission_rate ? parseFloat(row.min_commission_rate) : null,
        max_commission_rate: row.max_commission_rate ? parseFloat(row.max_commission_rate) : null,
        created_by: transformers.transformUuid(row.created_by),
      });

    case 'orders':
      return (row: any) => ({
        ...commonTransforms(row),
        shop_id: transformers.transformUuid(row.shop_id),
        order_date: transformers.transformTimestamp(row.order_date),
        order_number: row.order_number,
        total_amount: parseFloat(row.total_amount),
        commission_rate: row.commission_rate ? parseFloat(row.commission_rate) : null,
        commission_amount: row.commission_amount ? parseFloat(row.commission_amount) : null,
        commission_status: transformers.transformEnum(row.commission_status),
        order_status: transformers.transformEnum(row.order_status),
        is_self_shop_order: row.is_self_shop_order || false,
        notes: row.notes,
        metadata: transformers.transformJsonb(row.metadata),
        created_by: transformers.transformUuid(row.created_by),
      });

    case 'clinical_cases':
      return (row: any) => ({
        ...commonTransforms(row),
        shop_id: transformers.transformUuid(row.shop_id),
        subject_type: transformers.transformEnum(row.subject_type),
        name: row.name,
        gender: transformers.transformEnum(row.gender),
        age: row.age,
        status: transformers.transformEnum(row.status),
        treatment_item: row.treatment_item,
        start_date: transformers.transformTimestamp(row.start_date),
        end_date: transformers.transformTimestamp(row.end_date),
        total_sessions: row.total_sessions || 0,
        consent_status: transformers.transformEnum(row.consent_status),
        consent_date: transformers.transformTimestamp(row.consent_date),
        marketing_consent: row.marketing_consent || false,
        notes: row.notes,
        tags: transformers.transformArray(row.tags),
        custom_fields: transformers.transformJsonb(row.custom_fields),
        photo_count: row.photo_count || 0,
        latest_session: row.latest_session || 0,
        created_by: transformers.transformUuid(row.created_by),
      });

    default:
      // 기본 변환 로직
      return commonTransforms;
  }
};

/**
 * 특정 테이블 데이터 익스포트
 */
async function exportTable(tableName: TableName): Promise<any[]> {
  console.log(`🔄 ${tableName} 테이블 익스포트 중...`);

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`❌ ${tableName} 익스포트 실패:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`ℹ️ ${tableName} 테이블이 비어있습니다.`);
      return [];
    }

    // 데이터 변환 적용
    const transformer = getTableTransformer(tableName);
    const transformedData = data.map(transformer);

    console.log(`✅ ${tableName} 익스포트 완료: ${transformedData.length}개 레코드`);
    return transformedData;
  } catch (error) {
    console.error(`❌ ${tableName} 익스포트 오류:`, error);
    throw error;
  }
}

/**
 * 모든 테이블 데이터 익스포트
 */
async function exportAllData() {
  console.log('🚀 Supabase 데이터 익스포트 시작...');

  // 출력 디렉토리 생성
  const outputDir = join(process.cwd(), 'migration-data');
  mkdirSync(outputDir, { recursive: true });

  const exportResult: Record<string, any[]> = {};
  let totalRecords = 0;

  try {
    // 각 테이블별로 순차 익스포트
    for (const tableName of TABLES_TO_EXPORT) {
      const tableData = await exportTable(tableName);
      exportResult[tableName] = tableData;
      totalRecords += tableData.length;

      // 개별 테이블 파일로 저장
      const tableFilePath = join(outputDir, `${tableName}.json`);
      writeFileSync(tableFilePath, JSON.stringify(tableData, null, 2), 'utf-8');
      console.log(`💾 ${tableName}.json 파일 저장 완료`);
    }

    // 전체 데이터를 하나의 파일로 저장
    const allDataPath = join(outputDir, 'all-data.json');
    writeFileSync(allDataPath, JSON.stringify(exportResult, null, 2), 'utf-8');

    // 메타데이터 생성
    const metadata = {
      exportedAt: new Date().toISOString(),
      totalTables: TABLES_TO_EXPORT.length,
      totalRecords,
      tables: Object.entries(exportResult).map(([tableName, data]) => ({
        name: tableName,
        recordCount: data.length,
      })),
    };

    const metadataPath = join(outputDir, 'metadata.json');
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log('🎉 모든 데이터 익스포트 완료!');
    console.log(`📊 총 ${totalRecords}개 레코드 (${TABLES_TO_EXPORT.length}개 테이블)`);
    console.log(`📁 출력 경로: ${outputDir}`);

    return exportResult;
  } catch (error) {
    console.error('❌ 익스포트 실패:', error);
    throw error;
  }
}

/**
 * 스크립트 실행
 */
if (require.main === module) {
  exportAllData()
    .then(() => {
      console.log('✨ 익스포트 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 익스포트 스크립트 실패:', error);
      process.exit(1);
    });
}

export { exportAllData, exportTable, TABLES_TO_EXPORT };
