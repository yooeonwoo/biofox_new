"use client";

/**
 * 사용자 등록 폼 컴포넌트
 * 
 * 이 컴포넌트는 다음 기능을 제공합니다:
 * 1. 이메일 입력
 * 2. 성함 입력
 * 3. 역할 선택 (본사관리자/KOL)
 * 4. 사용자 등록 요청 전송
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 상태 관리
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "kol", // 기본값은 KOL
  });

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 필수 필드 검증
      if (!formData.email || !formData.firstName) {
        throw new Error("이메일과 이름은 필수 입력 항목입니다.");
      }

      // 이메일 형식 검증
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("유효한 이메일 주소를 입력해주세요.");
      }

      // 사용자 등록 API 호출
      const response = await fetch("/api/admin/clerk/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "사용자 등록에 실패했습니다.");
      }

      setSuccess(true);
      // 성공 시 폼 초기화
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "kol",
      });

      // 테이블 새로고침을 위해 라우터 새로고침
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "사용자 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 이메일 입력 */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          placeholder="example@biofox.com"
          required
        />
      </div>

      {/* 이름 입력 */}
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
          이름
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          placeholder="홍길동"
          required
        />
      </div>

      {/* 성 입력 (선택사항) */}
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
          성 (선택사항)
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          placeholder="김"
        />
      </div>

      {/* 역할 선택 */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          역할
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="kol">KOL</option>
          <option value="본사관리자">본사관리자</option>
        </select>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="text-red-500 text-sm py-2">{error}</div>
      )}

      {/* 성공 메시지 */}
      {success && (
        <div className="text-green-500 text-sm py-2">
          사용자가 성공적으로 등록되었습니다.
        </div>
      )}

      {/* 제출 버튼 */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isLoading ? "등록 중..." : "사용자 등록"}
        </button>
      </div>
    </form>
  );
} 