'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * 현재 로그인한 사용자의 프로필을 가져오는 커스텀 훅
 * 여러 컴포넌트에서 중복되는 프로필 조회를 중앙화
 */
export function useCurrentProfile() {
  const { user: authUser } = useAuth();

  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  return {
    profile,
    profileId: profile?._id,
    isLoading: profile === undefined,
    isAuthenticated: !!authUser && !!profile,
  };
}
