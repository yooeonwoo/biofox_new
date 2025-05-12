/**
 * Clerk API 클라이언트 초기화
 * Next.js 15 호환성 문제로 직접 API 호출 방식으로 대체
 */
import directClerkApi from './clerk-direct-api';

// 타입을 맞추기 위한 클라이언트 래퍼
export const clerkClient = {
  users: {
    // 직접 API 클라이언트 메소드 매핑
    getUserList: async (options: any = {}) => {
      const limit = options?.limit || 10;
      const offset = options?.offset || 0;
      return directClerkApi.getUserList(limit, offset);
    },
    getUser: async (userId: string) => {
      return directClerkApi.getUser(userId);
    },
    createUser: async (userData: any) => {
      return directClerkApi.createUser({
        email_address: Array.isArray(userData.emailAddress) ? userData.emailAddress[0] : userData.emailAddress,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName
      });
    },
    updateUserMetadata: async (userId: string, metadata: any) => {
      return directClerkApi.updateUserMetadata(userId, metadata);
    },
    deleteUser: async (userId: string) => {
      return directClerkApi.deleteUser(userId);
    }
  },
  sessions: {
    getSessionList: async (options: any = {}) => {
      const limit = options?.limit || 10;
      return directClerkApi.getActiveSessions(limit);
    },
    getSession: async (sessionId: string) => {
      return directClerkApi.getSession(sessionId);
    }
  },
  verifyToken: async (token: string) => {
    return directClerkApi.verifyToken(token);
  }
};

// 직접 호출 API도 함께 내보내기
export const directApiClient = directClerkApi;