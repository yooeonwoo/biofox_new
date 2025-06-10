'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚀 성능 최적화를 위한 기본 캐싱 설정
            staleTime: 60 * 1000, // 1분간 데이터를 fresh로 간주
            gcTime: 5 * 60 * 1000, // 5분간 캐시 유지 (이전 cacheTime)
            retry: 1, // 실패시 1번만 재시도
            refetchOnWindowFocus: false, // 창 포커스시 자동 refetch 비활성화
            refetchOnMount: true, // 컴포넌트 마운트시 refetch
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}