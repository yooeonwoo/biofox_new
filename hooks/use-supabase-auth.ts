import { useAuth } from '@/providers/supabase-auth-provider';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@convex/_generated/api';
import { useConvexAuth, useMutation as useConvexMutation } from 'convex/react';

export function useSupabaseUser() {
  const { user, session, loading } = useAuth();
  return { user, session, loading };
}

export function useConvexProfile() {
  const { user } = useAuth();
  const { isAuthenticated } = useConvexAuth();

  // Convex profile 조회 (Supabase userId로)
  const profile = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      // 여기서 Convex 함수를 호출하여 Supabase userId로 profile 조회
      // 나중에 구현할 예정
      return null;
    },
    enabled: !!user?.id && isAuthenticated,
  });

  return profile;
}

export function useSyncProfile() {
  const { user } = useAuth();
  const syncProfile = useConvexMutation(api.auth.syncSupabaseProfile);

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user found');

      return syncProfile({
        supabaseUserId: user.id,
        email: user.email!,
        metadata: user.user_metadata,
      });
    },
  });
}

export function useRequireAuth() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    throw new Error('Authentication required');
  }

  return { user, loading };
}
