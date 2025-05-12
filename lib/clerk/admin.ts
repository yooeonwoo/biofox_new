/**
 * Clerk Admin API 유틸리티 함수
 * 관리자 페이지에서 사용자 관리를 위한 함수들을 제공합니다.
 * Next.js 15와 Clerk 호환성 문제로 직접 API 호출 방식으로 구현됩니다.
 */
import clerkApi from "../clerk-direct-api";

// 사용자 데이터 타입 정의
interface ClerkUser {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
  public_metadata?: Record<string, any>;
  private_metadata?: Record<string, any>;
}

/**
 * 새 사용자를 생성합니다
 * @param email 사용자 이메일
 * @param password 비밀번호
 * @param firstName 이름
 * @param lastName 성
 * @param role 역할 (본사관리자 또는 kol)
 * @returns 생성된 사용자 정보
 */
export async function createUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string
) {
  try {
    console.log("Clerk Admin: 사용자 생성 시작", { email, firstName, lastName, role });
    // 직접 API 호출로 사용자 생성 - 생성 시 역할도 함께 설정
    const user = await clerkApi.createUser({
      email_address: [email],
      password,
      first_name: firstName,
      last_name: lastName,
      public_metadata: {
        role,
      },
    });

    console.log("Clerk Admin: 사용자 생성 및 역할 설정 완료:", user.id);
    return user;
  } catch (error) {
    console.error("Clerk Admin: 사용자 생성 실패:", error);
    throw error;
  }
}

/**
 * 사용자 역할을 업데이트합니다
 * @param userId 사용자 ID
 * @param role 역할 (본사관리자 또는 kol)
 * @returns 업데이트된 사용자 정보
 */
export async function updateUserRole(userId: string, role: string) {
  try {
    console.log("Clerk Admin: 사용자 역할 업데이트 시작", { userId, role });
    const user = await clerkApi.updateUserMetadata(userId, {
      public_metadata: {
        role,
      },
    });
    console.log("Clerk Admin: 사용자 역할 업데이트 완료");
    return user;
  } catch (error) {
    console.error("Clerk Admin: 사용자 역할 업데이트 실패:", error);
    throw error;
  }
}

/**
 * 사용자를 삭제합니다
 * @param userId 사용자 ID
 * @returns 삭제 결과
 */
export async function deleteUser(userId: string) {
  try {
    console.log("Clerk Admin: 사용자 삭제 시작", userId);
    const result = await clerkApi.deleteUser(userId);
    console.log("Clerk Admin: 사용자 삭제 완료");
    return result;
  } catch (error) {
    console.error("Clerk Admin: 사용자 삭제 실패:", error);
    throw error;
  }
}

/**
 * 모든 사용자를 조회합니다
 * @returns 사용자 목록
 */
export async function getAllUsers() {
  try {
    console.log("Clerk Admin: 사용자 목록 조회 시작");
    const users = await clerkApi.getUserList(100, 0); // 최대 100명 조회
    console.log(`Clerk Admin: 사용자 목록 조회 완료 (${users.length}명)`);
    return users;
  } catch (error) {
    console.error("Clerk Admin: 사용자 목록 조회 실패:", error);
    throw error;
  }
}

/**
 * 특정 역할을 가진 사용자를 조회합니다
 * @param role 역할 (본사관리자 또는 kol)
 * @returns 해당 역할을 가진 사용자 목록
 */
export async function getUsersByRole(role: string) {
  try {
    console.log(`Clerk Admin: ${role} 역할 사용자 목록 조회 시작`);
    // 모든 사용자를 가져와서 필터링
    const allUsers = await clerkApi.getUserList(100, 0);
    const filteredUsers = allUsers.filter((user: ClerkUser) => 
      user.public_metadata && user.public_metadata.role === role
    );
    console.log(`Clerk Admin: ${role} 역할 사용자 목록 조회 완료 (${filteredUsers.length}명)`);
    return filteredUsers;
  } catch (error) {
    console.error(`Clerk Admin: ${role} 역할 사용자 목록 조회 실패:`, error);
    throw error;
  }
} 