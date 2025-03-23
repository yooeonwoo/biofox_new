import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export const metadata = {
  title: "관리자 대시보드 - BIOFOX KOL",
  description: "BIOFOX KOL 관리자 대시보드",
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-gradient p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">관리자 페이지</h2>
          <p className="text-gray-700">
            관리자로 로그인하셨습니다. 이 페이지는 '본사관리자' 역할을 가진 사용자만 접근할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">KOL 관리</h3>
            <p className="text-gray-600 mb-4">등록된 KOL 현황 및 관리 기능</p>
            <Link href="/admin/kols" className="btn-primary w-full block text-center">KOL 목록 보기</Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">전문점 관리</h3>
            <p className="text-gray-600 mb-4">전문점 정보 및 업데이트 관리</p>
            <Link href="/admin/stores" className="btn-primary w-full block text-center">전문점 관리</Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">통계 분석</h3>
            <p className="text-gray-600 mb-4">판매 실적 및 통계 데이터</p>
            <Link href="/admin/sales" className="btn-primary w-full block text-center">통계 보기</Link>
          </div>
        </div>
      </main>
    </div>
  );
} 