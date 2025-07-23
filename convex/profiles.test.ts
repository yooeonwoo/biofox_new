import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

describe('Profiles Functions', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  describe('Query Functions', () => {
    test('getAllProfiles - should return all profiles', async () => {
      // 테스트 데이터 준비
      const userId1 = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'test1@example.com',
          name: 'Test User 1',
        });
      });

      const userId2 = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'test2@example.com',
          name: 'Test User 2',
        });
      });

      const now = Date.now();

      await t.run(async (ctx: any) => {
        await ctx.db.insert('profiles', {
          userId: userId1,
          email: 'test1@example.com',
          name: 'Test User 1',
          role: 'kol',
          status: 'approved',
          shop_name: 'Test Shop 1',
          region: 'Seoul',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        await ctx.db.insert('profiles', {
          userId: userId2,
          email: 'test2@example.com',
          name: 'Test User 2',
          role: 'shop_owner',
          status: 'pending',
          shop_name: 'Test Shop 2',
          region: 'Busan',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });
      });

      // 테스트 실행
      const profiles = await t.query(api.profiles.getAllProfiles);

      // 검증
      expect(profiles).toHaveLength(2);
      expect(profiles[0]).toMatchObject({
        email: 'test1@example.com',
        name: 'Test User 1',
        role: 'kol',
        status: 'approved',
        shop_name: 'Test Shop 1',
      });
      expect(profiles[1]).toMatchObject({
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'shop_owner',
        status: 'pending',
        shop_name: 'Test Shop 2',
      });
    });

    test('getProfileById - should return specific profile', async () => {
      // 테스트 데이터 준비
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'test@example.com',
          name: 'Test User',
        });
      });

      const now = Date.now();
      const profileId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('profiles', {
          userId,
          email: 'test@example.com',
          name: 'Test User',
          role: 'kol',
          status: 'approved',
          shop_name: 'Test Shop',
          region: 'Seoul',
          commission_rate: 0.1,
          total_subordinates: 5,
          active_subordinates: 3,
          metadata: { notes: 'Test notes' },
          created_at: now,
          updated_at: now,
        });
      });

      // 테스트 실행
      const profile = await t.query(api.profiles.getProfileById, { profileId });

      // 검증
      expect(profile).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        role: 'kol',
        status: 'approved',
        shop_name: 'Test Shop',
        region: 'Seoul',
        commission_rate: 0.1,
        total_subordinates: 5,
        active_subordinates: 3,
      });
      expect(profile?.metadata).toEqual({ notes: 'Test notes' });
    });

    test('getProfileById - should return null for non-existent profile', async () => {
      // 존재하지 않는 ID로 테스트
      const fakeId = await t.run(async (ctx: any) => {
        // 더미 프로필을 만들어 ID 생성 후 삭제
        const tempId = await ctx.db.insert('profiles', {
          userId: await ctx.db.insert('users', { email: 'temp@example.com', name: 'Temp' }),
          email: 'temp@example.com',
          name: 'Temp',
          role: 'shop_owner',
          status: 'pending',
          shop_name: 'Temp Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      // 테스트 실행
      const profile = await t.query(api.profiles.getProfileById, { profileId: fakeId });

      // 검증
      expect(profile).toBeNull();
    });

    test('getProfilesByRole - should return profiles filtered by role', async () => {
      // 테스트 데이터 준비
      const now = Date.now();

      await t.run(async (ctx: any) => {
        // KOL 프로필들
        const userId1 = await ctx.db.insert('users', { email: 'kol1@example.com', name: 'KOL 1' });
        const userId2 = await ctx.db.insert('users', { email: 'kol2@example.com', name: 'KOL 2' });
        // 매장 오너 프로필
        const userId3 = await ctx.db.insert('users', { email: 'owner@example.com', name: 'Owner' });

        await ctx.db.insert('profiles', {
          userId: userId1,
          email: 'kol1@example.com',
          name: 'KOL 1',
          role: 'kol',
          status: 'approved',
          shop_name: 'KOL Shop 1',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        await ctx.db.insert('profiles', {
          userId: userId2,
          email: 'kol2@example.com',
          name: 'KOL 2',
          role: 'kol',
          status: 'pending',
          shop_name: 'KOL Shop 2',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        await ctx.db.insert('profiles', {
          userId: userId3,
          email: 'owner@example.com',
          name: 'Owner',
          role: 'shop_owner',
          status: 'approved',
          shop_name: 'Owner Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });
      });

      // 테스트 실행 - KOL 역할만 조회
      const kolProfiles = await t.query(api.profiles.getProfilesByRole, { role: 'kol' });

      // 검증
      expect(kolProfiles).toHaveLength(2);
      expect(kolProfiles.every((p: any) => p.role === 'kol')).toBe(true);
      expect(kolProfiles.map((p: any) => p.name)).toEqual(['KOL 1', 'KOL 2']);

      // 매장 오너 역할 조회
      const ownerProfiles = await t.query(api.profiles.getProfilesByRole, { role: 'shop_owner' });
      expect(ownerProfiles).toHaveLength(1);
      expect(ownerProfiles[0].name).toBe('Owner');
    });

    test('getPendingProfiles - should return only pending profiles', async () => {
      // 테스트 데이터 준비
      const now = Date.now();

      await t.run(async (ctx: any) => {
        const userId1 = await ctx.db.insert('users', {
          email: 'pending1@example.com',
          name: 'Pending 1',
        });
        const userId2 = await ctx.db.insert('users', {
          email: 'pending2@example.com',
          name: 'Pending 2',
        });
        const userId3 = await ctx.db.insert('users', {
          email: 'approved@example.com',
          name: 'Approved',
        });

        // Pending 프로필들
        await ctx.db.insert('profiles', {
          userId: userId1,
          email: 'pending1@example.com',
          name: 'Pending 1',
          role: 'kol',
          status: 'pending',
          shop_name: 'Pending Shop 1',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        await ctx.db.insert('profiles', {
          userId: userId2,
          email: 'pending2@example.com',
          name: 'Pending 2',
          role: 'shop_owner',
          status: 'pending',
          shop_name: 'Pending Shop 2',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        // Approved 프로필 (결과에 포함되지 않아야 함)
        await ctx.db.insert('profiles', {
          userId: userId3,
          email: 'approved@example.com',
          name: 'Approved',
          role: 'admin',
          status: 'approved',
          shop_name: 'Approved Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });
      });

      // 테스트 실행
      const pendingProfiles = await t.query(api.profiles.getPendingProfiles);

      // 검증
      expect(pendingProfiles).toHaveLength(2);
      expect(pendingProfiles.every((p: any) => p.status === 'pending')).toBe(true);
      expect(pendingProfiles.map((p: any) => p.name)).toEqual(['Pending 1', 'Pending 2']);
    });
  });

  describe('Mutation Functions', () => {
    test('createProfile - should create new profile successfully', async () => {
      // 테스트 데이터 준비
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'newuser@example.com',
          name: 'New User',
        });
      });

      // 테스트 실행
      const profileId = await t.mutation(api.profiles.createProfile, {
        userId,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'kol',
        shop_name: 'New User Shop',
        region: 'Seoul',
        naver_place_link: 'https://place.naver.com/test',
        commission_rate: 0.15,
      });

      // 검증
      expect(profileId).toBeDefined();

      const createdProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });

      expect(createdProfile).toMatchObject({
        userId,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'kol',
        status: 'pending',
        shop_name: 'New User Shop',
        region: 'Seoul',
        naver_place_link: 'https://place.naver.com/test',
        commission_rate: 0.15,
        total_subordinates: 0,
        active_subordinates: 0,
      });
      expect(createdProfile?.created_at).toBeDefined();
      expect(createdProfile?.updated_at).toBeDefined();
      expect(createdProfile?.metadata).toEqual({});
    });

    test('updateProfile - should update profile fields successfully', async () => {
      // 테스트 데이터 준비
      const now = Date.now();
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'update@example.com',
          name: 'Update User',
        });
      });

      const profileId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('profiles', {
          userId,
          email: 'update@example.com',
          name: 'Update User',
          role: 'shop_owner',
          status: 'approved',
          shop_name: 'Original Shop',
          region: 'Seoul',
          commission_rate: 0.1,
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });
      });

      // 테스트 실행
      const updatedId = await t.mutation(api.profiles.updateProfile, {
        profileId,
        name: 'Updated Name',
        shop_name: 'Updated Shop',
        region: 'Busan',
        commission_rate: 0.2,
      });

      // 검증
      expect(updatedId).toBe(profileId);

      const updatedProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });

      expect(updatedProfile).toMatchObject({
        name: 'Updated Name',
        shop_name: 'Updated Shop',
        region: 'Busan',
        commission_rate: 0.2,
      });
      expect(updatedProfile?.updated_at).toBeGreaterThanOrEqual(now);
      // 업데이트하지 않은 필드는 그대로 유지
      expect(updatedProfile?.email).toBe('update@example.com');
      expect(updatedProfile?.role).toBe('shop_owner');
      expect(updatedProfile?.status).toBe('approved');
    });

    test('updateProfile - should update only provided fields', async () => {
      // 테스트 데이터 준비
      const now = Date.now();
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'partial@example.com',
          name: 'Partial User',
        });
      });

      const profileId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('profiles', {
          userId,
          email: 'partial@example.com',
          name: 'Partial User',
          role: 'kol',
          status: 'pending',
          shop_name: 'Original Shop',
          region: 'Seoul',
          commission_rate: 0.1,
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });
      });

      // 테스트 실행 - 이름만 업데이트
      await t.mutation(api.profiles.updateProfile, {
        profileId,
        name: 'New Name Only',
      });

      // 검증
      const updatedProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });

      expect(updatedProfile?.name).toBe('New Name Only');
      // 다른 필드들은 변경되지 않아야 함
      expect(updatedProfile?.shop_name).toBe('Original Shop');
      expect(updatedProfile?.region).toBe('Seoul');
      expect(updatedProfile?.commission_rate).toBe(0.1);
    });

    test('deleteProfile - should delete profile successfully', async () => {
      // 테스트 데이터 준비
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'delete@example.com',
          name: 'Delete User',
        });
      });

      const profileId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('profiles', {
          userId,
          email: 'delete@example.com',
          name: 'Delete User',
          role: 'shop_owner',
          status: 'approved',
          shop_name: 'Delete Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // 삭제 전 존재 확인
      const beforeDelete = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });
      expect(beforeDelete).toBeDefined();

      // 테스트 실행
      const result = await t.mutation(api.profiles.deleteProfile, { profileId });

      // 검증
      expect(result).toEqual({ success: true });

      const afterDelete = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });
      expect(afterDelete).toBeNull();
    });

    test('approveProfile - should approve profile successfully', async () => {
      // 테스트 데이터 준비
      const now = Date.now();

      const [userId, approverUserId] = await t.run(async (ctx: any) => {
        const user = await ctx.db.insert('users', {
          email: 'approve@example.com',
          name: 'Approve User',
        });
        const approver = await ctx.db.insert('users', {
          email: 'approver@example.com',
          name: 'Approver',
        });
        return [user, approver];
      });

      const [profileId, approverId] = await t.run(async (ctx: any) => {
        const profile = await ctx.db.insert('profiles', {
          userId,
          email: 'approve@example.com',
          name: 'Approve User',
          role: 'kol',
          status: 'pending',
          shop_name: 'Approve Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        const approver = await ctx.db.insert('profiles', {
          userId: approverUserId,
          email: 'approver@example.com',
          name: 'Approver',
          role: 'admin',
          status: 'approved',
          shop_name: 'Admin Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        return [profile, approver];
      });

      // 테스트 실행
      const result = await t.mutation(api.profiles.approveProfile, {
        profileId,
        approved: true,
        approvedBy: approverId,
        commission_rate: 0.12,
      });

      // 검증
      expect(result).toEqual({ success: true });

      const approvedProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });

      expect(approvedProfile).toMatchObject({
        status: 'approved',
        approved_by: approverId,
        commission_rate: 0.12,
      });
      expect(approvedProfile?.approved_at).toBeGreaterThanOrEqual(now);
      expect(approvedProfile?.updated_at).toBeGreaterThanOrEqual(now);
    });

    test('approveProfile - should reject profile successfully', async () => {
      // 테스트 데이터 준비
      const now = Date.now();

      const [userId, approverUserId] = await t.run(async (ctx: any) => {
        const user = await ctx.db.insert('users', {
          email: 'reject@example.com',
          name: 'Reject User',
        });
        const approver = await ctx.db.insert('users', {
          email: 'rejector@example.com',
          name: 'Rejector',
        });
        return [user, approver];
      });

      const [profileId, approverId] = await t.run(async (ctx: any) => {
        const profile = await ctx.db.insert('profiles', {
          userId,
          email: 'reject@example.com',
          name: 'Reject User',
          role: 'shop_owner',
          status: 'pending',
          shop_name: 'Reject Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        const approver = await ctx.db.insert('profiles', {
          userId: approverUserId,
          email: 'rejector@example.com',
          name: 'Rejector',
          role: 'admin',
          status: 'approved',
          shop_name: 'Admin Shop',
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: now,
          updated_at: now,
        });

        return [profile, approver];
      });

      // 테스트 실행
      const result = await t.mutation(api.profiles.approveProfile, {
        profileId,
        approved: false,
        approvedBy: approverId,
      });

      // 검증
      expect(result).toEqual({ success: true });

      const rejectedProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });

      expect(rejectedProfile).toMatchObject({
        status: 'rejected',
        approved_by: approverId,
      });
      expect(rejectedProfile?.approved_at).toBeUndefined();
      expect(rejectedProfile?.updated_at).toBeGreaterThanOrEqual(now);
    });
  });
});
