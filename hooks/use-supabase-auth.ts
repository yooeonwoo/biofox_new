// 이 파일은 더 이상 사용되지 않습니다.
// Convex Auth를 직접 사용하세요:
// - useConvexAuth() from 'convex/react'
// - useMutation(api.auth.*)

import { useConvexAuth } from 'convex/react';

export function useSupabaseUser() {
  console.warn('useSupabaseUser is deprecated. Use useConvexAuth() instead.');
  throw new Error('useSupabaseUser is deprecated. Use useConvexAuth() instead.');
}

export function useConvexProfile() {
  console.warn('useConvexProfile is deprecated. Use useConvexAuth() instead.');
  throw new Error('useConvexProfile is deprecated. Use useConvexAuth() instead.');
}

export function useSyncProfile() {
  console.warn('useSyncProfile is deprecated. Use Convex auth directly.');
  throw new Error('useSyncProfile is deprecated. Use Convex auth directly.');
}

export function useRequireAuth() {
  console.warn('useRequireAuth is deprecated. Use useConvexAuth() instead.');
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) {
    throw new Error('Authentication required');
  }

  return { isAuthenticated };
}
