import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
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
  display_name?: string;
  role: 'admin' | 'kol' | 'ol' | 'shop_owner';
  status: 'pending' | 'approved' | 'rejected';
  shop_name: string;
  region?: string;
  bio?: string;
  profile_image_url?: string;
  created_at: number;
  last_active?: number;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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

  // 로그아웃 함수
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
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
        // Convex mutation을 직접 호출하는 대신
        // useMutation 훅을 사용해야 하지만 여기서는 예시로 구현
        // 실제로는 컴포넌트에서 useMutation을 사용해야 합니다
        return data.email; // 임시 반환값
      } catch (error) {
        console.error('Ensure profile error:', error);
        return null;
      }
    },
    []
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
        // 실제로는 useMutation을 통해 구현됩니다
        return profile?._id || null;
      } catch (error) {
        console.error('Update profile error:', error);
        return null;
      }
    },
    [profile]
  );

  return {
    // 상태
    user,
    profile,
    isAuthenticated,
    isLoading,
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
