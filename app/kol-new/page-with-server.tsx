import { Suspense } from 'react';
import ServerDashboard from './ServerDashboard';

// 🚀 서버 컴포넌트를 활용한 SSR 데이터 페칭 최적화
// 초기 페이지 로드 시 서버에서 데이터를 미리 페칭하여 FCP와 LCP 개선

function DashboardPageLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md text-center">
        <div className="text-lg font-semibold">페이지 로딩 중...</div>
        <div className="text-sm text-muted-foreground mt-2">서버에서 데이터를 준비하고 있습니다.</div>
      </div>
    </div>
  );
}

export default function KolNewPage() {
  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <ServerDashboard />
    </Suspense>
  );
}