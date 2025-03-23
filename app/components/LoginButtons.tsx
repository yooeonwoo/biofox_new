'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginButtons() {
  const router = useRouter();
  
  const handleLogin = () => {
    router.push('/signin');
  };
  
  const handleSignup = () => {
    router.push('/signup');
  };
  
  return (
    <div className="flex gap-6 items-center flex-col sm:flex-row mb-12">
      <button
        onClick={handleLogin}
        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-biofox-purple text-white gap-2 hover:bg-aurora-violet font-medium text-sm sm:text-base h-12 sm:h-14 px-8 sm:px-10 w-full sm:w-auto"
      >
        로그인
      </button>
      <button
        onClick={handleSignup}
        className="rounded-full border border-solid border-biofox-purple-light transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-12 sm:h-14 px-8 sm:px-10 w-full sm:w-auto"
      >
        회원가입
      </button>
    </div>
  );
} 