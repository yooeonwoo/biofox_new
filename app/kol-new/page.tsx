'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Bell, ChevronDown, Search, CoinsIcon, TrendingUp, Store, Wallet, Settings } from "lucide-react";
import SalesChart from "@/components/sales-chart";
import StoreRankingTable from "@/components/store-ranking-table";
import UpcomingTasks from "@/components/upcoming-tasks";

export default function KolNewPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isKol, setIsKol] = useState<boolean | null>(null);

  useEffect(() => {
    // 사용자가 로드되었고 로그인되어 있으면 역할 확인
    if (isLoaded && isSignedIn && user) {
      const userRole = user.publicMetadata?.role as string || "kol";
      setIsKol(userRole === "kol");
    }
  }, [isLoaded, isSignedIn, user]);

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!isLoaded || isKol === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center text-gray-800">로딩 중...</h1>
          <p className="text-center text-gray-600">사용자 정보를 확인하는 중입니다.</p>
        </div>
      </div>
    );
  }

  // KOL이 아닌 경우 홈으로 리다이렉트
  if (!isKol) {
    return redirect('/');
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center border-b px-4 py-2">
        <Link href="#" className="mr-2">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div className="flex items-center font-bold">
          <span className="ml-2">BIOFOX CRM</span>
        </div>
        <div className="mx-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="리드, 세미나, 전문점 검색..."
              className="w-full rounded-md bg-gray-100 py-2 pl-10 pr-4 text-sm"
            />
          </div>
        </div>
        <button className="mr-4">
          <Bell className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex items-center">
          <span className="mr-1 text-sm">아바에 대구</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 border-r">
          <nav className="p-2">
            <Link href="#" className="flex items-center rounded-md px-4 py-3 text-sm hover:bg-gray-100">
              <Bell className="mr-3 h-5 w-5" />
              <span>알림</span>
            </Link>
            <Link href="#" className="flex items-center rounded-md px-4 py-3 text-sm hover:bg-gray-100">
              <Settings className="mr-3 h-5 w-5" />
              <span>설정</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <h1 className="mb-6 text-2xl font-bold">아바에 대구 - 윤경숙 KOL</h1>

          {/* Metrics Row */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Combined Sales and Allowance Card */}
            <div className="rounded-lg border bg-white">
              {/* Sales Section */}
              <div className="border-b p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">당월 매출: 4,004만</h3>
                  <div className="rounded-full bg-amber-50 p-2">
                    <CoinsIcon className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">전월 대비 1,952 만 증가</span>
                </div>
              </div>

              {/* Allowance Section */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">당월 수당: 2,100만</h3>
                  <div className="rounded-full bg-purple-50 p-2">
                    <Wallet className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">전월 대비 985 만 증가</span>
                </div>
              </div>
            </div>

            {/* Combined Stores Status and Ordering Stores Card */}
            <div className="rounded-lg border bg-white">
              {/* Stores Status Section */}
              <div className="border-b p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">전문점 현황: 7곳</h3>
                  <div className="rounded-full bg-blue-50 p-2">
                    <Store className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">7월 5일 전문점 계약이 없었습니다.</div>
              </div>

              {/* Ordering Stores Section */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">당월 주문 전문점: 4곳</h3>
                  <div className="rounded-full bg-green-50 p-2">
                    <Store className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">3곳이 아직 주문하지 않았습니다.</div>
              </div>
            </div>
          </div>

          {/* Tables Row */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <StoreRankingTable />
            <UpcomingTasks />
          </div>

          {/* Chart */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-6 text-lg font-medium">나의 월별 매출 및 수당</h2>
            <SalesChart />
          </div>

          {/* Footer */}
          <footer className="mt-8 flex items-center justify-between text-xs text-gray-500">
            <div>© 2025 BioFox CRM. All rights reserved.</div>
            <div className="flex space-x-4">
              <Link href="#" className="hover:underline">
                이용약관
              </Link>
              <Link href="#" className="hover:underline">
                개인정보처리방침
              </Link>
              <Link href="#" className="hover:underline">
                고객지원
              </Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
} 