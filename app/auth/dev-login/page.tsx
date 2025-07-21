"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function DevLogin() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams]);

  // 로그인 핸들러
  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    // 디버깅용 로그
    console.log("Login attempt - Email:", email, "Password length:", password.length);
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(), // 공백 제거
        password: password,
      });

      if (error) {
        console.error("Login Error Details:", {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        
        // 더 자세한 에러 메시지
        if (error.message === "Invalid login credentials") {
          setError("이메일 또는 비밀번호가 올바르지 않습니다. 이메일 확인을 완료했는지 확인하세요.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("이메일 확인이 필요합니다. 받은 편지함을 확인하세요.");
        } else {
          setError(error.message);
        }
        
        setLoading(false);
        return;
      }

      // 로그인 성공 시 세션 새로고침
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Login Success: Session:", sessionData.session);

      // 관리자 페이지로 리디렉트
      router.push("/biofox-admin");
      router.refresh();
    } catch (err) {
      setError("로그인 처리 중 오류가 발생했습니다.");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">관리자 로그인</h1>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              placeholder="관리자 이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="text-center">
            <a 
              href="/auth/reset-password" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              비밀번호를 잊으셨나요?
            </a>
          </div>
        </div>
        
        {/* 개발 환경 전용 스킵 버튼 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => router.push("/biofox-admin")}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition duration-200"
            >
              🚀 인증 스킵하고 바로 이동 (개발 전용)
            </button>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            개발 환경용 로그인 페이지입니다. 
            Supabase에 등록된 관리자 계정으로 로그인하세요.
          </p>
          <div className="mt-2 text-xs text-yellow-700">
            <p className="font-semibold mb-1">테스트 계정 정보:</p>
            <div className="space-y-1">
              <p>1. 기존 계정:</p>
              <p className="ml-2">• 이메일: dbdjsdn123@naver.com</p>
              <p className="ml-2">• 비밀번호: admin123!</p>
              <hr className="my-1 border-yellow-300" />
              <p>2. 새 테스트 계정 (권장):</p>
              <p className="ml-2">• 이메일: test@biofox.com</p>
              <p className="ml-2">• 비밀번호: Test1234!</p>
              <p className="mt-2 text-xs">※ Supabase 대시보드에서 직접 생성하세요</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}