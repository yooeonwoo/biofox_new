import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Profile, UserRole, AuthState } from '@/types/auth';

/**
 * 단순화된 Supabase 기반 인증 훅
 *
 * Supabase Auth 상태를 확인하고, 연결된 프로필 정보를 조회하는 역할만 수행합니다.
 * 프로필 자동 생성 로직은 Supabase DB 트리거로 이전되었습니다.
 *
 * @returns {AuthState} - 통합된 인증 상태 객체
 */
export function useAuth(): AuthState {
  // 1. Supabase 인증 상태 - Provider에서 supabase 클라이언트도 가져옴
  const {
    user,
    loading: isSupabaseLoading,
    signOut: supabaseSignOut,
    error: authError,
    supabase,
  } = useSupabaseAuth();
  const isAuthenticated = !!user;

  // 2. 프로필 상태
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // 3. 프로필 생성 함수 (폴백용)
  const createProfileFallback = useCallback(async () => {
    if (!user?.id || !user?.email) return null;

    try {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          supabaseUserId: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          display_name: user.user_metadata?.display_name || '',
          role: 'unassigned',
          status: 'pending',
          shop_name: '',
          metadata: user.user_metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('프로필이 생성되었습니다.');
      return newProfile;
    } catch (error) {
      console.error('Profile creation fallback error:', error);
      toast.error('프로필 생성에 실패했습니다. 관리자에게 문의해주세요.');
      throw error;
    }
  }, [user, supabase]);

  // 4. 프로필 조회
  useEffect(() => {
    // 사용자가 없으면 프로필 상태를 초기화하고 종료
    if (!user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let mounted = true;
    const fetchProfile = async () => {
      setProfileLoading(true);
      setSyncError(null);

      try {
        const { data: existingProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('supabaseUserId', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // 프로필이 없는 경우 - DB 트리거가 실패했을 가능성
          console.warn('Profile not found, attempting to create...');

          if (mounted) {
            const newProfile = await createProfileFallback();
            if (mounted && newProfile) {
              setProfile(newProfile);
            }
          }
        } else if (error) {
          throw error;
        } else if (mounted) {
          setProfile(existingProfile);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        if (mounted) {
          setSyncError(error as Error);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [user?.id, supabase, createProfileFallback]); // user.id가 변경될 때만 실행

  // 5. 실시간 프로필 업데이트 구독
  useEffect(() => {
    if (!profile?._id) return;

    const channel = supabase
      .channel(`profile-${profile._id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        payload => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?._id, profile?.id, supabase]);

  // 6. 통합된 인증 상태 반환
  return {
    isAuthenticated,
    isLoading: isSupabaseLoading || profileLoading,
    user,
    profile,
    role: profile?.role || null,
    signOut: supabaseSignOut,
    syncError: syncError || authError,
  };
}
