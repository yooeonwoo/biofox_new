import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

/**
 * 데이터 모델 간 관계 정의 및 관리 시스템
 *
 * 이 모듈은 다음과 같은 관계 패턴을 관리합니다:
 * - 1:1 관계 (User ↔ Profile)
 * - 1:M 관계 (Profile → Orders, Orders → OrderItems)
 * - 계층적 관계 (KOL → Shop Owner 계층구조)
 * - 자기 참조 관계 (Profile.approved_by)
 * - 복합 관계 (CRM Cards, Clinical Cases)
 */

// 📋 관계 타입 정의
export type RelationshipType = '1:1' | '1:M' | 'M:M' | 'hierarchical' | 'self-reference';

export interface RelationshipDefinition {
  name: string;
  type: RelationshipType;
  source: string;
  target: string;
  sourceField: string;
  targetField?: string;
  description: string;
  cascadeDelete?: boolean;
  required?: boolean;
}

// 🗺️ 시스템 관계 매핑
export const SYSTEM_RELATIONSHIPS: RelationshipDefinition[] = [
  // 👤 사용자 및 프로필 관계
  {
    name: 'user_profile',
    type: '1:1',
    source: 'users',
    target: 'profiles',
    sourceField: 'id',
    targetField: 'userId',
    description: 'Auth 사용자와 비즈니스 프로필 간의 1:1 관계',
    required: true,
  },

  // 🏪 매장 계층 관계
  {
    name: 'shop_hierarchy',
    type: 'hierarchical',
    source: 'profiles',
    target: 'shop_relationships',
    sourceField: 'id',
    targetField: 'shop_owner_id',
    description: 'KOL-매장 계층적 관계 구조',
  },
  {
    name: 'parent_child_relationship',
    type: '1:M',
    source: 'profiles',
    target: 'shop_relationships',
    sourceField: 'id',
    targetField: 'parent_id',
    description: '부모-자식 매장 관계',
  },

  // 📦 주문 관계
  {
    name: 'shop_orders',
    type: '1:M',
    source: 'profiles',
    target: 'orders',
    sourceField: 'id',
    targetField: 'shop_id',
    description: '매장의 주문들',
    cascadeDelete: false,
  },
  {
    name: 'order_items',
    type: '1:M',
    source: 'orders',
    target: 'order_items',
    sourceField: 'id',
    targetField: 'order_id',
    description: '주문의 라인 아이템들',
    cascadeDelete: true,
  },
  {
    name: 'product_orders',
    type: '1:M',
    source: 'products',
    target: 'order_items',
    sourceField: 'id',
    targetField: 'product_id',
    description: '상품의 주문 아이템들',
  },

  // 📱 디바이스 판매 관계
  {
    name: 'shop_device_sales',
    type: '1:M',
    source: 'profiles',
    target: 'device_sales',
    sourceField: 'id',
    targetField: 'shop_id',
    description: '매장의 디바이스 판매',
  },
  {
    name: 'kol_device_accumulator',
    type: '1:1',
    source: 'profiles',
    target: 'kol_device_accumulator',
    sourceField: 'id',
    targetField: 'kol_id',
    description: 'KOL의 디바이스 누적 판매 데이터',
  },

  // 📈 CRM 관계
  {
    name: 'kol_crm_cards',
    type: '1:M',
    source: 'profiles',
    target: 'crm_cards',
    sourceField: 'id',
    targetField: 'kol_id',
    description: 'KOL의 CRM 카드들',
  },
  {
    name: 'shop_crm_cards',
    type: '1:M',
    source: 'profiles',
    target: 'crm_cards',
    sourceField: 'id',
    targetField: 'shop_id',
    description: '매장의 CRM 카드들',
  },
  {
    name: 'shop_growth_cards',
    type: '1:1',
    source: 'profiles',
    target: 'self_growth_cards',
    sourceField: 'id',
    targetField: 'shop_id',
    description: '매장의 자체 성장 카드',
  },

  // 🏥 임상 관계
  {
    name: 'shop_clinical_cases',
    type: '1:M',
    source: 'profiles',
    target: 'clinical_cases',
    sourceField: 'id',
    targetField: 'shop_id',
    description: '매장의 임상 케이스들',
  },
  {
    name: 'case_photos',
    type: '1:M',
    source: 'clinical_cases',
    target: 'clinical_photos',
    sourceField: 'id',
    targetField: 'clinical_case_id',
    description: '임상 케이스의 사진들',
    cascadeDelete: true,
  },
  {
    name: 'case_consent_files',
    type: '1:1',
    source: 'clinical_cases',
    target: 'consent_files',
    sourceField: 'id',
    targetField: 'clinical_case_id',
    description: '임상 케이스의 동의서',
  },

  // 💰 수수료 관계
  {
    name: 'kol_commissions',
    type: '1:M',
    source: 'profiles',
    target: 'commission_calculations',
    sourceField: 'id',
    targetField: 'kol_id',
    description: 'KOL의 수수료 계산서들',
  },

  // 🔔 알림 관계
  {
    name: 'user_notifications',
    type: '1:M',
    source: 'profiles',
    target: 'notifications',
    sourceField: 'id',
    targetField: 'user_id',
    description: '사용자의 알림들',
  },

  // 📝 감사 로그 관계
  {
    name: 'user_audit_logs',
    type: '1:M',
    source: 'profiles',
    target: 'audit_logs',
    sourceField: 'id',
    targetField: 'user_id',
    description: '사용자의 감사 로그들',
  },

  // 🎯 자기 참조 관계
  {
    name: 'profile_approver',
    type: 'self-reference',
    source: 'profiles',
    target: 'profiles',
    sourceField: 'approved_by',
    targetField: 'id',
    description: '프로필 승인자 관계',
  },
];

