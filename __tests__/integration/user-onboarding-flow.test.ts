import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

/**
 * 사용자 온보딩 플로우 통합 테스트
 *
 * 이 테스트는 새로운 사용자가 시스템에 가입하고 승인받기까지의
 * 전체 워크플로우를 시뮬레이션합니다.
 *
 * 테스트 시나리오:
 * 1. 신규 사용자 등록
 * 2. 프로필 생성 (pending 상태)
 * 3. 관리자 승인 프로세스
 * 4. 프로필 완성도 검증
 */

describe('User Onboarding Flow Integration Tests', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  test('Complete user onboarding workflow - shop owner', async () => {
    // 1. 시뮬레이션된 인증 컨텍스트로 새 사용자 생성
    const newUser = t.withIdentity({
      name: 'New Shop Owner',
      email: 'newowner@example.com',
      subject: 'new-shop-owner-id',
    });

    // 2. 사용자 레코드 생성 (Convex Auth 시뮬레이션)
    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'newowner@example.com',
        name: 'New Shop Owner',
      });
    });

    // 3. 프로필 자동 생성 (ensureUserProfile 호출)
    const profileId = await newUser.mutation(api.auth.ensureUserProfile, {
      userId,
      email: 'newowner@example.com',
      name: 'New Shop Owner',
      role: 'shop_owner',
      shop_name: '새로운 매장',
      region: '서울 강남구',
      commission_rate: 0.05,
    });

    // 4. 생성된 프로필이 pending 상태인지 확인
    const createdProfile = await t.query(api.profiles.getProfileById, { profileId });
    expect(createdProfile).toMatchObject({
      email: 'newowner@example.com',
      name: 'New Shop Owner',
      role: 'shop_owner',
      status: 'pending',
      shop_name: '새로운 매장',
      region: '서울 강남구',
      commission_rate: 0.05,
    });

    // 5. 프로필 완성도 확인
    const completeness = await t.query(api.auth.getProfileCompleteness, { userId });
    expect(completeness?.isComplete).toBe(true);
    expect(completeness?.completionPercentage).toBe(100);

    // 6. 관리자 생성 및 승인 프로세스
    const adminUserId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'admin@biofox.com',
        name: 'System Admin',
      });
    });

    const adminProfileId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('profiles', {
        userId: adminUserId,
        email: 'admin@biofox.com',
        name: 'System Admin',
        role: 'admin',
        status: 'approved',
        shop_name: 'BioFox HQ',
        region: '서울',
        total_subordinates: 0,
        active_subordinates: 0,
        metadata: {},
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    });

    // 7. 관리자의 승인 프로세스 실행
    const approvalResult = await t.mutation(api.profiles.approveProfile, {
      profileId,
      approved: true,
      approvedBy: adminProfileId,
      commission_rate: 0.08, // 최종 수수료율 조정
    });

    expect(approvalResult).toEqual({ success: true });

    // 8. 승인 후 프로필 상태 확인
    const approvedProfile = await t.query(api.profiles.getProfileById, { profileId });
    expect(approvedProfile).toMatchObject({
      status: 'approved',
      approved_by: adminProfileId,
      commission_rate: 0.08, // 승인 시 조정된 수수료율
    });
    expect(approvedProfile?.approved_at).toBeDefined();

    // 9. 승인된 프로필이 전체 목록에서 올바르게 조회되는지 확인
    const allProfiles = await t.query(api.profiles.getAllProfiles);
    const approvedProfiles = allProfiles.filter((p: any) => p.status === 'approved');
    expect(approvedProfiles).toHaveLength(2); // admin + 새로 승인된 사용자

    // 10. 역할별 조회에서도 올바르게 나타나는지 확인
    const shopOwners = await t.query(api.profiles.getProfilesByRole, { role: 'shop_owner' });
    expect(shopOwners).toHaveLength(1);
    expect(shopOwners[0].status).toBe('approved');
  });

  test('Complete user onboarding workflow - KOL', async () => {
    // KOL 온보딩 플로우 테스트
    const newKOL = t.withIdentity({
      name: 'New KOL',
      email: 'newkol@example.com',
      subject: 'new-kol-id',
    });

    // 1. KOL 사용자 생성
    const kolUserId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'newkol@example.com',
        name: 'New KOL',
      });
    });

    // 2. KOL 프로필 생성
    const kolProfileId = await newKOL.mutation(api.auth.ensureUserProfile, {
      userId: kolUserId,
      email: 'newkol@example.com',
      name: 'New KOL',
      role: 'kol',
      shop_name: 'KOL 관리센터',
      region: '부산',
      commission_rate: 0.15,
    });

    // 3. KOL 프로필 검증
    const kolProfile = await t.query(api.profiles.getProfileById, { profileId: kolProfileId });
    expect(kolProfile).toMatchObject({
      role: 'kol',
      status: 'pending',
      commission_rate: 0.15,
    });

    // 4. 관리자 승인
    const adminUserId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'admin@biofox.com',
        name: 'System Admin',
      });
    });

    const adminProfileId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('profiles', {
        userId: adminUserId,
        email: 'admin@biofox.com',
        name: 'System Admin',
        role: 'admin',
        status: 'approved',
        shop_name: 'BioFox HQ',
        total_subordinates: 0,
        active_subordinates: 0,
        metadata: {},
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    });

    await t.mutation(api.profiles.approveProfile, {
      profileId: kolProfileId,
      approved: true,
      approvedBy: adminProfileId,
      commission_rate: 0.12, // KOL 수수료율 조정
    });

    // 5. 승인된 KOL 검증
    const approvedKOL = await t.query(api.profiles.getProfileById, { profileId: kolProfileId });
    expect(approvedKOL).toMatchObject({
      role: 'kol',
      status: 'approved',
      commission_rate: 0.12,
    });

    // 6. KOL 목록에서 확인
    const kols = await t.query(api.profiles.getProfilesByRole, { role: 'kol' });
    expect(kols).toHaveLength(1);
    expect(kols[0].status).toBe('approved');
  });

  test('User onboarding with validation errors', async () => {
    // 잘못된 데이터로 온보딩 시도
    const invalidUser = t.withIdentity({
      name: 'Invalid User',
      email: 'invalid@example.com',
      subject: 'invalid-user-id',
    });

    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'invalid@example.com',
        name: 'Invalid User',
      });
    });

    // 1. 잘못된 이메일 형식으로 프로필 생성 시도
    await expect(async () => {
      await invalidUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: 'invalid-email-format', // 잘못된 이메일
        name: 'Invalid User',
        role: 'shop_owner',
        shop_name: 'Invalid Shop',
      });
    }).rejects.toThrowError(/Validation failed/);

    // 2. 빈 이름으로 프로필 생성 시도
    await expect(async () => {
      await invalidUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: 'valid@example.com',
        name: '', // 빈 이름
        role: 'shop_owner',
        shop_name: 'Valid Shop',
      });
    }).rejects.toThrowError(/Validation failed/);
  });

  test('User onboarding rejection workflow', async () => {
    // 거절 워크플로우 테스트
    const rejectedUser = t.withIdentity({
      name: 'Rejected User',
      email: 'rejected@example.com',
      subject: 'rejected-user-id',
    });

    // 1. 사용자 및 프로필 생성
    const userId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'rejected@example.com',
        name: 'Rejected User',
      });
    });

    const profileId = await rejectedUser.mutation(api.auth.ensureUserProfile, {
      userId,
      email: 'rejected@example.com',
      name: 'Rejected User',
      role: 'shop_owner',
      shop_name: 'Rejected Shop',
    });

    // 2. 관리자 생성
    const adminUserId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('users', {
        email: 'admin@biofox.com',
        name: 'System Admin',
      });
    });

    const adminProfileId = await t.run(async (ctx: any) => {
      return await ctx.db.insert('profiles', {
        userId: adminUserId,
        email: 'admin@biofox.com',
        name: 'System Admin',
        role: 'admin',
        status: 'approved',
        shop_name: 'BioFox HQ',
        total_subordinates: 0,
        active_subordinates: 0,
        metadata: {},
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    });

    // 3. 관리자가 프로필 거절
    const rejectionResult = await t.mutation(api.profiles.approveProfile, {
      profileId,
      approved: false,
      approvedBy: adminProfileId,
    });

    expect(rejectionResult).toEqual({ success: true });

    // 4. 거절된 프로필 상태 확인
    const rejectedProfile = await t.query(api.profiles.getProfileById, { profileId });
    expect(rejectedProfile).toMatchObject({
      status: 'rejected',
      approved_by: adminProfileId,
    });
    expect(rejectedProfile?.approved_at).toBeUndefined();

    // 5. pending 목록에서 제외되었는지 확인
    const pendingProfiles = await t.query(api.profiles.getPendingProfiles);
    expect(pendingProfiles.some((p: any) => p._id === profileId)).toBe(false);
  });

  test('Multiple users onboarding concurrency', async () => {
    // 동시 다중 사용자 온보딩 테스트
    const users = [
      { name: 'User 1', email: 'user1@example.com' },
      { name: 'User 2', email: 'user2@example.com' },
      { name: 'User 3', email: 'user3@example.com' },
    ];

    // 1. 동시에 여러 사용자 생성
    const userPromises = users.map(async (userData, index) => {
      const authenticatedUser = t.withIdentity({
        name: userData.name,
        email: userData.email,
        subject: `user-${index + 1}-id`,
      });

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: userData.email,
          name: userData.name,
        });
      });

      const profileId = await authenticatedUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: userData.email,
        name: userData.name,
        role: 'shop_owner',
        shop_name: `${userData.name}'s Shop`,
        region: '서울',
      });

      return { userId, profileId, userData };
    });

    // 2. 모든 사용자 생성 완료 대기
    const createdUsers = await Promise.all(userPromises);

    // 3. 모든 프로필이 pending 상태인지 확인
    const pendingProfiles = await t.query(api.profiles.getPendingProfiles);
    expect(pendingProfiles).toHaveLength(3);

    // 4. 각 프로필의 데이터 무결성 확인
    for (const { profileId, userData } of createdUsers) {
      const profile = await t.query(api.profiles.getProfileById, { profileId });
      expect(profile).toMatchObject({
        name: userData.name,
        email: userData.email,
        status: 'pending',
        role: 'shop_owner',
      });
    }

    // 5. 전체 프로필 수 확인
    const allProfiles = await t.query(api.profiles.getAllProfiles);
    expect(allProfiles).toHaveLength(3);
  });
});
