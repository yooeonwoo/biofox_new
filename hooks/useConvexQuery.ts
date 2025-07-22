import { useQuery } from 'convex/react';
import { FunctionReference } from 'convex/server';
import { useMemo } from 'react';

/**
 * Convex useQuery의 표준화된 상태 관리
 */
export function useConvexQuery<T>(
  query: FunctionReference<'query'>,
  args?: any,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  // Convex useQuery는 args가 "skip"이면 실행하지 않음
  const queryArgs = options?.enabled === false ? 'skip' : args;

  const data = useQuery(query, queryArgs);

  const state = useMemo(() => {
    return {
      data,
      isLoading: data === undefined && options?.enabled !== false,
      isError: false, // Convex는 현재 에러 상태를 직접 노출하지 않음
      error: null,
      isSuccess: data !== undefined,
      isEmpty: Array.isArray(data) && data.length === 0,
      isReady: data !== undefined,
    };
  }, [data, options?.enabled]);

  return state;
}

/**
 * 페이지네이션을 지원하는 Convex query 상태 관리
 */
export function usePaginatedConvexQuery<T>(
  query: FunctionReference<'query'>,
  args?: any & { paginationOpts?: { numItems: number; cursor?: string | null } },
  options?: {
    enabled?: boolean;
  }
) {
  const queryResult = useConvexQuery(query, args, options);

  const paginationState = useMemo(() => {
    const result = queryResult.data;
    return {
      ...queryResult,
      items: result?.page || [],
      hasNextPage: result ? !result.isDone : false,
      cursor: result?.continueCursor || null,
      totalCount: result?.totalCount || 0,
    };
  }, [queryResult]);

  return paginationState;
}

/**
 * 여러 Convex queries를 조합할 때 사용하는 상태 관리
 */
export function useCombinedConvexQueries(
  queries: Array<{
    data: any;
    isLoading: boolean;
    isError?: boolean;
    error?: any;
  }>
) {
  const combinedState = useMemo(() => {
    const allLoading = queries.every(q => q.isLoading);
    const anyLoading = queries.some(q => q.isLoading);
    const anyError = queries.some(q => q.isError);
    const allReady = queries.every(q => !q.isLoading);

    return {
      isLoading: allLoading,
      isPartialLoading: anyLoading && !allLoading,
      isError: anyError,
      isReady: allReady,
      errors: queries.filter(q => q.error).map(q => q.error),
      data: queries.map(q => q.data),
    };
  }, [queries]);

  return combinedState;
}

/**
 * Convex mutation의 표준화된 상태 관리
 */
export function useConvexMutationState() {
  // 이는 useMutation 결과와 함께 사용하는 헬퍼
  const createMutationHandler = <T extends any[], R>(
    mutationFn: (...args: T) => Promise<R>,
    options?: {
      onSuccess?: (result: R) => void;
      onError?: (error: Error) => void;
      optimisticUpdate?: boolean;
    }
  ) => {
    return async (...args: T) => {
      try {
        const result = await mutationFn(...args);
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        options?.onError?.(errorObj);
        throw errorObj;
      }
    };
  };

  return { createMutationHandler };
}
