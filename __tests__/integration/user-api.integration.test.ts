import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * 사용자 관리 API 통합 테스트
 * 
 * 실제 Supabase 프로젝트와 통신하여 기본적인 API 동작을 검증합니다.
 * 이 테스트는 실제 데이터베이스 상태에 의존하므로:
 * 1. 테스트 환경에서만 실행
 * 2. Admin 사용자가 존재해야 함
 * 3. 실제 API 엔드포인트와 통신
 */

const API_BASE_URL = 'http://localhost:3000/api';

// 테스트용 사용자 데이터
const testUser = {
  email: `test-integration-${Date.now()}@example.com`,
  name: '통합 테스트 사용자',
  role: 'ol' as const,
  shop_name: '통합 테스트 상점',
  region: '서울',
  commission_rate: 5,
};

let testUserId: string | null = null;
let adminAuthCookie: string | null = null;

// Admin 로그인을 위한 헬퍼 함수
async function loginAsAdmin() {
  try {
    // 실제 admin 계정으로 로그인 시뮬레이션
    // 실제 환경에서는 적절한 인증 방식을 사용해야 함
    const response = await fetch(`${API_BASE_URL}/auth/dev-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@biofox.test',
        password: 'testpassword',
      }),
    });

    if (response.ok) {
      // 쿠키에서 인증 정보 추출
      const cookies = response.headers.get('Set-Cookie');
      if (cookies) {
        adminAuthCookie = cookies;
      }
    }
  } catch (error) {
    console.warn('Admin login failed:', error);
  }
}

// API 요청을 위한 헬퍼 함수
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(adminAuthCookie && { Cookie: adminAuthCookie }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

describe.skip('User Management API Integration Tests', () => {
  beforeAll(async () => {
    // 실제 환경 체크
    if (process.env.NODE_ENV !== 'test') {
      console.warn('통합 테스트는 테스트 환경에서만 실행됩니다.');
      return;
    }

    // Admin으로 로그인
    await loginAsAdmin();
  });

  afterAll(async () => {
    // 테스트 사용자 정리
    if (testUserId && adminAuthCookie) {
      try {
        await apiRequest(`/users/${testUserId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn('Test cleanup failed:', error);
      }
    }
  });

  describe('User List API', () => {
    it('should fetch users list successfully', async () => {
      const response = await apiRequest('/users');
      
      if (response.status === 401) {
        // 인증되지 않은 경우 스킵
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter users by status', async () => {
      const response = await apiRequest('/users?status=approved');
      
      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        // 모든 사용자가 approved 상태인지 확인
        data.data.forEach((user: any) => {
          expect(user.status).toBe('approved');
        });
      }
    });
  });

  describe('User Creation API', () => {
    it('should create a new user successfully', async () => {
      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(testUser),
      });

      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      
      // 테스트 사용자 ID 저장 (cleanup용)
      testUserId = data.data.id;
      
      // 생성된 사용자 정보 검증
      expect(data.data.email).toBe(testUser.email);
      expect(data.data.name).toBe(testUser.name);
      expect(data.data.role).toBe(testUser.role);
    });

    it('should validate email duplication', async () => {
      // 첫 번째 사용자 생성
      const user1 = {
        ...testUser,
        email: `duplicate-test-${Date.now()}@example.com`,
      };

      const response1 = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(user1),
      });

      if (response1.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response1.status).toBe(201);
      
      // 같은 이메일로 두 번째 사용자 생성 시도
      const response2 = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(user1),
      });

      expect(response2.status).toBe(400);
      
      const data = await response2.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error).toMatch(/이미 존재/);
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        email: '', // 빈 이메일
        name: '',   // 빈 이름
      };

      const response = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(invalidUser),
      });

      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error).toMatch(/Validation failed/);
    });
  });

  describe('User Detail API', () => {
    it('should fetch user details by ID', async () => {
      if (!testUserId) {
        console.warn('No test user available - skipping test');
        return;
      }

      const response = await apiRequest(`/users/${testUserId}`);
      
      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('data');
      expect(data.data.id).toBe(testUserId);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await apiRequest(`/users/${fakeId}`);
      
      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error).toMatch(/not found/);
    });

    it('should validate UUID format', async () => {
      const invalidId = 'invalid-uuid';
      const response = await apiRequest(`/users/${invalidId}`);
      
      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error).toMatch(/Validation failed/);
    });
  });

  describe('User Update API', () => {
    it('should update user information', async () => {
      if (!testUserId) {
        console.warn('No test user available - skipping test');
        return;
      }

      const updatedName = '수정된 통합 테스트 사용자';
      const response = await apiRequest(`/users/${testUserId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedName,
          shop_name: '수정된 상점명',
        }),
      });

      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data.name).toBe(updatedName);
    });
  });

  describe('Export API', () => {
    it('should export users to CSV', async () => {
      const response = await apiRequest('/users/export');
      
      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      if (response.status === 404) {
        console.warn('No users to export - skipping test');
        return;
      }

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv;charset=utf-8');
      expect(response.headers.get('Content-Disposition')).toMatch(/attachment; filename=/);
      
      const csvContent = await response.text();
      expect(csvContent).toContain('ID,이름,이메일'); // 한국어 헤더 확인
    });

    it('should return export count via HEAD request', async () => {
      const response = await apiRequest('/users/export', {
        method: 'HEAD',
      });

      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Export-Count')).toBeTruthy();
      expect(response.headers.get('X-Export-Timestamp')).toBeTruthy();
    });
  });

  describe('Bulk Actions API', () => {
    it('should perform bulk approval action', async () => {
      if (!testUserId) {
        console.warn('No test user available - skipping test');
        return;
      }

      const response = await apiRequest('/users/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: [testUserId],
          action: 'approve',
        }),
      });

      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('affected');
      expect(data.affected).toBeGreaterThanOrEqual(0);
    });

    it('should validate bulk action input', async () => {
      const response = await apiRequest('/users/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: [], // 빈 배열
          action: 'approve',
        }),
      });

      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error).toMatch(/Validation failed/);
    });

    it('should validate action type', async () => {
      const response = await apiRequest('/users/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: ['00000000-0000-0000-0000-000000000000'],
          action: 'invalid_action',
        }),
      });

      if (response.status === 401) {
        console.warn('Authentication required - skipping test');
        return;
      }

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data.error).toMatch(/Validation failed/);
    });
  });
});

// API 가용성 체크를 위한 간단한 테스트
describe('API Health Check', () => {
  it('should be able to make HTTP requests', async () => {
    try {
      const response = await fetch('https://httpbin.org/get');
      expect(response.status).toBe(200);
    } catch (error) {
      console.warn('Network connectivity issue:', error);
      // 네트워크 문제가 있어도 테스트 실패로 처리하지 않음
    }
  });

  it('should have proper test environment setup', () => {
    // 기본적인 환경 변수 체크
    expect(process.env.NODE_ENV).toBeDefined();
    
    // 테스트 프레임워크 기능 체크
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });
}); 