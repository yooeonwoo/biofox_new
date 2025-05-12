/**
 * Clerk Direct API Client
 * Next.js 15와 Clerk 호환성 문제를 해결하기 위한 직접 API 호출 구현
 */

// Clerk API 설정
const CLERK_API_BASE = 'https://api.clerk.dev/v1';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// 공통 헤더 설정
const getHeaders = () => {
  return {
    'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
};

// API 요청 유틸리티 함수
async function makeRequest(url: string, options: RequestInit = {}) {
  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY 환경 변수가 설정되지 않았습니다.');
  }

  const fullUrl = `${CLERK_API_BASE}${url}`;
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Clerk API 오류: ${response.status} ${response.statusText} - ${
          errorData.message || JSON.stringify(errorData)
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Clerk API 요청 실패:', error);
    throw error;
  }
}

/**
 * 사용자 목록을 조회합니다
 * @param limit 최대 사용자 수
 * @param offset 시작 오프셋
 */
export async function getUserList(limit = 10, offset = 0) {
  return makeRequest(`/users?limit=${limit}&offset=${offset}`);
}

/**
 * 특정 사용자 정보를 조회합니다
 * @param userId 사용자 ID
 */
export async function getUser(userId: string) {
  return makeRequest(`/users/${userId}`);
}

/**
 * 새 사용자를 생성합니다
 * @param userData 사용자 데이터
 */
export async function createUser(userData: {
  email_address: string[];
  password: string;
  first_name?: string;
  last_name?: string;
  public_metadata?: Record<string, any>;
}) {
  return makeRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * 사용자 메타데이터를 업데이트합니다
 * @param userId 사용자 ID
 * @param metadata 메타데이터
 */
export async function updateUserMetadata(userId: string, metadata: {
  public_metadata?: Record<string, any>;
  private_metadata?: Record<string, any>;
}) {
  return makeRequest(`/users/${userId}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify(metadata),
  });
}

/**
 * 사용자를 삭제합니다
 * @param userId 사용자 ID
 */
export async function deleteUser(userId: string) {
  return makeRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
}

/**
 * 세션 정보를 조회합니다
 * @param sessionId 세션 ID
 */
export async function getSession(sessionId: string) {
  return makeRequest(`/sessions/${sessionId}`);
}

/**
 * 현재 활성 세션 목록을 조회합니다
 * @param limit 최대 세션 수
 */
export async function getActiveSessions(limit = 10) {
  return makeRequest(`/sessions?limit=${limit}`);
}

/**
 * JWT 토큰 검증
 * @param token JWT 토큰
 */
export async function verifyToken(token: string) {
  return makeRequest('/tokens/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

/**
 * 사용자 역할 조회
 * @param userId 사용자 ID
 */
export async function getUserRole(userId: string) {
  const user = await getUser(userId);
  return user?.public_metadata?.role || null;
}

export default {
  getUserList,
  getUser,
  createUser,
  updateUserMetadata,
  deleteUser,
  getSession,
  getActiveSessions,
  verifyToken,
  getUserRole,
}; 