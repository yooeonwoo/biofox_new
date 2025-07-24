import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/convex/_generated/api';

export interface AuthUser {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface UserProfile {
  _id: string;
  userId: string;
  email: string;
  name: string;
  role: 'admin' | 'kol' | 'ol' | 'shop_owner';
  status: 'pending' | 'approved' | 'rejected';
  shop_name: string;
  region?: string;
  naver_place_link?: string;
  commission_rate?: number;
  total_subordinates?: number;
  active_subordinates?: number;
  approved_at?: number;
  approved_by?: string;
  created_at: number;
  updated_at: number;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  syncError?: string | null;
  completeness?: {
    completeness: number;
    missingFields: string[];
  };
}

export interface AuthActions {
  signIn: (provider?: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
  ensureProfile: (data: {
    email: string;
    name: string;
    role: 'admin' | 'kol' | 'ol' | 'shop_owner';
    shop_name: string;
    display_name?: string;
    region?: string;
  }) => Promise<string | null>;
  updateProfile: (data: {
    display_name?: string;
    bio?: string;
    profile_image_url?: string;
    shop_name?: string;
    region?: string;
    naver_place_link?: string;
  }) => Promise<string | null>;
}

export function useAuth(): AuthState & AuthActions {
  const { signIn, signOut } = useAuthActions();
  const router = useRouter();
  const [syncError, setSyncError] = useState<string | null>(null);

  // Convex mutations
  const ensureProfileMutation = useMutation(api.auth.ensureUserProfile);
  const updateProfileMutation = useMutation(api.auth.updateUserProfile);
  const updateOnlineStatusMutation = useMutation(api.auth.updateOnlineStatus);

  // 현재 인증된 사용자와 프로필 정보 조회
  const userWithProfile = useQuery(api.auth.getCurrentUserWithProfile);

  // 프로필 완성도 조회
  const profileCompleteness = useQuery(api.auth.getProfileCompleteness);

  const isLoading = userWithProfile === undefined;
  const isAuthenticated = !!userWithProfile?.user;
  const user = userWithProfile?.user || null;
  const profile = userWithProfile?.profile || null;

  // 역할 확인 함수
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!profile) return false;
      return profile.role === role;
    },
    [profile]
  );

  // 세션 동기화: 인증된 사용자가 있지만 프로필이 없는 경우 처리
  useEffect(() => {
    if (isAuthenticated && user && !profile && !isLoading) {
      console.log(
        'User authenticated but no profile found. Profile may need to be created separately.'
      );
      // 프로필은 별도의 회원가입 과정에서 생성되므로 여기서는 로깅만 함
    }
  }, [isAuthenticated, user, profile, isLoading]);

  // 세션 만료 감지 및 처리 - 마지막 활성 시간 업데이트
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isAuthenticated && user && profile) {
      // 세션 활성 상태 확인을 위한 주기적 체크 (5분마다)
      const updateLastActive = () => {
        updateProfileMutation({}).catch(error => {
          console.error('Failed to update last_active:', error);
        });
      };

      // 첫 번째 업데이트
      updateLastActive();

      // 주기적 업데이트 설정
      timeoutId = setInterval(updateLastActive, 5 * 60 * 1000); // 5분마다
    }

    return () => {
      if (timeoutId) {
        clearInterval(timeoutId);
      }
    };
  }, [isAuthenticated, user, profile, updateProfileMutation]);

  // 온라인/오프라인 상태 Convex 동기화
  useEffect(() => {
    if (!isAuthenticated || !profile) return;

    const updateOnlineStatus = (isOnline: boolean) => {
      updateOnlineStatusMutation({ isOnline }).catch(error => {
        console.error('Failed to update online status:', error);
      });
    };

    const handleOnline = () => updateOnlineStatus(true);
    const handleOffline = () => updateOnlineStatus(false);

    // 초기 온라인 상태 설정
    updateOnlineStatus(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 페이지 언로드 시 오프라인으로 설정
    const handleUnload = () => updateOnlineStatus(false);
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isAuthenticated, profile, updateOnlineStatusMutation]);

  // 로그인 함수 (이메일/패스워드 방식)
  const handleSignIn = useCallback(
    async (provider: string = 'password') => {
      try {
        // Convex Auth의 signIn을 호출
        // 실제로는 이메일/패스워드 로그인 폼에서 호출됩니다
        await signIn(provider);
      } catch (error) {
        console.error('Sign in error:', error);
        throw error;
      }
    },
    [signIn]
  );

  // 로그아웃 함수 - 완전한 상태 정리
  const handleSignOut = useCallback(async () => {
    try {
      setSyncError(null);

      // Convex Auth 로그아웃
      await signOut();

      // 로컬 상태 정리
      localStorage.removeItem('admin-sidebar-collapsed');

      // 세션 스토리지 정리
      sessionStorage.clear();

      // 홈 페이지로 리다이렉트
      router.push('/');

      console.log('Successfully signed out and cleared all session data');
    } catch (error: any) {
      const errorMsg = error.message || 'Sign out failed';
      console.error('Sign out error:', errorMsg);
      setSyncError(errorMsg);
      throw error;
    }
  }, [signOut, router]);

  // 프로필 생성/확인 함수
  const ensureProfile = useCallback(
    async (data: {
      email: string;
      name: string;
      role: 'admin' | 'kol' | 'ol' | 'shop_owner';
      shop_name: string;
      display_name?: string;
      region?: string;
    }): Promise<string | null> => {
      try {
        setSyncError(null);
        const profileId = await ensureProfileMutation(data);
        return profileId;
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to create profile';
        console.error('Ensure profile error:', errorMsg);
        setSyncError(errorMsg);
        return null;
      }
    },
    [ensureProfileMutation]
  );

  // 프로필 업데이트 함수
  const updateProfile = useCallback(
    async (data: {
      display_name?: string;
      bio?: string;
      profile_image_url?: string;
      shop_name?: string;
      region?: string;
      naver_place_link?: string;
    }): Promise<string | null> => {
      try {
        setSyncError(null);
        const profileId = await updateProfileMutation(data);
        return profileId;
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to update profile';
        console.error('Update profile error:', errorMsg);
        setSyncError(errorMsg);
        return null;
      }
    },
    [updateProfileMutation]
  );

  return {
    // 상태
    user,
    profile,
    isAuthenticated,
    isLoading,
    syncError,
    completeness: profileCompleteness || undefined,

    // 액션
    signIn: handleSignIn,
    signOut: handleSignOut,
    hasRole,
    ensureProfile,
    updateProfile,
  };
}

// Auth Context Provider를 위한 타입
export type AuthContextType = ReturnType<typeof useAuth>;