/**
 * 관계 탐색 헬퍼 함수들
 */

// 🔍 특정 프로필의 하위 매장들 조회
export const getSubordinateShops = query({
  args: { parentId: v.id('profiles') },
  handler: async (ctx, args) => {
    const relationships = await ctx.db
      .query('shop_relationships')
      .withIndex('by_parent_active', q => q.eq('parent_id', args.parentId).eq('is_active', true))
      .collect();

    const shopIds = relationships.map(rel => rel.shop_owner_id);

    const shops = await Promise.all(shopIds.map(id => ctx.db.get(id)));

    return shops.filter(shop => shop !== null);
  },
});

// 🏗️ 매장의 상위 KOL 체인 조회
export const getParentChain = query({
  args: { shopId: v.id('profiles') },
  handler: async (ctx, args) => {
    const chain: any[] = [];
    let currentShopId: Id<'profiles'> | undefined = args.shopId;

    while (currentShopId) {
      const relationship = await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_active', q =>
          q.eq('shop_owner_id', currentShopId!).eq('is_active', true)
        )
        .first();

      if (!relationship?.parent_id) break;

      const parent = await ctx.db.get(relationship.parent_id);
      if (!parent) break;

      chain.push(parent);
      currentShopId = relationship.parent_id;
    }

    return chain;
  },
});

// 📊 프로필과 관련된 모든 주문 조회 (자신 + 하위 매장)
export const getAllRelatedOrders = query({
  args: {
    profileId: v.id('profiles'),
    includeSubordinates: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let shopIds = [args.profileId];

    // 하위 매장 포함 시
    if (args.includeSubordinates) {
      const relationships = await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', args.profileId).eq('is_active', true))
        .collect();

      const subordinateIds = relationships.map(rel => rel.shop_owner_id);
      shopIds = [...shopIds, ...subordinateIds];
    }

    const allOrders = await Promise.all(
      shopIds.map(shopId =>
        ctx.db
          .query('orders')
          .withIndex('by_shop', q => q.eq('shop_id', shopId))
          .collect()
      )
    );

    return allOrders.flat().sort((a, b) => b.order_date - a.order_date);
  },
});

// 🏥 매장의 임상 케이스와 관련 데이터 조회
export const getClinicalCaseWithRelations = query({
  args: { caseId: v.id('clinical_cases') },
  handler: async (ctx, args) => {
    const clinicalCase = await ctx.db.get(args.caseId);
    if (!clinicalCase) return null;

    // 관련 사진들
    const photos = await ctx.db
      .query('clinical_photos')
      .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
      .collect();

    // 동의서
    const consentFile = await ctx.db
      .query('consent_files')
      .withIndex('by_case', q => q.eq('clinical_case_id', args.caseId))
      .first();

    // 매장 정보
    const shop = await ctx.db.get(clinicalCase.shop_id);

    return {
      case: clinicalCase,
      photos,
      consentFile,
      shop,
    };
  },
});

/**
 * 참조 무결성 관리 함수들
 */

