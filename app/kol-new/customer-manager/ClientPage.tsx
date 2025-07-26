'use client';

import { Suspense } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import CustomerList from './components/CustomerList';

function CustomerManagerContent() {
  const { user } = useSimpleAuth();

  // 간단한 인증은 레이아웃에서 처리되므로 바로 컴포넌트 렌더링
  return (
    <div className="mx-auto w-full px-0">
      <CustomerList
        initialData={[]} // 실제 데이터는 CustomerList에서 로드
        kolId="mock-kol-id" // 임시 KOL ID
      />
    </div>
  );
}

export default function CustomerManagerClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <CustomerManagerContent />
    </Suspense>
  );
}
