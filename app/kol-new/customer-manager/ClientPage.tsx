'use client';

import { Suspense } from 'react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import CustomerList from './components/CustomerList';

function CustomerManagerContent() {
  const { user } = useSimpleAuth();

  // 사용자가 없으면 로딩 상태 표시
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-0">
      <CustomerList
        initialData={[]} // 실제 데이터는 CustomerList에서 로드
        kolId={user.email} // 사용자 email을 ID로 사용 (임시)
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
