'use client';

import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

/**
 * 현재 로그인한 사용자의 프로필을 가져오는 커스텀 훅
 * 여러 컴포넌트에서 중복되는 프로필 조회를 중앙화
 * ✅ Supabase 호환: profileId는 Supabase user ID 반환
 */
export function useCurrentProfile() {
  const { user: authUser } = useAuth();

  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  return {
    profile,
    profileId: authUser?.id, // ✅ Supabase user ID 사용 (Convex _id 대신)
    isLoading: profile === undefined,
    isAuthenticated: !!authUser && !!profile,
  };
}
