'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ReactNode, Suspense } from 'react';
import { ProfileSync } from '@/components/auth/ProfileSync';
import { Toaster } from '@/components/ui/toaster';

// Convex client 생성
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

interface ConvexClientProviderProps {
  children: ReactNode;
  showSyncStatus?: boolean;
}

// 로딩 폴백 컴포넌트
function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        <p className="text-sm text-gray-500">서비스를 준비 중입니다...</p>
      </div>
    </div>
  );
}

export function ConvexClientProvider({
  children,
  showSyncStatus = false,
}: ConvexClientProviderProps) {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        <Suspense fallback={<LoadingFallback />}>
          <ProfileSync showSyncStatus={showSyncStatus}>{children}</ProfileSync>
        </Suspense>
        <Toaster />
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}
