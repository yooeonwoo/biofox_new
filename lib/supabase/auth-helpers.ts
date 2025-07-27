import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { fetchQuery, fetchMutation } from 'convex/nextjs';

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireProfile() {
  const user = await requireAuth();

  let profile = await fetchQuery(api.supabaseAuth.getProfileBySupabaseId, {
    supabaseUserId: user.id,
  });

  if (!profile) {
    // 프로필이 없으면 자동으로 동기화 시도
    try {
      await fetchMutation(api.supabaseAuth.syncSupabaseProfile, {
        supabaseUserId: user.id,
        email: user.email!,
        metadata: {
          name: user.user_metadata?.name || user.user_metadata?.full_name,
          phone: user.user_metadata?.phone,
          role: user.user_metadata?.role,
          shop_name: user.user_metadata?.shop_name,
          region: user.user_metadata?.region,
        },
      });

      // 동기화 후 다시 조회
      profile = await fetchQuery(api.supabaseAuth.getProfileBySupabaseId, {
        supabaseUserId: user.id,
      });
    } catch (error) {
      console.error('Failed to sync profile:', error);
    }

    // 여전히 프로필이 없으면 온보딩으로
    if (!profile) {
      redirect('/onboarding');
    }
  }

  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await requireProfile();

  if (profile.role !== 'admin') {
    redirect('/unauthorized');
  }

  return { user, profile };
}

export async function requireRole(allowedRoles: string[]) {
  const { user, profile } = await requireProfile();

  if (!allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return { user, profile };
}

export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const profile = await fetchQuery(api.supabaseAuth.getProfileBySupabaseId, {
    supabaseUserId: user.id,
  });

  return { user, profile };
}
