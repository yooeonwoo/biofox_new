import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { useEffect, useState } from 'react';

/**
 * Supabase와 Convex 프로필 데이터를 결합하기 위한 사용자 역할 타입 정의
 */
type UserRole =
  | 'admin'
  | 'kol'
  | 'shop'
  | 'hq'
  | 'unassigned'
  | 'ol'
  | 'shop_owner'
  | 'sales'
  | null;

/**
 * useAuth 훅이 반환하는 인증 상태 객체의 인터페이스
 */
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null; // Supabase 사용자 객체
  profile: any | null; // Convex 프로필 객체
  role: UserRole;
  signOut: () => Promise<void>; // 가이드 요구사항 추가
  syncError: Error | null; // 가이드 요구사항 추가
}

/**
 * 하이브리드 인증 훅 (Supabase Auth + Convex Profile)
 *
 * 이 훅은 Supabase의 인증 상태를 가져오고,
 * Supabase 사용자 ID를 사용하여 Convex에서 프로필 정보를 조회합니다.
 * 프로필이 없는 경우 자동으로 생성/동기화합니다.
 *
 * @returns {AuthState} - 통합된 인증 상태 객체
 */
export function useAuth(): AuthState {
  // 1. Supabase 인증 프로바이더로부터 인증 상태를 가져옵니다.
  const { user, loading: isSupabaseLoading, signOut: supabaseSignOut } = useSupabaseAuth();
  const isAuthenticated = !!user;
  const [syncError, setSyncError] = useState<Error | null>(null); // syncError 상태 추가

  // 2. Supabase ID로 Convex 프로필 조회 (이메일 대신)
  const profile = useQuery(
    api.supabaseAuth.getProfileBySupabaseId,
    user?.id ? { supabaseUserId: user.id } : 'skip'
  );

  // 3. 프로필 동기화 mutation
  const syncProfile = useMutation(api.supabaseAuth.syncSupabaseProfile);

  // 4. 프로필이 없으면 자동으로 동기화
  useEffect(() => {
    if (user && profile === null && !isSupabaseLoading) {
      // 프로필이 없는 경우 생성/동기화
      syncProfile({
        supabaseUserId: user.id,
        email: user.email!,
        metadata: {
          name: user.user_metadata?.name || user.user_metadata?.full_name,
          phone: user.user_metadata?.phone,
          role: user.user_metadata?.role,
          shop_name: user.user_metadata?.shop_name,
          region: user.user_metadata?.region,
        },
      }).catch(error => {
        console.error('Failed to sync profile:', error);
        setSyncError(error instanceof Error ? error : new Error('Profile sync failed'));
      });
    }
  }, [user, profile, isSupabaseLoading, syncProfile]);

  // 5. 로딩 상태를 결정합니다.
  // Supabase 인증 로딩 중이거나, 인증은 되었지만 아직 Convex 프로필을 가져오는 중이면 로딩 상태입니다.
  const isLoading = isSupabaseLoading || (isAuthenticated && profile === undefined);

  // 6. 사용자의 역할을 결정합니다.
  // Convex 프로필에 역할이 있으면 그 값을 사용하고, 없으면 'unassigned'로 처리합니다.
  const role = (profile?.role as UserRole) ?? (isAuthenticated ? 'unassigned' : null);

  // 7. signOut 함수 구현
  const signOut = async () => {
    try {
      setSyncError(null);
      if (supabaseSignOut) {
        await supabaseSignOut();
      }
    } catch (error) {
      console.error('Sign out error:', error);
      setSyncError(error instanceof Error ? error : new Error('Sign out failed'));
      throw error;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    profile,
    role,
    signOut, // 가이드 요구사항 추가
    syncError, // 가이드 요구사항 추가
  };
}
