import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, HEAD } from '../../../app/api/users/export/route';

// Supabase 모킹
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        or: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({})),
            })),
          })),
          order: vi.fn(() => ({})),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({})),
          })),
          order: vi.fn(() => ({})),
        })),
        lte: vi.fn(() => ({
          order: vi.fn(() => ({})),
        })),
        order: vi.fn(() => ({})),
      })),
      or: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => ({})),
            })),
          })),
          order: vi.fn(() => ({})),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({})),
          })),
        })),
        order: vi.fn(() => ({})),
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          order: vi.fn(() => ({})),
        })),
        order: vi.fn(() => ({})),
      })),
      lte: vi.fn(() => ({
        order: vi.fn(() => ({})),
      })),
      order: vi.fn(() => ({})),
    })),
  })),
};

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({})),
}));

// CSV 모킹
vi.mock('csv-stringify/sync', () => ({
  stringify: vi.fn((data) => {
    // 간단한 CSV 생성 시뮬레이션
    return data.map((row: any[]) => row.join(',')).join('\n');
  }),
}));

describe('/api/users/export', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('GET - CSV 내보내기', () => {
    describe('인증 및 권한 테스트', () => {
      it('인증되지 않은 사용자는 401을 반환해야 함', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        });

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export',
        });

        const response = await GET(req as any);
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
          data: { role: 'kol' },
          error: null,
        });

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export',
        });

        const response = await GET(req as any);
        const result = await response.json();

        expect(response.status).toBe(403);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Insufficient permissions');
      });
    });

    describe('성공적인 내보내기 테스트', () => {
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

      it('기본 내보내기가 성공해야 함', async () => {
        const mockUsers = [
          {
            id: 'user-1',
            name: '테스트 사용자 1',
            email: 'test1@example.com',
            role: 'kol',
            status: 'approved',
            shop_name: '테스트 상점 1',
            region: '서울',
            commission_rate: 10,
            total_subordinates: 5,
            active_subordinates: 3,
            naver_place_link: 'https://place.naver.com/test1',
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'user-2',
            name: '테스트 사용자 2',
            email: 'test2@example.com',
            role: 'shop_owner',
            status: 'pending',
            shop_name: '테스트 상점 2',
            region: '부산',
            commission_rate: null,
            total_subordinates: null,
            active_subordinates: null,
            naver_place_link: null,
            approved_at: null,
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ];

        // 체이닝 메서드 모킹 설정
        const mockChain = {
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export',
        });

        const response = await GET(req as any);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv;charset=utf-8');
        expect(response.headers.get('Content-Disposition')).toMatch(/attachment; filename="users_export_/);
        expect(response.headers.get('X-Export-Count')).toBe('2');
      });

      it('필터가 적용된 내보내기가 성공해야 함', async () => {
        const mockUsers = [
          {
            id: 'user-1',
            name: '테스트 KOL',
            email: 'kol@example.com',
            role: 'kol',
            status: 'approved',
            shop_name: '테스트 상점',
            region: '서울',
            commission_rate: 10,
            total_subordinates: 5,
            active_subordinates: 3,
            naver_place_link: null,
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        const mockChain = {
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockUsers,
                error: null,
              }),
            }),
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export?role=kol&search=테스트&status=approved',
        });

        const response = await GET(req as any);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Disposition')).toMatch(/status-approved_role-kol_search-테스트/);
      });

      it('빈 결과에 대해 404를 반환해야 함', async () => {
        const mockChain = {
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export',
        });

        const response = await GET(req as any);
        const result = await response.json();

        expect(response.status).toBe(404);
        expect(result.success).toBe(false);
        expect(result.error).toBe('No users found to export');
      });
    });

    describe('CSV 형식 테스트', () => {
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

      it('CSV가 UTF-8 BOM을 포함해야 함', async () => {
        const mockUsers = [
          {
            id: 'user-1',
            name: '한글 사용자',
            email: 'test@example.com',
            role: 'kol',
            status: 'approved',
            shop_name: '한글 상점',
            region: '서울',
            commission_rate: 10,
            total_subordinates: 0,
            active_subordinates: 0,
            naver_place_link: null,
            approved_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];

        const mockChain = {
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export',
        });

        const response = await GET(req as any);
        const csvContent = await response.text();

        // UTF-8 BOM 확인
        expect(csvContent.charCodeAt(0)).toBe(0xFEFF);
      });

      it('한국어 컬럼 헤더가 포함되어야 함', async () => {
        const mockUsers = [
          {
            id: 'user-1',
            name: '테스트',
            email: 'test@example.com',
            role: 'kol',
            status: 'approved',
            shop_name: '상점',
            region: '서울',
            commission_rate: 10,
            total_subordinates: 0,
            active_subordinates: 0,
            naver_place_link: null,
            approved_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: null,
          },
        ];

        const mockChain = {
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export',
        });

        const response = await GET(req as any);
        const csvContent = await response.text();

        // 한국어 헤더 확인
        expect(csvContent).toContain('ID,이름,이메일,역할,상태');
      });
    });

    describe('에러 처리 테스트', () => {
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

      it('데이터베이스 에러 시 500을 반환해야 함', async () => {
        const mockChain = {
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection failed'),
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'GET',
          url: '/api/users/export',
        });

        const response = await GET(req as any);
        const result = await response.json();

        expect(response.status).toBe(500);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to fetch user data');
      });
    });
  });

  describe('HEAD - 내보내기 미리보기', () => {
    describe('성공적인 미리보기 테스트', () => {
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

      it('HEAD 요청이 카운트를 반환해야 함', async () => {
        const mockChain = {
          order: vi.fn().mockResolvedValue({
            count: 150,
            error: null,
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'HEAD',
          url: '/api/users/export',
        });

        const response = await HEAD(req as any);

        expect(response.status).toBe(200);
        expect(response.headers.get('X-Export-Count')).toBe('150');
        expect(response.headers.get('X-Export-Timestamp')).toBeTruthy();
      });

      it('필터가 적용된 HEAD 요청이 성공해야 함', async () => {
        const mockChain = {
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({
              count: 25,
              error: null,
            }),
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'HEAD',
          url: '/api/users/export?role=kol&status=approved',
        });

        const response = await HEAD(req as any);

        expect(response.status).toBe(200);
        expect(response.headers.get('X-Export-Count')).toBe('25');
      });
    });

    describe('HEAD 에러 처리 테스트', () => {
      it('인증되지 않은 HEAD 요청은 401을 반환해야 함', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        });

        const { req } = createMocks({
          method: 'HEAD',
          url: '/api/users/export',
        });

        const response = await HEAD(req as any);

        expect(response.status).toBe(401);
      });

      it('admin이 아닌 사용자의 HEAD 요청은 403을 반환해야 함', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null,
        });

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { role: 'kol' },
          error: null,
        });

        const { req } = createMocks({
          method: 'HEAD',
          url: '/api/users/export',
        });

        const response = await HEAD(req as any);

        expect(response.status).toBe(403);
      });

      it('카운트 에러 시 500을 반환해야 함', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: 'admin-id' } },
          error: null,
        });

        mockSupabase.from().select().eq().single.mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        });

        const mockChain = {
          order: vi.fn().mockResolvedValue({
            count: null,
            error: new Error('Count failed'),
          }),
        };

        mockSupabase.from().select.mockReturnValue(mockChain);

        const { req } = createMocks({
          method: 'HEAD',
          url: '/api/users/export',
        });

        const response = await HEAD(req as any);

        expect(response.status).toBe(500);
      });
    });
  });

  describe('파일명 생성 테스트', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      const mockUsers = [
        {
          id: 'user-1',
          name: '테스트',
          email: 'test@example.com',
          role: 'kol',
          status: 'approved',
          shop_name: '상점',
          region: '서울',
          commission_rate: 10,
          total_subordinates: 0,
          active_subordinates: 0,
          naver_place_link: null,
          approved_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: null,
        },
      ];

      const mockChain = {
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
          }),
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);
    });

    it('기본 파일명 형식이 올바르게 생성되어야 함', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/export',
      });

      const response = await GET(req as any);
      const contentDisposition = response.headers.get('Content-Disposition');

      expect(contentDisposition).toMatch(/filename="users_export_\d{4}-\d{2}-\d{2}_\d{4}\.csv"/);
    });

    it('필터가 포함된 파일명이 올바르게 생성되어야 함', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/users/export?status=approved&role=kol',
      });

      const response = await GET(req as any);
      const contentDisposition = response.headers.get('Content-Disposition');

      expect(contentDisposition).toMatch(/status-approved/);
      expect(contentDisposition).toMatch(/role-kol/);
    });
  });
}); 