import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { api } from '@convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';

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

  const profile = await fetchQuery(api.supabaseAuth.getProfileBySupabaseId, {
    supabaseUserId: user.id,
  });

  if (!profile) {
    redirect('/onboarding');
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
