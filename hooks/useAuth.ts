import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth as useSupabaseAuth } from '@/providers/supabase-auth-provider';

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
}

/**
 * 하이브리드 인증 훅 (Supabase Auth + Convex Profile)
 *
 * 이 훅은 Supabase의 인증 상태를 가져오고,
 * 인증된 사용자의 이메일을 사용하여 Convex에서 추가적인 프로필 정보를 조회합니다.
 * 두 시스템의 데이터를 결합하여 일관된 인증 상태를 애플리케이션에 제공합니다.
 *
 * @returns {AuthState} - 통합된 인증 상태 객체
 */
export function useAuth(): AuthState {
  // 1. Supabase 인증 프로바이더로부터 인증 상태를 가져옵니다.
  const { user, loading: isSupabaseLoading } = useSupabaseAuth();
  const isAuthenticated = !!user;

  // 2. 인증된 사용자의 이메일을 사용하여 Convex에서 프로필 정보를 조회합니다.
  const userEmail = user?.email;
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    // userEmail이 있을 때만 쿼리를 실행합니다.
    userEmail ? { email: userEmail } : 'skip'
  );

  // 3. 로딩 상태를 결정합니다.
  // Supabase 인증 로딩 중이거나, 인증은 되었지만 아직 Convex 프로필을 가져오는 중이면 로딩 상태입니다.
  const isLoading = isSupabaseLoading || (isAuthenticated && profile === undefined);

  // 4. 사용자의 역할을 결정합니다.
  // Convex 프로필에 역할이 있으면 그 값을 사용하고, 없으면 'unassigned'로 처리합니다.
  const role = (profile?.role as UserRole) ?? (isAuthenticated ? 'unassigned' : null);

  return {
    isAuthenticated,
    isLoading,
    user,
    profile,
    role,
  };
}