// 🔒 참조 무결성 검증
export const validateReferentialIntegrity = query({
  args: {
    table: v.string(),
    recordId: v.string(),
  },
  handler: async (ctx, args) => {
    const violations: string[] = [];

    // 해당 레코드를 참조하는 모든 관계 찾기
    const referencingRelations = SYSTEM_RELATIONSHIPS.filter(rel => rel.target === args.table);

    for (const relation of referencingRelations) {
      if (relation.targetField) {
        // 참조하는 레코드들 확인
        const referencingRecords = await ctx.db
          .query(relation.source as any)
          .filter(q => q.eq(q.field(relation.targetField!), args.recordId))
          .collect();

        if (referencingRecords.length > 0) {
          violations.push(
            `${referencingRecords.length} record(s) in ${relation.source} reference this record via ${relation.targetField}`
          );
        }
      }
    }

    return {
      canDelete: violations.length === 0,
      violations,
    };
  },
});

// 🗑️ 안전한 삭제 (참조 무결성 고려)
export const safeDelete = mutation({
  args: {
    table: v.string(),
    recordId: v.id('profiles'), // 예시로 profiles 사용
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // 참조 무결성 검증 (직접 구현)
    const violations: string[] = [];
    const referencingRelations = SYSTEM_RELATIONSHIPS.filter(rel => rel.target === args.table);

    for (const relation of referencingRelations) {
      if (relation.targetField) {
        const referencingRecords = await ctx.db
          .query(relation.source as any)
          .filter(q => q.eq(q.field(relation.targetField!), args.recordId))
          .collect();

        if (referencingRecords.length > 0) {
          violations.push(
            `${referencingRecords.length} record(s) in ${relation.source} reference this record via ${relation.targetField}`
          );
        }
      }
    }

    const canDelete = violations.length === 0;

    if (!canDelete && !args.force) {
      throw new Error(`Cannot delete: ${violations.join(', ')}`);
    }

    // CASCADE 삭제 처리
    const cascadeRelations = SYSTEM_RELATIONSHIPS.filter(
      rel => rel.target === args.table && rel.cascadeDelete
    );

    for (const relation of cascadeRelations) {
      if (relation.targetField) {
        const referencingRecords = await ctx.db
          .query(relation.source as any)
          .filter(q => q.eq(q.field(relation.targetField!), args.recordId))
          .collect();

        // CASCADE 삭제 실행
        for (const record of referencingRecords) {
          await ctx.db.delete(record._id);
        }
      }
    }

    // 원본 레코드 삭제
    await ctx.db.delete(args.recordId);

    return { success: true, cascadeDeleted: cascadeRelations.length };
  },
});

/**
 * 계층적 관계 관리
 */

// 🌳 전체 조직 트리 구조 조회
export const getOrganizationTree = query({
  args: {},
  handler: async ctx => {
    // 모든 활성 관계 조회
    const relationships = await ctx.db
      .query('shop_relationships')
      .withIndex('by_active', q => q.eq('is_active', true))
      .collect();

    // 모든 프로필 조회
    const profiles = await ctx.db.query('profiles').collect();
    const profileMap = new Map(profiles.map(p => [p._id, p]));

    // 트리 구조 구성
    const tree: any = {};
    const processed = new Set<string>();

    // 루트 노드들 (부모가 없는 노드) 찾기
    const rootIds = profiles
      .filter(profile => !relationships.some(rel => rel.shop_owner_id === profile._id))
      .map(profile => profile._id);

    function buildTree(parentId: Id<'profiles'>, depth = 0): any {
      if (processed.has(parentId) || depth > 10) return null; // 순환 방지

      processed.add(parentId);
      const profile = profileMap.get(parentId);
      if (!profile) return null;

      const children = relationships
        .filter(rel => rel.parent_id === parentId)
        .map(rel => buildTree(rel.shop_owner_id, depth + 1))
        .filter(child => child !== null);

      return {
        profile,
        children,
        depth,
      };
    }

    return rootIds.map(rootId => buildTree(rootId));
  },
});

// 📈 관계 통계 조회
export const getRelationshipStats = query({
  args: {},
  handler: async ctx => {
    const stats: Record<string, number> = {};

    for (const relation of SYSTEM_RELATIONSHIPS) {
      try {
        const count = await ctx.db.query(relation.source as any).collect();
        stats[relation.name] = count.length;
      } catch (error) {
        stats[relation.name] = -1; // 오류 표시
      }
    }

    return stats;
  },
});
