import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST } from '../../../app/api/users/bulk-action/route';

// Supabase 모킹
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    admin: {
      deleteUser: vi.fn(),
    },
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(),
  })),
  rpc: vi.fn(),
};

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}));

describe('/api/users/bulk-action - POST', () => {
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
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['test-id'],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('admin이 아닌 사용자는 403을 반환해야 함', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'kol', name: 'Test User' },
        error: null,
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['test-id'],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(403);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });
  });

  describe('입력 검증 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin', name: 'Admin User' },
        error: null,
      });
    });

    it('빈 사용자 배열은 400을 반환해야 함', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: [],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('유효하지 않은 UUID는 400을 반환해야 함', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['invalid-uuid'],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('100명 초과 사용자는 400을 반환해야 함', async () => {
      const userIds = Array.from({ length: 101 }, (_, i) => 
        `550e8400-e29b-41d4-a716-44665544000${i.toString().padStart(1, '0')}`
      );

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: userIds,
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('유효하지 않은 액션은 400을 반환해야 함', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
          action: 'invalid_action',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('change_role 액션에서 역할 누락 시 400을 반환해야 함', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
          action: 'change_role',
          // data.role 누락
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Role is required for role change action');
    });
  });

  describe('자기 자신 삭제 방지 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin', name: 'Admin User' },
        error: null,
      });
    });

    it('자기 자신을 삭제하려 하면 400을 반환해야 함', async () => {
      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['admin-id'],
          action: 'delete',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete yourself');
    });
  });

  describe('액션별 성공 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin', name: 'Admin User' },
        error: null,
      });
    });

    it('approve 액션이 성공해야 함', async () => {
      const mockResult = {
        success: true,
        affected: 2,
        results: {
          successful: ['user-1', 'user-2'],
          failed: [],
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('승인 작업이 완료되었습니다');
      expect(result.affected).toBe(2);
      expect(result.results.successful).toHaveLength(2);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('bulk_update_users', {
        user_ids: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
        action_type: 'approve',
        action_data: {},
        current_admin_id: 'admin-id',
      });
    });

    it('reject 액션이 성공해야 함', async () => {
      const mockResult = {
        success: true,
        affected: 1,
        results: {
          successful: ['user-1'],
          failed: [],
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
          action: 'reject',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('거절 작업이 완료되었습니다');
      expect(result.affected).toBe(1);
    });

    it('change_role 액션이 성공해야 함', async () => {
      const mockResult = {
        success: true,
        affected: 1,
        results: {
          successful: ['user-1'],
          failed: [],
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
          action: 'change_role',
          data: { role: 'kol' },
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('역할 변경 작업이 완료되었습니다');
      expect(result.meta.role_changed_to).toBe('KOL');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('bulk_update_users', {
        user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
        action_type: 'change_role',
        action_data: { role: 'kol' },
        current_admin_id: 'admin-id',
      });
    });

    it('delete 액션이 성공하고 Auth 사용자도 삭제해야 함', async () => {
      const mockResult = {
        success: true,
        affected: 1,
        results: {
          successful: ['user-1'],
          failed: [],
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null });
      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
          action: 'delete',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('삭제 작업이 완료되었습니다');
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('부분 성공 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin', name: 'Admin User' },
        error: null,
      });
    });

    it('일부 성공, 일부 실패 시 올바른 결과를 반환해야 함', async () => {
      const mockResult = {
        success: true,
        affected: 1,
        results: {
          successful: ['user-1'],
          failed: [
            { id: 'user-2', error: 'User not found' },
          ],
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.affected).toBe(1);
      expect(result.results.successful).toHaveLength(1);
      expect(result.results.failed).toHaveLength(1);
      expect(result.results.failed[0]).toEqual({
        id: 'user-2',
        error: 'User not found',
      });
    });
  });

  describe('데이터베이스 에러 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin', name: 'Admin User' },
        error: null,
      });
    });

    it('RPC 에러 시 500을 반환해야 함', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database operation failed');
    });

    it('RPC 함수가 실패를 반환하면 500을 반환해야 함', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          success: false,
          error: 'Internal RPC error',
        },
        error: null,
      });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001'],
          action: 'approve',
        },
      });

      const response = await POST(req as any);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal RPC error');
    });
  });

  describe('감사 로그 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin', name: 'Admin User' },
        error: null,
      });
    });

    it('성공한 작업에 대해 감사 로그가 생성되어야 함', async () => {
      const mockResult = {
        success: true,
        affected: 2,
        results: {
          successful: ['user-1', 'user-2'],
          failed: [],
        },
      };

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null,
      });

      mockSupabase.from().insert.mockResolvedValue({ error: null });

      const { req } = createMocks({
        method: 'POST',
        url: '/api/users/bulk-action',
        body: {
          user_ids: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
          action: 'approve',
        },
      });

      await POST(req as any);

      expect(mockSupabase.from().insert).toHaveBeenCalledTimes(2); // 각 성공한 사용자마다 한 번씩
    });
  });
}); 