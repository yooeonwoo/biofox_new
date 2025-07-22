import { mutation, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

/**
 * Supabase → Convex 데이터 마이그레이션 시스템
 *
 * 현재 상황: Supabase에 데이터가 거의 없음 (profiles에 1개)
 * 목적: 향후 확장을 위한 마이그레이션 기반 구조 제공
 */

/**
 * 데이터 마이그레이션을 위한 Convex 뮤테이션 함수들
 */

/**
 * 단일 레코드 임포트 뮤테이션
 */
export const importRecord = internalMutation({
  args: {
    tableName: v.string(),
    record: v.any(),
  },
  handler: async (ctx, args) => {
    const { tableName, record } = args;

    try {
      // 테이블별로 다른 처리 로직 적용
      switch (tableName) {
        case 'profiles':
          return await ctx.db.insert('profiles', {
            userId: record.userId,
            email: record.email,
            name: record.name,
            role: record.role,
            status: record.status,
            shop_name: record.shop_name,
            region: record.region || undefined,
            naver_place_link: record.naver_place_link || undefined,
            approved_at: record.approved_at || undefined,
            approved_by: record.approved_by || undefined,
            commission_rate: record.commission_rate || undefined,
            total_subordinates: record.total_subordinates || 0,
            active_subordinates: record.active_subordinates || 0,
            metadata: record.metadata || {},
            created_at: record.created_at,
            updated_at: record.updated_at,
          });

        case 'shop_relationships':
          return await ctx.db.insert('shop_relationships', {
            shop_owner_id: record.shop_owner_id,
            parent_id: record.parent_id || undefined,
            started_at: record.started_at,
            ended_at: record.ended_at || undefined,
            is_active: record.is_active,
            relationship_type: record.relationship_type || undefined,
            notes: record.notes || undefined,
            created_at: record.created_at,
            updated_at: record.updated_at,
            created_by: record.created_by || undefined,
          });

        case 'notifications':
          return await ctx.db.insert('notifications', {
            user_id: record.user_id,
            type: record.type,
            title: record.title,
            message: record.message,
            related_type: record.related_type || undefined,
            related_id: record.related_id || undefined,
            action_url: record.action_url || undefined,
            is_read: record.is_read || undefined,
            read_at: record.read_at || undefined,
            is_archived: record.is_archived || undefined,
            archived_at: record.archived_at || undefined,
            priority: record.priority || undefined,
            metadata: record.metadata || undefined,
            created_at: record.created_at,
            expires_at: record.expires_at || undefined,
          });

        default:
          throw new Error(`지원하지 않는 테이블: ${tableName}`);
      }
    } catch (error) {
      console.error(`마이그레이션 오류 - ${tableName}:`, error);
      throw error;
    }
  },
});

/**
 * 마이그레이션 상태 확인
 */
export const getMigrationStatus = mutation({
  args: {},
  handler: async ctx => {
    const tables = [
      'profiles',
      'shop_relationships',
      'products',
      'orders',
      'clinical_cases',
      'notifications',
      'clinical_photos',
      'consent_files',
      'device_sales',
      'commission_calculations',
      'audit_logs',
      'file_metadata',
    ];

    const status = await Promise.all(
      tables.map(async tableName => {
        try {
          // 각 테이블의 레코드 수 확인
          const count = await ctx.db
            .query(tableName as any)
            .collect()
            .then(records => records.length);

          return {
            tableName,
            recordCount: count,
            status: 'success' as const,
          };
        } catch (error) {
          return {
            tableName,
            recordCount: 0,
            status: 'error' as const,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    return {
      timestamp: Date.now(),
      tables: status,
      totalRecords: status.reduce((sum, table) => sum + table.recordCount, 0),
    };
  },
});

/**
 * 마이그레이션 데이터 클리어 (개발용)
 */
export const clearMigrationData = internalMutation({
  args: {
    tableName: v.optional(v.string()),
    confirm: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error('데이터 삭제를 확인하려면 confirm: true를 설정하세요.');
    }

    const tablesToClear = args.tableName
      ? [args.tableName]
      : [
          'file_metadata',
          'audit_logs',
          'commission_calculations',
          'consent_files',
          'clinical_photos',
          'device_sales',
          'notifications',
          'clinical_cases',
          'order_items',
          'orders',
          'products',
          'shop_relationships',
          'profiles',
        ];

    const results = [];

    for (const tableName of tablesToClear) {
      try {
        const records = await ctx.db.query(tableName as any).collect();

        for (const record of records) {
          await ctx.db.delete(record._id);
        }

        results.push({
          tableName,
          deletedRecords: records.length,
          status: 'success' as const,
        });

        console.log(`✅ ${tableName}: ${records.length}개 레코드 삭제 완료`);
      } catch (error) {
        results.push({
          tableName,
          deletedRecords: 0,
          status: 'error' as const,
          error: error instanceof Error ? error.message : String(error),
        });

        console.error(`❌ ${tableName} 클리어 실패:`, error);
      }
    }

    return {
      timestamp: Date.now(),
      results,
      totalDeleted: results.reduce((sum, result) => sum + result.deletedRecords, 0),
    };
  },
});

/**
 * 마이그레이션 진행률 조회
 */
export const getMigrationProgress = mutation({
  args: {},
  handler: async ctx => {
    // 각 테이블별 레코드 수와 예상 총합을 비교하여 진행률 계산
    const expectedCounts = {
      profiles: 1,
      shop_relationships: 0,
      products: 0,
      orders: 0,
      clinical_cases: 0,
      notifications: 0,
    };

    // 테이블별 레코드 수 확인
    const tables = [
      'profiles',
      'shop_relationships',
      'products',
      'orders',
      'clinical_cases',
      'notifications',
    ];

    const status = await Promise.all(
      tables.map(async tableName => {
        try {
          const count = await ctx.db
            .query(tableName as any)
            .collect()
            .then(records => records.length);

          return {
            tableName,
            recordCount: count,
            status: 'success' as const,
          };
        } catch (error) {
          return {
            tableName,
            recordCount: 0,
            status: 'error' as const,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      })
    );

    const progress = status.map((table: any) => ({
      tableName: table.tableName,
      current: table.recordCount,
      expected: expectedCounts[table.tableName as keyof typeof expectedCounts] || 0,
      progress: expectedCounts[table.tableName as keyof typeof expectedCounts]
        ? (table.recordCount / expectedCounts[table.tableName as keyof typeof expectedCounts]) * 100
        : 100,
    }));

    return {
      timestamp: Date.now(),
      tables: progress,
      overallProgress:
        progress.reduce((sum: number, table: any) => sum + table.progress, 0) / progress.length,
    };
  },
});

// 📋 마이그레이션 상태 추적
export interface MigrationStatus {
  tableName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  recordsTotal: number;
  recordsMigrated: number;
  recordsFailed: number;
  startedAt?: number;
  completedAt?: number;
  lastError?: string;
}

// 🗺️ 테이블 마이그레이션 순서 (의존성 고려)
export const MIGRATION_ORDER = [
  'profiles', // 1. 기본 사용자 프로필
  'shop_relationships', // 2. 매장 관계
  'products', // 3. 상품
  'orders', // 4. 주문
  'order_items', // 5. 주문 항목
  'device_sales', // 6. 디바이스 판매
  'kol_device_accumulator', // 7. KOL 누적 데이터
  'device_commission_tiers', // 8. 수수료 티어
  'crm_cards', // 9. CRM 카드
  'self_growth_cards', // 10. 성장 카드
  'clinical_cases', // 11. 임상 케이스
  'clinical_photos', // 12. 임상 사진
  'consent_files', // 13. 동의서
  'commission_calculations', // 14. 수수료 계산
  'notifications', // 15. 알림
  'audit_logs', // 16. 감사 로그
  'file_metadata', // 17. 파일 메타데이터
];

// 📊 마이그레이션 진행 상황 조회
export const getMigrationStatusQuery = query({
  args: {},
  handler: async ctx => {
    // 실제 마이그레이션 상태는 별도 테이블에서 관리하거나
    // 현재는 각 테이블의 데이터 수를 확인
    const status: MigrationStatus[] = [];

    for (const tableName of MIGRATION_ORDER) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        status.push({
          tableName,
          status: records.length > 0 ? 'completed' : 'pending',
          recordsTotal: records.length,
          recordsMigrated: records.length,
          recordsFailed: 0,
        });
      } catch (error) {
        status.push({
          tableName,
          status: 'failed',
          recordsTotal: 0,
          recordsMigrated: 0,
          recordsFailed: 0,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return status;
  },
});

// 🏗️ 테스트 데이터 생성 (개발용)
export const generateTestData = mutation({
  args: {
    includeProfiles: v.optional(v.boolean()),
    includeOrders: v.optional(v.boolean()),
    includeClinical: v.optional(v.boolean()),
    recordCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const count = args.recordCount || 5;
    const results: Record<string, number> = {};

    // 🧪 테스트 프로필 생성
    if (args.includeProfiles) {
      const profileIds: Id<'profiles'>[] = [];

      for (let i = 0; i < count; i++) {
        const now = Date.now();
        const profileId = await ctx.db.insert('profiles', {
          userId: `test_user_${i}` as Id<'users'>,
          email: `test${i}@example.com`,
          name: `테스트 사용자 ${i}`,
          role: i === 0 ? 'admin' : i % 3 === 0 ? 'kol' : 'shop_owner',
          status: 'approved',
          shop_name: `테스트 매장 ${i}`,
          region: ['서울', '경기', '부산', '대구', '인천'][i % 5],
          commission_rate: 10 + i * 2,
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: { test: true },
          created_at: now,
          updated_at: now,
        });
        profileIds.push(profileId);
      }
      results.profiles = profileIds.length;

      // 🏪 매장 관계 생성 (KOL → 매장)
      if (profileIds.length > 1) {
        const kolId = profileIds[0]; // 첫 번째를 KOL로
        for (let i = 1; i < Math.min(4, profileIds.length); i++) {
          await ctx.db.insert('shop_relationships', {
            shop_owner_id: profileIds[i],
            parent_id: kolId,
            started_at: Date.now(),
            is_active: true,
            relationship_type: 'direct',
            created_at: Date.now(),
            updated_at: Date.now(),
          });
        }
        results.shop_relationships = 3;
      }
    }

    // 🛍️ 테스트 상품 생성
    const productIds: Id<'products'>[] = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      const now = Date.now();
      const productId = await ctx.db.insert('products', {
        name: `테스트 제품 ${i}`,
        code: `TEST-${String(i).padStart(3, '0')}`,
        category: ['skincare', 'device', 'supplement'][i % 3] as any,
        price: 10000 + i * 5000,
        is_active: true,
        is_featured: i % 3 === 0,
        sort_order: i,
        description: `테스트용 제품 ${i} 설명`,
        default_commission_rate: 10,
        created_at: now,
        updated_at: now,
      });
      productIds.push(productId);
    }
    results.products = productIds.length;

    // 📦 테스트 주문 생성
    if (args.includeOrders && results.profiles) {
      const profiles = await ctx.db.query('profiles').collect();
      const shopProfiles = profiles.filter(p => p.role === 'shop_owner');

      for (let i = 0; i < Math.min(count * 2, 20); i++) {
        const shop = shopProfiles[i % shopProfiles.length];
        if (!shop) continue;

        const now = Date.now();
        const totalAmount = 50000 + i * 10000;

        const orderId = await ctx.db.insert('orders', {
          shop_id: shop._id,
          order_date: now - i * 24 * 60 * 60 * 1000, // 각기 다른 날짜
          order_number: `ORD-${String(i).padStart(6, '0')}`,
          total_amount: totalAmount,
          commission_rate: 15,
          commission_amount: totalAmount * 0.15,
          commission_status: 'calculated',
          order_status: i % 4 === 0 ? 'pending' : 'completed',
          is_self_shop_order: false,
          metadata: {},
          created_at: now,
          updated_at: now,
          created_by: shop._id,
        });

        // 주문 항목 생성
        for (let j = 0; j < Math.min(3, productIds.length); j++) {
          const product = productIds[j];
          const quantity = 1 + (j % 3);
          const unitPrice = 20000 + j * 5000;

          await ctx.db.insert('order_items', {
            order_id: orderId,
            product_id: product,
            product_name: `테스트 제품 ${j}`,
            product_code: `TEST-${String(j).padStart(3, '0')}`,
            quantity,
            unit_price: unitPrice,
            subtotal: quantity * unitPrice,
            item_commission_rate: 10,
            item_commission_amount: quantity * unitPrice * 0.1,
            created_at: now,
          });
        }
      }
      results.orders = Math.min(count * 2, 20);
      results.order_items = results.orders * 3;
    }

    // 🏥 테스트 임상 케이스 생성
    if (args.includeClinical && results.profiles) {
      const profiles = await ctx.db.query('profiles').collect();
      const shopProfiles = profiles.filter(p => p.role === 'shop_owner');

      for (let i = 0; i < Math.min(count, 10); i++) {
        const shop = shopProfiles[i % shopProfiles.length];
        if (!shop) continue;

        const now = Date.now();
        const caseId = await ctx.db.insert('clinical_cases', {
          shop_id: shop._id,
          subject_type: i % 2 === 0 ? 'customer' : 'self',
          name: `테스트 환자 ${i}`,
          gender: ['male', 'female'][i % 2] as any,
          age: 25 + i * 3,
          status: 'in_progress',
          treatment_item: '마이크로젯 치료',
          start_date: now - i * 7 * 24 * 60 * 60 * 1000,
          total_sessions: 10,
          consent_status: 'consented',
          consent_date: now - i * 7 * 24 * 60 * 60 * 1000,
          marketing_consent: true,
          notes: `테스트 임상 케이스 ${i}`,
          tags: ['테스트', '마이크로젯'],
          custom_fields: { testCase: true },
          photo_count: 3,
          latest_session: i + 1,
          created_at: now,
          updated_at: now,
          created_by: shop._id,
        });

        // 임상 사진 생성
        for (const photoType of ['front', 'left_side', 'right_side'] as const) {
          await ctx.db.insert('clinical_photos', {
            clinical_case_id: caseId,
            session_number: 1,
            photo_type: photoType,
            file_path: `/test/photos/case_${i}_session_1_${photoType}.jpg`,
            file_size: 1024 * 500, // 500KB
            metadata: { testPhoto: true },
            upload_date: now,
            created_at: now,
            uploaded_by: shop._id,
          });
        }
      }
      results.clinical_cases = Math.min(count, 10);
      results.clinical_photos = results.clinical_cases * 3;
    }

    return {
      success: true,
      generated: results,
      timestamp: Date.now(),
    };
  },
});

// 🔍 데이터 무결성 검증
export const validateDataIntegrity = query({
  args: {},
  handler: async ctx => {
    const issues: string[] = [];
    const stats: Record<string, number> = {};

    // 기본 통계 수집
    for (const tableName of MIGRATION_ORDER) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        stats[tableName] = records.length;
      } catch (error) {
        issues.push(`Failed to query ${tableName}: ${error}`);
        stats[tableName] = -1;
      }
    }

    // 참조 무결성 검증
    try {
      // 프로필과 주문 관계 검증
      const orders = await ctx.db.query('orders').collect();
      const profiles = await ctx.db.query('profiles').collect();
      const profileIds = new Set(profiles.map(p => p._id));

      const orphanedOrders = orders.filter(order => !profileIds.has(order.shop_id));
      if (orphanedOrders.length > 0) {
        issues.push(`${orphanedOrders.length} orders reference non-existent profiles`);
      }

      // 주문과 주문 항목 관계 검증
      const orderItems = await ctx.db.query('order_items').collect();
      const orderIds = new Set(orders.map(o => o._id));

      const orphanedItems = orderItems.filter(item => !orderIds.has(item.order_id));
      if (orphanedItems.length > 0) {
        issues.push(`${orphanedItems.length} order items reference non-existent orders`);
      }

      // 임상 케이스와 사진 관계 검증
      const clinicalCases = await ctx.db.query('clinical_cases').collect();
      const clinicalPhotos = await ctx.db.query('clinical_photos').collect();
      const caseIds = new Set(clinicalCases.map(c => c._id));

      const orphanedPhotos = clinicalPhotos.filter(photo => !caseIds.has(photo.clinical_case_id));
      if (orphanedPhotos.length > 0) {
        issues.push(`${orphanedPhotos.length} clinical photos reference non-existent cases`);
      }
    } catch (error) {
      issues.push(`Integrity check failed: ${error}`);
    }

    return {
      stats,
      issues,
      isValid: issues.length === 0,
      checkedAt: Date.now(),
    };
  },
});

// 🧹 테스트 데이터 정리
export const cleanupTestData = mutation({
  args: {
    confirmCleanup: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (!args.confirmCleanup) {
      throw new Error('Cleanup confirmation required');
    }

    const deletedCounts: Record<string, number> = {};

    // 의존성 역순으로 삭제
    const deleteOrder = [...MIGRATION_ORDER].reverse();

    for (const tableName of deleteOrder) {
      try {
        const records = await ctx.db
          .query(tableName as any)
          .filter(q => q.neq(q.field('metadata'), undefined))
          .collect();

        // 테스트 데이터만 삭제 (metadata.test === true)
        const testRecords = records.filter(
          (record: any) =>
            record.metadata &&
            (record.metadata.test === true ||
              record.metadata.testCase === true ||
              record.metadata.testPhoto === true)
        );

        for (const record of testRecords) {
          await ctx.db.delete(record._id);
        }

        deletedCounts[tableName] = testRecords.length;
      } catch (error) {
        deletedCounts[tableName] = -1;
      }
    }

    return {
      success: true,
      deleted: deletedCounts,
      timestamp: Date.now(),
    };
  },
});

// 📈 마이그레이션 통계 요약
export const getMigrationSummary = query({
  args: {},
  handler: async ctx => {
    // 마이그레이션 상태 직접 계산
    const status: MigrationStatus[] = [];
    for (const tableName of MIGRATION_ORDER) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        status.push({
          tableName,
          status: records.length > 0 ? 'completed' : 'pending',
          recordsTotal: records.length,
          recordsMigrated: records.length,
          recordsFailed: 0,
        });
      } catch (error) {
        status.push({
          tableName,
          status: 'failed',
          recordsTotal: 0,
          recordsMigrated: 0,
          recordsFailed: 0,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // 무결성 검증 직접 계산
    const issues: string[] = [];
    const stats: Record<string, number> = {};

    for (const tableName of MIGRATION_ORDER) {
      try {
        const records = await ctx.db.query(tableName as any).collect();
        stats[tableName] = records.length;
      } catch (error) {
        issues.push(`Failed to query ${tableName}: ${error}`);
        stats[tableName] = -1;
      }
    }

    const totalTables = status.length;
    const completedTables = status.filter((s: MigrationStatus) => s.status === 'completed').length;
    const totalRecords = status.reduce(
      (sum: number, s: MigrationStatus) => sum + s.recordsMigrated,
      0
    );

    return {
      overview: {
        totalTables,
        completedTables,
        completionPercentage: Math.round((completedTables / totalTables) * 100),
        totalRecords,
      },
      integrity: {
        isValid: issues.length === 0,
        issueCount: issues.length,
        issues: issues.slice(0, 5), // 처음 5개만
      },
      tableStatus: status,
      lastChecked: Date.now(),
    };
  },
});
