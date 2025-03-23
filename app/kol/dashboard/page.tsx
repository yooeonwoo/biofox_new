import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = {
  title: "KOL 대시보드 - BIOFOX KOL",
  description: "BIOFOX KOL 대시보드",
};

export default function KolDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-aurora-pink">KOL 대시보드</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-aurora-pink">
              홈
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-gradient p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">KOL 페이지</h2>
          <p className="text-gray-700">
            KOL로 로그인하셨습니다. 이 페이지는 'kol' 역할을 가진 사용자만 접근할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">내 프로필</h3>
            <p className="text-gray-600 mb-4">KOL 프로필 정보 및 수정</p>
            <button className="btn-primary w-full">프로필 관리</button>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">연결된 전문점</h3>
            <p className="text-gray-600 mb-4">나와 연결된 전문점 정보 확인</p>
            <button className="btn-primary w-full">전문점 확인</button>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">실적 조회</h3>
            <p className="text-gray-600 mb-4">나의 실적 및 성과 확인</p>
            <button className="btn-primary w-full">실적 보기</button>
          </div>
        </div>
      </main>
    </div>
  );
} 