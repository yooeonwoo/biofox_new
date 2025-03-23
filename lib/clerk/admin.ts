/**
 * Clerk Admin API 유틸리티 함수
 * 관리자 페이지에서 사용자 관리를 위한 함수들을 제공합니다.
 */
import { clerkClient } from "@clerk/nextjs/server";

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
    // Clerk API를 사용하여 사용자 생성
    const user = await clerkClient.users.createUser({
      emailAddress: [email],
      password,
      firstName,
      lastName,
    });

    // 사용자 메타데이터에 역할 추가
    await clerkClient.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role,
      },
    });

    return user;
  } catch (error) {
    console.error("사용자 생성 실패:", error);
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
    const user = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role,
      },
    });
    return user;
  } catch (error) {
    console.error("사용자 역할 업데이트 실패:", error);
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
    return await clerkClient.users.deleteUser(userId);
  } catch (error) {
    console.error("사용자 삭제 실패:", error);
    throw error;
  }
}

/**
 * 모든 사용자를 조회합니다
 * @returns 사용자 목록
 */
export async function getAllUsers() {
  try {
    const users = await clerkClient.users.getUserList();
    return users;
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
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
    const users = await clerkClient.users.getUserList({
      query: JSON.stringify({ publicMetadata: { role } }),
    });
    return users;
  } catch (error) {
    console.error(`${role} 역할 사용자 목록 조회 실패:`, error);
    throw error;
  }
} 