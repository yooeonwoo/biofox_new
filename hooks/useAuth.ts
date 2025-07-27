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
  userId?: string;
  supabaseUserId?: string;
  email: string;
  name: string;
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
 * 완전 Supabase 기반 인증 훅
 *
 * Supabase Auth + Supabase profiles 테이블을 사용하여
 * 완전한 인증 상태를 제공합니다.
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

  // 3. 프로필 조회 및 동기화
  useEffect(() => {
    if (!user || profileLoading) return;

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setSyncError(null);

        // Supabase profiles 테이블에서 프로필 조회
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('supabaseUserId', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          throw error;
        }

        if (existingProfile) {
          setProfile(existingProfile);
        } else {
          // 프로필이 없으면 자동 생성
          const newProfile = {
            supabaseUserId: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.user_metadata?.full_name || user.email!,
            role: (user.user_metadata?.role as UserRole) || 'shop_owner',
            status: 'pending' as const,
            shop_name: user.user_metadata?.shop_name || '매장명 미설정',
            region: user.user_metadata?.region || null,
            naver_place_link: user.user_metadata?.naver_place_link || null,
            commission_rate: null,
            total_subordinates: 0,
            active_subordinates: 0,
            metadata: user.user_metadata || {},
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          setProfile(createdProfile);
        }
      } catch (error) {
        console.error('Profile sync error:', error);
        setSyncError(error as Error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, supabase]);

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
