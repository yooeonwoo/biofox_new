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
    onError?: (err: any) => void;
  }
) {
  const queryArgs = options?.enabled === false ? 'skip' : args;

  let data: any;
  let error: any = null;
  try {
    data = useQuery(query, queryArgs);
  } catch (err) {
    error = err;
    if (options?.onError) options.onError(err);
  }

  const state = useMemo(() => {
    return {
      data,
      isLoading: data === undefined && !error && options?.enabled !== false,
      isError: error !== null,
      error,
      isSuccess: data !== undefined && error === null,
      isEmpty: Array.isArray(data) && data.length === 0,
      isReady: data !== undefined || error !== null,
    };
  }, [data, error, options?.enabled]);

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
