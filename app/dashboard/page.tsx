import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = {
  title: "대시보드 - BIOFOX KOL",
  description: "BIOFOX KOL 대시보드",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full card-gradient p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">리다이렉트 중...</h1>
        <p className="text-gray-700 mb-6">
          사용자 역할에 따라 자동으로 리다이렉트됩니다. 이 페이지가 계속 보인다면 미들웨어 설정을 확인해주세요.
        </p>
        <div className="flex justify-center">
          <Link 
            href="/" 
            className="btn-secondary"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
} 