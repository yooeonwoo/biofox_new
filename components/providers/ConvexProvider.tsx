'use client';

import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ReactNode, Suspense, useEffect, useState } from 'react';
import { ProfileSync } from '@/components/auth/ProfileSync';
import { Toaster } from '@/components/ui/toaster';

// ✅ 안전한 Convex client 생성 (에러 처리 포함)
function createSafeConvexClient() {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.warn('NEXT_PUBLIC_CONVEX_URL not found - Convex features disabled');
      return null;
    }
    return new ConvexReactClient(convexUrl);
  } catch (error) {
    console.warn('Failed to create Convex client:', error);
    return null;
  }
}

const convex = createSafeConvexClient();

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

// ✅ Convex 없이도 작동하는 Fallback Provider
function FallbackProvider({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function ConvexClientProvider({
  children,
  showSyncStatus = false,
}: ConvexClientProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 후 준비 상태로 설정
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <LoadingFallback />;
  }

  // ✅ Convex client가 없으면 Fallback Provider 사용
  if (!convex) {
    console.info('Running in Supabase-only mode');
    return <FallbackProvider>{children}</FallbackProvider>;
  }

  // ✅ Convex client가 있으면 정상적인 Convex Provider 사용
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>
        {children}
        {showSyncStatus && (
          <Suspense fallback={null}>
            <ProfileSync showSyncStatus={showSyncStatus}>{children}</ProfileSync>
          </Suspense>
        )}
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}
