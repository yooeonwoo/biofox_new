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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// 사용자 인터페이스 정의
interface IUser {
  id: string;
  email: string;
  firstName: string;
  role: string;
  createdAt: string;
}

// 사용자 카드 컴포넌트
function UserCard({ user, onDelete }: { user: IUser; onDelete: (id: string) => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return;
    setIsDeleting(true);
    await onDelete(user.id);
    setIsDeleting(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base font-medium">{user.firstName}</CardTitle>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <Badge variant={user.role === "본사관리자" ? "default" : "secondary"}>
            {user.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {new Date(user.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "삭제"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
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
    setIsDeleting(userId);

    try {
      const response = await fetch(`/api/admin/users-backend?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "사용자 삭제에 실패했습니다.");
      }

      setUsers(users.filter(user => user.id !== userId));
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "사용자 삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      {/* 필터링 컨트롤 */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="역할 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="본사관리자">본사관리자</SelectItem>
              <SelectItem value="kol">KOL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={fetchUsers}
          className="w-full md:w-auto"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "새로고침"
          )}
        </Button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-md">{error}</div>
      )}

      {/* 데스크톱 테이블 뷰 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
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
                <td colSpan={5} className="px-6 py-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.role === "본사관리자" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={isDeleting === user.id}
                    >
                      {isDeleting === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "삭제"
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="md:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            사용자가 없습니다.
          </div>
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onDelete={handleDeleteUser}
            />
          ))
        )}
      </div>
    </div>
  );
} 