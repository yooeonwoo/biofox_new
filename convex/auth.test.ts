import { convexTest } from 'convex-test';
import { expect, test, describe, beforeEach } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

describe('Auth Functions', () => {
  let t: any;

  beforeEach(async () => {
    t = convexTest(schema);
  });

  describe('ensureUserProfile', () => {
    test('should create new profile when user does not exist', async () => {
      // 인증된 사용자로 테스트 (withIdentity 사용)
      const asAuthenticatedUser = t.withIdentity({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'test-user-id',
      });

      // 테스트 데이터 준비
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'newuser@example.com',
          name: 'New User',
        });
      });

      // 테스트 실행
      const profileId = await asAuthenticatedUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: 'newuser@example.com',
        name: 'New User',
        role: 'shop_owner',
        shop_name: 'New Shop',
        region: 'Seoul',
        naver_place_link: 'https://place.naver.com/test',
        commission_rate: 0.1,
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
        role: 'shop_owner',
        status: 'pending',
        shop_name: 'New Shop',
        region: 'Seoul',
        naver_place_link: 'https://place.naver.com/test',
        commission_rate: 0.1,
        total_subordinates: 0,
        active_subordinates: 0,
      });
      expect(createdProfile?.metadata).toEqual({});
      expect(createdProfile?.created_at).toBeDefined();
      expect(createdProfile?.updated_at).toBeDefined();
    });

    test('should return existing profile ID when user already exists', async () => {
      const asAuthenticatedUser = t.withIdentity({
        name: 'Existing User',
        email: 'existing@example.com',
        subject: 'existing-user-id',
      });

      // 기존 프로필 생성
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'existing@example.com',
          name: 'Existing User',
        });
      });

      const existingProfileId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('profiles', {
          userId,
          email: 'existing@example.com',
          name: 'Existing User',
          role: 'kol',
          status: 'approved',
          shop_name: 'Existing Shop',
          region: 'Busan',
          total_subordinates: 2,
          active_subordinates: 1,
          metadata: { notes: 'existing' },
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // 테스트 실행 - 동일한 userId로 다시 프로필 생성 시도
      const returnedProfileId = await asAuthenticatedUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'shop_owner', // 다른 값이지만 기존 프로필 반환해야 함
        shop_name: 'Different Shop',
      });

      // 검증
      expect(returnedProfileId).toBe(existingProfileId);

      // 기존 프로필이 변경되지 않았는지 확인
      const unchangedProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(existingProfileId);
      });

      expect(unchangedProfile).toMatchObject({
        role: 'kol', // 원래 값 유지
        shop_name: 'Existing Shop', // 원래 값 유지
        status: 'approved',
        total_subordinates: 2,
        active_subordinates: 1,
      });
    });

    test('should use default values when optional fields are not provided', async () => {
      const asAuthenticatedUser = t.withIdentity({
        name: 'Default User',
        email: 'default@example.com',
        subject: 'default-user-id',
      });

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'default@example.com',
          name: 'Default User',
        });
      });

      // 최소한의 필드만 제공
      const profileId = await asAuthenticatedUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: 'default@example.com',
        name: 'Default User',
      });

      // 검증
      const createdProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });

      expect(createdProfile).toMatchObject({
        role: 'shop_owner', // 기본값
        status: 'pending', // 기본값
        shop_name: '매장명 미입력', // 기본값
        total_subordinates: 0,
        active_subordinates: 0,
      });
      expect(createdProfile?.region).toBeUndefined();
      expect(createdProfile?.naver_place_link).toBeUndefined();
      expect(createdProfile?.commission_rate).toBeUndefined();
    });

    test('should throw error when not authenticated', async () => {
      // 인증되지 않은 상태로 테스트
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'unauthenticated@example.com',
          name: 'Unauthenticated User',
        });
      });

      // 테스트 실행 및 검증
      await expect(async () => {
        await t.mutation(api.auth.ensureUserProfile, {
          userId,
          email: 'unauthenticated@example.com',
          name: 'Unauthenticated User',
        });
      }).rejects.toThrowError('Not authenticated');
    });

    test('should throw validation error for invalid data', async () => {
      const asAuthenticatedUser = t.withIdentity({
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

      // 유효하지 않은 이메일로 테스트
      await expect(async () => {
        await asAuthenticatedUser.mutation(api.auth.ensureUserProfile, {
          userId,
          email: 'invalid-email', // 잘못된 이메일 형식
          name: 'Invalid User',
        });
      }).rejects.toThrowError(/Validation failed/);

      // 빈 이름으로 테스트
      await expect(async () => {
        await asAuthenticatedUser.mutation(api.auth.ensureUserProfile, {
          userId,
          email: 'valid@example.com',
          name: '', // 빈 이름
        });
      }).rejects.toThrowError(/Validation failed/);
    });
  });

  describe('getProfileCompleteness', () => {
    test('should return null for non-existent user', async () => {
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'nonexistent@example.com',
          name: 'Non-existent User',
        });
      });

      // 프로필이 없는 사용자로 테스트
      const completeness = await t.query(api.auth.getProfileCompleteness, { userId });

      expect(completeness).toBeNull();
    });

    test('should return complete profile information', async () => {
      // 완전한 프로필 생성
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'complete@example.com',
          name: 'Complete User',
        });
      });

      await t.run(async (ctx: any) => {
        await ctx.db.insert('profiles', {
          userId,
          email: 'complete@example.com',
          name: 'Complete User',
          role: 'kol',
          status: 'approved',
          shop_name: 'Complete Shop',
          region: 'Seoul', // 필수 필드
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // 테스트 실행
      const completeness = await t.query(api.auth.getProfileCompleteness, { userId });

      // 검증
      expect(completeness).toMatchObject({
        isComplete: true,
        missingFields: [],
        completionPercentage: 100,
      });
    });

    test('should return incomplete profile information with missing fields', async () => {
      // 불완전한 프로필 생성
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'incomplete@example.com',
          name: 'Incomplete User',
        });
      });

      await t.run(async (ctx: any) => {
        await ctx.db.insert('profiles', {
          userId,
          email: 'incomplete@example.com',
          name: 'Incomplete User',
          role: 'shop_owner',
          status: 'pending',
          shop_name: '', // 빈 값 (누락으로 간주)
          // region 필드 누락
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // 테스트 실행
      const completeness = await t.query(api.auth.getProfileCompleteness, { userId });

      // 검증
      expect(completeness).toMatchObject({
        isComplete: false,
        missingFields: ['shop_name', 'region'], // 빈 값과 누락 필드
      });
      expect(completeness?.completionPercentage).toBeLessThan(100);
      expect(completeness?.completionPercentage).toBeGreaterThan(0);
    });

    test('should calculate correct completion percentage', async () => {
      // 50% 완성된 프로필 생성 (3개 필수 필드 중 1개만 완성)
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'partial@example.com',
          name: 'Partial User',
        });
      });

      await t.run(async (ctx: any) => {
        await ctx.db.insert('profiles', {
          userId,
          email: 'partial@example.com',
          name: 'Partial User', // 완성
          role: 'ol',
          status: 'pending',
          shop_name: '', // 누락
          // region 필드 완전 누락
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // 테스트 실행
      const completeness = await t.query(api.auth.getProfileCompleteness, { userId });

      // 검증 (3개 필수 필드 중 1개 완성 = 33%)
      expect(completeness).toMatchObject({
        isComplete: false,
        missingFields: ['shop_name', 'region'],
      });
      expect(completeness?.completionPercentage).toBe(33); // Math.round((3-2)/3 * 100)
    });

    test('should handle profile with all required fields but some optional fields missing', async () => {
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'required@example.com',
          name: 'Required User',
        });
      });

      await t.run(async (ctx: any) => {
        await ctx.db.insert('profiles', {
          userId,
          email: 'required@example.com',
          name: 'Required User',
          role: 'admin',
          status: 'approved',
          shop_name: 'Required Shop',
          region: 'Daegu',
          // 선택적 필드들은 누락
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      // 테스트 실행
      const completeness = await t.query(api.auth.getProfileCompleteness, { userId });

      // 검증 - 필수 필드가 모두 있으면 완료로 간주
      expect(completeness).toMatchObject({
        isComplete: true,
        missingFields: [],
        completionPercentage: 100,
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('ensureUserProfile should handle special characters in shop name', async () => {
      const asAuthenticatedUser = t.withIdentity({
        name: 'Special User',
        email: 'special@example.com',
        subject: 'special-user-id',
      });

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'special@example.com',
          name: 'Special User',
        });
      });

      // 특수 문자가 포함된 매장명으로 테스트
      const profileId = await asAuthenticatedUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: 'special@example.com',
        name: 'Special User',
        shop_name: '헬로&월드 매장 (강남점) #1',
      });

      const createdProfile = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId);
      });

      expect(createdProfile?.shop_name).toBe('헬로&월드 매장 (강남점) #1');
    });

    test('ensureUserProfile should handle edge case commission rates', async () => {
      const asAuthenticatedUser = t.withIdentity({
        name: 'Commission User',
        email: 'commission@example.com',
        subject: 'commission-user-id',
      });

      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'commission@example.com',
          name: 'Commission User',
        });
      });

      // 0% 수수료로 테스트
      const profileId1 = await asAuthenticatedUser.mutation(api.auth.ensureUserProfile, {
        userId,
        email: 'commission@example.com',
        name: 'Commission User',
        commission_rate: 0,
      });

      const profile1 = await t.run(async (ctx: any) => {
        return await ctx.db.get(profileId1);
      });

      expect(profile1?.commission_rate).toBe(0);
    });

    test('getProfileCompleteness should handle profiles with null/undefined values correctly', async () => {
      const userId = await t.run(async (ctx: any) => {
        return await ctx.db.insert('users', {
          email: 'null@example.com',
          name: 'Null User',
        });
      });

      await t.run(async (ctx: any) => {
        await ctx.db.insert('profiles', {
          userId,
          email: 'null@example.com',
          name: 'Null User',
          role: 'kol',
          status: 'pending',
          shop_name: 'Valid Shop',
          region: undefined, // undefined 값
          total_subordinates: 0,
          active_subordinates: 0,
          metadata: {},
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      });

      const completeness = await t.query(api.auth.getProfileCompleteness, { userId });

      expect(completeness?.missingFields).toContain('region');
      expect(completeness?.isComplete).toBe(false);
    });
  });
});
