/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

/**
 * 매장 관계 관리 플로우 통합 테스트
 *
 * 이 테스트는 KOL과 매장 오너 간의 계층적 관계 관리 시스템을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. KOL 및 매장 오너 생성
 * 2. 계층적 관계 설정
 * 3. 관계 활성화/비활성화
 * 4. 관계 이전 및 변경
 * 5. 수수료 계산 및 하위 매장 관리
 */

describe('Shop Relationship Management Flow Integration Tests', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  // 테스트용 KOL 생성 헬퍼 함수
  async function createKOL(name: string, email: string): Promise<{ userId: any; profileId: any }> {
    const kolAuth = t.withIdentity({
      name,
      email,
      subject: `${email}-id`,
    });

    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email,
        name,
      });
    });

    const profileId = await kolAuth.mutation(api.auth.ensureUserProfile, {
      userId,
      email,
      name,
      role: 'kol',
      shop_name: `${name} KOL Center`,
      region: '서울',
      commission_rate: 0.15,
    });

    // KOL을 승인된 상태로 만들기
    await t.run(async (ctx: any) => {
      await ctx.db.patch(profileId, {
        status: 'approved',
        approved_at: Date.now(),
      });
    });

    return { userId, profileId };
  }

  // 테스트용 매장 오너 생성 헬퍼 함수
  async function createShopOwner(
    name: string,
    email: string,
    shopName: string
  ): Promise<{ userId: any; profileId: any }> {
    const ownerAuth = t.withIdentity({
      name,
      email,
      subject: `${email}-id`,
    });

    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email,
        name,
      });
    });

    const profileId = await ownerAuth.mutation(api.auth.ensureUserProfile, {
      userId,
      email,
      name,
      role: 'shop_owner',
      shop_name: shopName,
      region: '서울',
      commission_rate: 0.05,
    });

    // 매장 오너를 승인된 상태로 만들기
    await t.run(async (ctx: any) => {
      await ctx.db.patch(profileId, {
        status: 'approved',
        approved_at: Date.now(),
      });
    });

    return { userId, profileId };
  }

  test('Complete KOL-Shop relationship establishment', async () => {
    // 1. KOL 생성
    const { profileId: kolProfileId } = await createKOL('Master KOL', 'masterkol@biofox.com');

    // 2. 매장 오너들 생성
    const { profileId: shop1ProfileId } = await createShopOwner(
      'Shop Owner 1',
      'owner1@shop.com',
      '뷰티샵 강남점'
    );
    const { profileId: shop2ProfileId } = await createShopOwner(
      'Shop Owner 2',
      'owner2@shop.com',
      '스킨케어 홍대점'
    );
    const { profileId: shop3ProfileId } = await createShopOwner(
      'Shop Owner 3',
      'owner3@shop.com',
      '코스메틱 건대점'
    );

    // 3. KOL과 매장들 간의 관계 생성
    const now = Date.now();

    const relationship1Id = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shop1ProfileId,
        parent_id: kolProfileId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Direct KOL relationship',
        created_at: now,
        updated_at: now,
        created_by: kolProfileId,
      });
    });

    const relationship2Id = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shop2ProfileId,
        parent_id: kolProfileId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Direct KOL relationship',
        created_at: now,
        updated_at: now,
        created_by: kolProfileId,
      });
    });

    const relationship3Id = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shop3ProfileId,
        parent_id: kolProfileId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Direct KOL relationship',
        created_at: now,
        updated_at: now,
        created_by: kolProfileId,
      });
    });

    // 4. 관계가 올바르게 생성되었는지 확인
    const allRelationships = await t.run(async (ctx: any) => {
      return await ctx.db.query('shop_relationships').collect();
    });

    expect(allRelationships).toHaveLength(3);
    expect(allRelationships.every((rel: any) => rel.parent_id === kolProfileId)).toBe(true);
    expect(allRelationships.every((rel: any) => rel.is_active === true)).toBe(true);

    // 5. KOL의 하위 매장 조회
    const kolSubordinates = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', (q: any) =>
          q.eq('parent_id', kolProfileId).eq('is_active', true)
        )
        .collect();
    });

    expect(kolSubordinates).toHaveLength(3);

    // 6. 각 매장의 관계 확인
    const shop1Relationships = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_active', (q: any) =>
          q.eq('shop_owner_id', shop1ProfileId).eq('is_active', true)
        )
        .collect();
    });

    expect(shop1Relationships).toHaveLength(1);
    expect(shop1Relationships[0].parent_id).toBe(kolProfileId);

    // 7. KOL 프로필의 하위 매장 수 업데이트 시뮬레이션
    await t.run(async (ctx: any) => {
      await ctx.db.patch(kolProfileId, {
        total_subordinates: 3,
        active_subordinates: 3,
      });
    });

    const updatedKOL = await t.query(api.profiles.getProfileById, { profileId: kolProfileId });
    expect(updatedKOL).toMatchObject({
      total_subordinates: 3,
      active_subordinates: 3,
    });
  });

  test('Relationship transfer between KOLs', async () => {
    // 1. 두 KOL 생성
    const { profileId: kol1ProfileId } = await createKOL('KOL 1', 'kol1@biofox.com');
    const { profileId: kol2ProfileId } = await createKOL('KOL 2', 'kol2@biofox.com');

    // 2. 매장 오너 생성
    const { profileId: shopProfileId } = await createShopOwner(
      'Transfer Shop',
      'transfer@shop.com',
      '이전될 매장'
    );

    // 3. KOL1과 매장 간의 초기 관계 생성
    const now = Date.now();
    const initialRelationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopProfileId,
        parent_id: kol1ProfileId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Initial relationship with KOL 1',
        created_at: now,
        updated_at: now,
        created_by: kol1ProfileId,
      });
    });

    // 4. 초기 관계 확인
    const initialRelationship = await t.run(async (ctx: any) => {
      return await ctx.db.get(initialRelationshipId);
    });

    expect(initialRelationship.parent_id).toBe(kol1ProfileId);
    expect(initialRelationship.is_active).toBe(true);

    // 5. KOL1에서 KOL2로 관계 이전
    // 기존 관계 비활성화
    await t.run(async (ctx: any) => {
      await ctx.db.patch(initialRelationshipId, {
        is_active: false,
        ended_at: Date.now(),
        updated_at: Date.now(),
      });
    });

    // 새로운 관계 생성
    const newRelationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopProfileId,
        parent_id: kol2ProfileId,
        started_at: Date.now(),
        is_active: true,
        relationship_type: 'transferred',
        notes: 'Transferred from KOL 1 to KOL 2',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: kol1ProfileId, // 이전을 수행한 KOL
      });
    });

    // 6. 이전 결과 확인
    const oldRelationship = await t.run(async (ctx: any) => {
      return await ctx.db.get(initialRelationshipId);
    });

    const newRelationship = await t.run(async (ctx: any) => {
      return await ctx.db.get(newRelationshipId);
    });

    expect(oldRelationship.is_active).toBe(false);
    expect(oldRelationship.ended_at).toBeDefined();

    expect(newRelationship.parent_id).toBe(kol2ProfileId);
    expect(newRelationship.is_active).toBe(true);
    expect(newRelationship.relationship_type).toBe('transferred');

    // 7. KOL별 활성 관계 수 확인
    const kol1ActiveRelationships = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kol1ProfileId).eq('is_active', true))
        .collect();
    });

    const kol2ActiveRelationships = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kol2ProfileId).eq('is_active', true))
        .collect();
    });

    expect(kol1ActiveRelationships).toHaveLength(0);
    expect(kol2ActiveRelationships).toHaveLength(1);
  });

  test('Hierarchical relationship structure - multi-level KOL', async () => {
    // 1. 계층 구조 생성: 상위 KOL → 중간 KOL → 매장 오너
    const { profileId: topKOLId } = await createKOL('Top KOL', 'topkol@biofox.com');
    const { profileId: midKOLId } = await createKOL('Mid KOL', 'midkol@biofox.com');
    const { profileId: shopOwnerId } = await createShopOwner(
      'Bottom Shop',
      'bottom@shop.com',
      '최하위 매장'
    );

    const now = Date.now();

    // 2. 상위 KOL → 중간 KOL 관계
    const topToMidRelationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: midKOLId, // 중간 KOL도 shop_owner_id로 취급
        parent_id: topKOLId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Top KOL managing Mid KOL',
        created_at: now,
        updated_at: now,
        created_by: topKOLId,
      });
    });

    // 3. 중간 KOL → 매장 오너 관계
    const midToShopRelationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopOwnerId,
        parent_id: midKOLId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Mid KOL managing shop owner',
        created_at: now,
        updated_at: now,
        created_by: midKOLId,
      });
    });

    // 4. 계층 구조 검증
    const topLevel = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', topKOLId).eq('is_active', true))
        .collect();
    });

    const midLevel = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', midKOLId).eq('is_active', true))
        .collect();
    });

    expect(topLevel).toHaveLength(1); // Top KOL은 Mid KOL 1개 관리
    expect(midLevel).toHaveLength(1); // Mid KOL은 매장 1개 관리

    expect(topLevel[0].shop_owner_id).toBe(midKOLId);
    expect(midLevel[0].shop_owner_id).toBe(shopOwnerId);

    // 5. 각 레벨에서 자신의 상위 관리자 조회
    const midKOLParent = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_active', q => q.eq('shop_owner_id', midKOLId).eq('is_active', true))
        .first();
    });

    const shopOwnerParent = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_active', q => q.eq('shop_owner_id', shopOwnerId).eq('is_active', true))
        .first();
    });

    expect(midKOLParent?.parent_id).toBe(topKOLId);
    expect(shopOwnerParent?.parent_id).toBe(midKOLId);
  });

  test('Relationship deactivation and reactivation', async () => {
    // 1. KOL과 매장 오너 생성
    const { profileId: kolProfileId } = await createKOL('Test KOL', 'testkol@biofox.com');
    const { profileId: shopProfileId } = await createShopOwner(
      'Test Shop',
      'testshop@shop.com',
      '테스트 매장'
    );

    // 2. 관계 생성
    const now = Date.now();
    const relationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopProfileId,
        parent_id: kolProfileId,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Test relationship',
        created_at: now,
        updated_at: now,
        created_by: kolProfileId,
      });
    });

    // 3. 관계 비활성화
    await t.run(async (ctx: any) => {
      await ctx.db.patch(relationshipId, {
        is_active: false,
        ended_at: Date.now(),
        updated_at: Date.now(),
        notes: 'Temporarily deactivated',
      });
    });

    // 4. 비활성화 상태 확인
    const deactivatedRelationship = await t.run(async (ctx: any) => {
      return await ctx.db.get(relationshipId);
    });

    expect(deactivatedRelationship.is_active).toBe(false);
    expect(deactivatedRelationship.ended_at).toBeDefined();

    // 5. 활성 관계 조회에서 제외되는지 확인
    const activeRelationships = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kolProfileId).eq('is_active', true))
        .collect();
    });

    expect(activeRelationships).toHaveLength(0);

    // 6. 관계 재활성화 (새로운 관계로 생성)
    const reactivatedRelationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopProfileId,
        parent_id: kolProfileId,
        started_at: Date.now(),
        is_active: true,
        relationship_type: 'direct',
        notes: 'Reactivated relationship',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: kolProfileId,
      });
    });

    // 7. 재활성화 확인
    const reactivatedActiveRelationships = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kolProfileId).eq('is_active', true))
        .collect();
    });

    expect(reactivatedActiveRelationships).toHaveLength(1);
    expect(reactivatedActiveRelationships[0]._id).toBe(reactivatedRelationshipId);
  });

  test('Multiple KOLs with overlapping subordinates validation', async () => {
    // 1. 두 KOL과 매장 오너 생성
    const { profileId: kol1Id } = await createKOL('KOL A', 'kola@biofox.com');
    const { profileId: kol2Id } = await createKOL('KOL B', 'kolb@biofox.com');
    const { profileId: shopId } = await createShopOwner(
      'Shared Shop',
      'shared@shop.com',
      '공유 매장'
    );

    const now = Date.now();

    // 2. 첫 번째 KOL과 매장 관계 생성
    const relationship1Id = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopId,
        parent_id: kol1Id,
        started_at: now,
        is_active: true,
        relationship_type: 'direct',
        notes: 'KOL A relationship',
        created_at: now,
        updated_at: now,
        created_by: kol1Id,
      });
    });

    // 3. 동일한 매장에 대한 두 번째 관계 생성 시도
    // (실제 비즈니스 로직에서는 제한될 수 있지만, 데이터 구조상 가능)
    const relationship2Id = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopId,
        parent_id: kol2Id,
        started_at: now + 1000, // 조금 늦게 시작
        is_active: true,
        relationship_type: 'transferred',
        notes: 'KOL B relationship - transferred from KOL A',
        created_at: now + 1000,
        updated_at: now + 1000,
        created_by: kol2Id,
      });
    });

    // 4. 매장의 모든 관계 조회
    const shopAllRelationships = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_owner', q => q.eq('shop_owner_id', shopId))
        .collect();
    });

    expect(shopAllRelationships).toHaveLength(2);

    // 5. 활성 관계만 조회
    const shopActiveRelationships = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_active', q => q.eq('shop_owner_id', shopId).eq('is_active', true))
        .collect();
    });

    expect(shopActiveRelationships).toHaveLength(2);

    // 6. 각 KOL의 관점에서 매장 조회
    const kol1Shops = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kol1Id).eq('is_active', true))
        .collect();
    });

    const kol2Shops = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_parent_active', q => q.eq('parent_id', kol2Id).eq('is_active', true))
        .collect();
    });

    expect(kol1Shops).toHaveLength(1);
    expect(kol2Shops).toHaveLength(1);
    expect(kol1Shops[0].shop_owner_id).toBe(shopId);
    expect(kol2Shops[0].shop_owner_id).toBe(shopId);
  });

  test('Relationship history and audit trail', async () => {
    // 1. KOL과 매장 오너 생성
    const { profileId: kolProfileId } = await createKOL('History KOL', 'historykol@biofox.com');
    const { profileId: shopProfileId } = await createShopOwner(
      'History Shop',
      'historyshop@shop.com',
      '히스토리 매장'
    );

    const startTime = Date.now();

    // 2. 초기 관계 생성
    const initialRelationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopProfileId,
        parent_id: kolProfileId,
        started_at: startTime,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Initial direct relationship',
        created_at: startTime,
        updated_at: startTime,
        created_by: kolProfileId,
      });
    });

    // 3. 관계 일시 중단
    const pauseTime = startTime + 30000; // 30초 후
    await t.run(async (ctx: any) => {
      await ctx.db.patch(initialRelationshipId, {
        is_active: false,
        ended_at: pauseTime,
        updated_at: pauseTime,
        notes: 'Temporarily paused due to performance issues',
      });
    });

    // 4. 관계 재시작 (새 레코드)
    const restartTime = startTime + 60000; // 1분 후
    const restartedRelationshipId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('shop_relationships', {
        shop_owner_id: shopProfileId,
        parent_id: kolProfileId,
        started_at: restartTime,
        is_active: true,
        relationship_type: 'direct',
        notes: 'Restarted after performance improvements',
        created_at: restartTime,
        updated_at: restartTime,
        created_by: kolProfileId,
      });
    });

    // 5. 전체 관계 히스토리 조회
    const relationshipHistory = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_owner', q => q.eq('shop_owner_id', shopProfileId))
        .order('desc')
        .collect();
    });

    expect(relationshipHistory).toHaveLength(2);

    // 6. 시간순 정렬 확인
    const sortedHistory = relationshipHistory.sort((a: any, b: any) => a.started_at - b.started_at);

    expect(sortedHistory[0]._id).toBe(initialRelationshipId);
    expect(sortedHistory[0].is_active).toBe(false);
    expect(sortedHistory[0].ended_at).toBe(pauseTime);

    expect(sortedHistory[1]._id).toBe(restartedRelationshipId);
    expect(sortedHistory[1].is_active).toBe(true);
    expect(sortedHistory[1].ended_at).toBeUndefined();

    // 7. 현재 활성 관계만 조회
    const currentActiveRelationship = await t.run(async (ctx: any) => {
      return await ctx.db
        .query('shop_relationships')
        .withIndex('by_shop_active', q =>
          q.eq('shop_owner_id', shopProfileId).eq('is_active', true)
        )
        .first();
    });

    expect(currentActiveRelationship?._id).toBe(restartedRelationshipId);
    expect(currentActiveRelationship?.notes).toBe('Restarted after performance improvements');
  });
});
