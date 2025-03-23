"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface WhitelistedEmail {
  id: number;
  email: string;
  role: string;
  created_at: string;
}

export default function WhitelistPage() {
  const [emails, setEmails] = useState<WhitelistedEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [role, setRole] = useState("kol");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  // 이메일 목록 로드
  const loadEmails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/whitelist");
      if (!response.ok) {
        throw new Error("화이트리스트 로드 중 오류 발생");
      }
      const data = await response.json();
      setEmails(data);
    } catch (err) {
      setError("화이트리스트 로드 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadEmails();
  }, []);

  // 이메일 추가
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/whitelist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail, role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이메일 추가 중 오류가 발생했습니다.");
      }

      setSuccessMessage("화이트리스트에 이메일이 추가되었습니다.");
      setNewEmail("");
      loadEmails();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 삭제
  const handleDeleteEmail = async (id: number) => {
    if (!confirm("정말로 이 이메일을 화이트리스트에서 삭제하시겠습니까?")) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/whitelist/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("이메일 삭제 중 오류가 발생했습니다.");
      }

      setSuccessMessage("화이트리스트에서 이메일이 삭제되었습니다.");
      loadEmails();
    } catch (err) {
      setError("이메일 삭제 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">화이트리스트 관리</h1>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 성공 메시지 */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* 이메일 추가 폼 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">화이트리스트 이메일 추가</h2>
        <form onSubmit={handleAddEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="이메일 주소"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              역할
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="kol">KOL</option>
              <option value="본사관리자">본사관리자</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? "처리 중..." : "추가"}
          </button>
        </form>
      </div>

      {/* 이메일 목록 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">화이트리스트 이메일 목록</h2>
        
        {isLoading && <p className="text-gray-500">로딩 중...</p>}
        
        {!isLoading && emails.length === 0 && (
          <p className="text-gray-500">등록된 이메일이 없습니다.</p>
        )}
        
        {emails.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left">이메일</th>
                  <th className="py-2 px-4 text-left">역할</th>
                  <th className="py-2 px-4 text-left">등록일</th>
                  <th className="py-2 px-4 text-left">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emails.map((email) => (
                  <tr key={email.id}>
                    <td className="py-2 px-4">{email.email}</td>
                    <td className="py-2 px-4">{email.role}</td>
                    <td className="py-2 px-4">
                      {new Date(email.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => handleDeleteEmail(email.id)}
                        className="text-red-600 hover:text-red-800"
                        disabled={isLoading}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 