import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET } from '../../../app/api/users/[userId]/route';

// Supabase 모킹
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  rpc: vi.fn(),
};

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}));

describe('/api/users/[userId] - GET', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('인증 및 권한 테스트', () => {
    it('인증되지 않은 사용자는 401을 반환해야 함', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/test-id',
      });

      const response = await GET(req as any, { params: { userId: 'test-id' } });
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('admin이 아닌 사용자는 403을 반환해야 함', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'kol' }, // admin이 아님
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/test-id',
      });

      const response = await GET(req as any, { params: { userId: 'test-id' } });
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });
  });

  describe('사용자 조회 테스트', () => {
    beforeEach(() => {
      // Admin 사용자로 설정
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });
    });

    it('유효한 사용자 ID로 성공적으로 조회해야 함', async () => {
      const mockUserData = {
        id: 'test-user-id',
        name: '테스트 사용자',
        email: 'test@example.com',
        role: 'kol',
        status: 'approved',
        shop_name: '테스트 상점',
        region: '서울',
        commission_rate: 10,
        created_at: new Date().toISOString(),
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/test-user-id',
      });

      const response = await GET(req as any, { params: { userId: 'test-user-id' } });
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserData);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_user_detail', {
        user_id: 'test-user-id',
      });
    });

    it('존재하지 않는 사용자 ID로 404를 반환해야 함', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/nonexistent-id',
      });

      const response = await GET(req as any, { params: { userId: 'nonexistent-id' } });
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('유효하지 않은 UUID 형식으로 400을 반환해야 함', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/invalid-uuid',
      });

      const response = await GET(req as any, { params: { userId: 'invalid-uuid' } });
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toContainEqual(
        expect.objectContaining({
          message: '유효하지 않은 사용자 ID 형식입니다',
        })
      );
    });

    it('데이터베이스 에러 시 500을 반환해야 함', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/test-user-id',
      });

      const response = await GET(req as any, { params: { userId: 'test-user-id' } });
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database operation failed');
    });
  });

  describe('응답 형식 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });
    });

    it('성공 응답이 올바른 구조를 가져야 함', async () => {
      const mockUserData = {
        id: 'test-user-id',
        name: '테스트 사용자',
        email: 'test@example.com',
        role: 'kol',
        status: 'approved',
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockUserData,
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/test-user-id',
      });

      const response = await GET(req as any, { params: { userId: 'test-user-id' } });
      const result = await response.json();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('user_id');
      expect(result.meta).toHaveProperty('retrieved_at');
    });

    it('실패 응답이 올바른 구조를 가져야 함', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/test-user-id',
      });

      const response = await GET(req as any, { params: { userId: 'test-user-id' } });
      const result = await response.json();

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    });
  });
}); 