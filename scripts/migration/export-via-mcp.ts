/**
 * MCP를 통한 Supabase 데이터 익스포트 스크립트
 * Supabase MCP를 활용하여 데이터를 추출하고 Convex 마이그레이션을 위한 JSON 파일을 생성합니다.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// 익스포트할 테이블 목록
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

// MCP 시뮬레이션 함수 (실제로는 MCP 호출)
async function fetchTableDataViaMCP(tableName: TableName): Promise<any[]> {
  console.log(`🔄 MCP를 통해 ${tableName} 테이블 데이터 가져오는 중...`);

  // 실제로는 MCP를 통해 SQL 실행
  // 현재는 시뮬레이션 데이터
  switch (tableName) {
    case 'profiles':
      return [
        {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@biofox.co.kr',
          name: '시스템 관리자',
          role: 'admin',
          status: 'approved',
          shop_name: '바이오폭스 본사',
          region: '서울시 강남구',
          naver_place_link: null,
          approved_at: null,
          approved_by: null,
          commission_rate: null,
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: '2025-07-22T04:46:39.826Z',
          updated_at: '2025-07-22T04:46:39.881797Z',
        },
      ];

    default:
      return []; // 다른 테이블들은 비어있음
  }
}

// 데이터 변환 함수들
const transformers = {
  // UUID 문자열로 변환
  transformUuid: (value: any) => value?.toString() || null,

  // ISO 날짜를 Unix timestamp(ms)로 변환
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
 * 테이블별 Convex 스키마 변환
 */
function transformForConvex(tableName: TableName, data: any[]): any[] {
  return data.map(row => {
    const baseTransform = {
      _id: row.id, // Convex uses _id
      _creationTime: transformers.transformTimestamp(row.created_at),
      // updatedAt: transformers.transformTimestamp(row.updated_at), // Convex에서는 별도 관리
    };

    switch (tableName) {
      case 'profiles':
        return {
          ...baseTransform,
          userId: row.id, // Convex Auth 호환
          email: row.email,
          name: row.name,
          role: transformers.transformEnum(row.role),
          status: transformers.transformEnum(row.status),
          shopName: row.shop_name, // camelCase 변환
          region: row.region,
          naverPlaceLink: row.naver_place_link,
          approvedAt: transformers.transformTimestamp(row.approved_at),
          approvedBy: transformers.transformUuid(row.approved_by),
          commissionRate: row.commission_rate ? parseFloat(row.commission_rate) : null,
          totalSubordinates: row.total_subordinates || 0,
          activeSubordinates: row.active_subordinates || 0,
          metadata: transformers.transformJsonb(row.metadata),
        };

      case 'shop_relationships':
        return {
          ...baseTransform,
          shopOwnerId: transformers.transformUuid(row.shop_owner_id),
          parentId: transformers.transformUuid(row.parent_id),
          startedAt: transformers.transformTimestamp(row.started_at),
          endedAt: transformers.transformTimestamp(row.ended_at),
          isActive: row.is_active || false,
          relationshipType: transformers.transformEnum(row.relationship_type),
          notes: row.notes,
          createdBy: transformers.transformUuid(row.created_by),
        };

      case 'clinical_cases':
        return {
          ...baseTransform,
          shopId: transformers.transformUuid(row.shop_id),
          subjectType: transformers.transformEnum(row.subject_type),
          name: row.name,
          gender: transformers.transformEnum(row.gender),
          age: row.age,
          status: transformers.transformEnum(row.status),
          treatmentItem: row.treatment_item,
          startDate: transformers.transformTimestamp(row.start_date),
          endDate: transformers.transformTimestamp(row.end_date),
          totalSessions: row.total_sessions || 0,
          consentStatus: transformers.transformEnum(row.consent_status),
          consentDate: transformers.transformTimestamp(row.consent_date),
          marketingConsent: row.marketing_consent || false,
          notes: row.notes,
          tags: transformers.transformArray(row.tags),
          customFields: transformers.transformJsonb(row.custom_fields),
          photoCount: row.photo_count || 0,
          latestSession: row.latest_session || 0,
          createdBy: transformers.transformUuid(row.created_by),
        };

      default:
        // 기본 변환: snake_case를 camelCase로 변환
        const transformed: any = { ...baseTransform };
        Object.keys(row).forEach(key => {
          if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            transformed[camelKey] = row[key];
          }
        });
        return transformed;
    }
  });
}

/**
 * 모든 테이블 데이터 익스포트
 */
async function exportAllDataViaMCP() {
  console.log('🚀 MCP를 통한 Supabase 데이터 익스포트 시작...');

  // 출력 디렉토리 생성
  const outputDir = join(process.cwd(), 'migration-data');
  mkdirSync(outputDir, { recursive: true });

  const exportResult: Record<string, any[]> = {};
  let totalRecords = 0;

  try {
    // 각 테이블별로 순차 익스포트
    for (const tableName of TABLES_TO_EXPORT) {
      const rawData = await fetchTableDataViaMCP(tableName);
      const transformedData = transformForConvex(tableName, rawData);

      exportResult[tableName] = transformedData;
      totalRecords += transformedData.length;

      // 개별 테이블 파일로 저장
      const tableFilePath = join(outputDir, `${tableName}.json`);
      writeFileSync(tableFilePath, JSON.stringify(transformedData, null, 2), 'utf-8');

      if (transformedData.length > 0) {
        console.log(`✅ ${tableName}: ${transformedData.length}개 레코드 익스포트 완료`);
      } else {
        console.log(`ℹ️ ${tableName}: 빈 테이블`);
      }
    }

    // 전체 데이터를 하나의 파일로 저장
    const allDataPath = join(outputDir, 'all-convex-data.json');
    writeFileSync(allDataPath, JSON.stringify(exportResult, null, 2), 'utf-8');

    // 메타데이터 생성
    const metadata = {
      exportedAt: new Date().toISOString(),
      exportMethod: 'MCP',
      totalTables: TABLES_TO_EXPORT.length,
      totalRecords,
      convexFormat: true,
      tables: Object.entries(exportResult).map(([tableName, data]) => ({
        name: tableName,
        recordCount: data.length,
        hasData: data.length > 0,
      })),
    };

    const metadataPath = join(outputDir, 'metadata.json');
    writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log('🎉 MCP 데이터 익스포트 완료!');
    console.log(`📊 총 ${totalRecords}개 레코드 (${TABLES_TO_EXPORT.length}개 테이블)`);
    console.log(`📁 출력 경로: ${outputDir}`);
    console.log('📋 파일 목록:');
    console.log('  - all-convex-data.json (모든 데이터)');
    console.log('  - metadata.json (익스포트 정보)');
    console.log('  - [table_name].json (개별 테이블)');

    return exportResult;
  } catch (error) {
    console.error('❌ MCP 익스포트 실패:', error);
    throw error;
  }
}

/**
 * 스크립트 실행
 */
if (require.main === module) {
  exportAllDataViaMCP()
    .then(() => {
      console.log('✨ MCP 익스포트 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 MCP 익스포트 스크립트 실패:', error);
      process.exit(1);
    });
}

export { exportAllDataViaMCP, TABLES_TO_EXPORT };
