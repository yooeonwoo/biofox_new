import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Supabase 기반 사용자 역할 타입 정의
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
 * 프로필 인터페이스 (Supabase profiles 테이블 기반)
 */
interface Profile {
  id: string;
  _id?: string; // Convex ID
  userId?: string;
  supabaseUserId?: string;
  email: string;
  name: string;
  display_name?: string; // 표시 이름
  bio?: string; // 자기소개
  image?: string; // 프로필 이미지
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  shop_name: string;
  region?: string;
  naver_place_link?: string;
  approved_at?: string;
  approved_by?: string;
  commission_rate?: number;
  total_subordinates?: number;
  active_subordinates?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

/**
 * useAuth 훅이 반환하는 인증 상태 객체의 인터페이스
 */
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null; // Supabase 사용자 객체
  profile: Profile | null; // Supabase 프로필 객체
  role: UserRole;
  signOut: () => Promise<void>;
  syncError: Error | null;
}

/**
 * 단순화된 Supabase 기반 인증 훅
 *
 * Supabase Auth 상태를 확인하고, 연결된 프로필 정보를 조회하는 역할만 수행합니다.
 * 프로필 자동 생성 로직은 Supabase DB 트리거로 이전되었습니다.
 *
 * @returns {AuthState} - 통합된 인증 상태 객체
 */
export function useAuth(): AuthState {
  const supabase = createClient();

  // 1. Supabase 인증 상태
  const { user, loading: isSupabaseLoading, signOut: supabaseSignOut } = useSupabaseAuth();
  const isAuthenticated = !!user;

  // 2. 프로필 상태
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // 3. 프로필 조회
  useEffect(() => {
    // 사용자가 없으면 프로필 상태를 초기화하고 종료
    if (!user?.id) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setProfileLoading(true);
      setSyncError(null);
      try {
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('supabaseUserId', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116: row not found
          throw error;
        }

        setProfile(existingProfile || null);
      } catch (error) {
        console.error('Profile fetch error:', error);
        setSyncError(error as Error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id, supabase]); // user.id가 변경될 때만 실행

  // 4. 통합된 인증 상태 반환
  return {
    isAuthenticated,
    isLoading: isSupabaseLoading || profileLoading,
    user,
    profile,
    role: profile?.role || null,
    signOut: supabaseSignOut,
    syncError,
  };
}
