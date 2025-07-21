"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPassword() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const handleReset = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setMessage(`에러: ${error.message}`);
        setMessageType("error");
      } else {
        setMessage("비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.");
        setMessageType("success");
        setEmail(""); // 입력 필드 초기화
      }
    } catch (err) {
      setMessage("예상치 못한 오류가 발생했습니다.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">비밀번호 재설정</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="등록된 이메일을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleReset}
            disabled={isLoading || !email}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "전송 중..." : "재설정 이메일 보내기"}
          </button>
          
          {message && (
            <div className={`p-3 rounded-md ${
              messageType === "success" 
                ? "bg-green-50 border border-green-200" 
                : "bg-red-50 border border-red-200"
            }`}>
              <p className={`text-sm ${
                messageType === "success" ? "text-green-600" : "text-red-600"
              }`}>
                {message}
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <a 
            href="/auth/dev-login" 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            로그인 페이지로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}