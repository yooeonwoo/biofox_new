"use client";

/**
 * 사용자 목록 테이블 컴포넌트
 * 
 * 이 컴포넌트는 다음 기능을 제공합니다:
 * 1. 사용자 목록 조회 및 표시
 * 2. 역할별 필터링
 * 3. 사용자 삭제
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 사용자 인터페이스 정의
interface IUser {
  id: string;
  email: string;
  firstName: string;
  role: string;
  createdAt: string;
}

export default function UserTable() {
  const router = useRouter();
  const [users, setUsers] = useState<IUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // 새로운 API 엔드포인트 사용
      const response = await fetch("/api/admin/users-backend");
      
      if (!response.ok) {
        throw new Error("사용자 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용자 목록을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 목록 조회
  useEffect(() => {
    fetchUsers();
  }, []);

  // 역할 필터 변경 시 필터링된 사용자 목록 업데이트
  useEffect(() => {
    if (roleFilter === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === roleFilter));
    }
  }, [roleFilter, users]);

  // 사용자 삭제 처리
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(userId);

    try {
      // 새로운 API 엔드포인트 사용
      const response = await fetch(`/api/admin/users-backend?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "사용자 삭제에 실패했습니다.");
      }

      // 성공 시 목록에서 제거
      setUsers(users.filter(user => user.id !== userId));
      // 테이블 새로고침을 위해 라우터 새로고침
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "사용자 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* 필터링 컨트롤 */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <label htmlFor="roleFilter" className="mr-2 text-sm font-medium text-gray-700">
            역할 필터:
          </label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">전체</option>
            <option value="본사관리자">본사관리자</option>
            <option value="kol">KOL</option>
          </select>
        </div>
        <button
          onClick={() => fetchUsers()}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          새로고침
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {/* 사용자 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이메일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                역할
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                가입일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  사용자가 없습니다.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.firstName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "본사관리자" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isDeleting === user.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {isDeleting === user.id ? "삭제 중..." : "삭제"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 