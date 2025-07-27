'use client';

import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  isServer,
  defaultShouldDehydrateQuery,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ✅ 최신 TanStack Query v5 SSR 설정
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR에서는 즉시 refetch 방지를 위해 staleTime 설정
        staleTime: 60 * 1000, // 1분
        gcTime: 5 * 60 * 1000, // 5분 (이전 cacheTime)
      },
      dehydrate: {
        // pending 쿼리도 dehydration에 포함 (스트리밍 SSR 지원)
        shouldDehydrateQuery: query =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // 서버: 항상 새로운 query client 생성
    return makeQueryClient();
  } else {
    // 브라우저: 기존 client 재사용 (React Suspense 대응)
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

export default function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // ✅ useState 대신 getQueryClient() 사용 (Suspense 경계 고려)
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
