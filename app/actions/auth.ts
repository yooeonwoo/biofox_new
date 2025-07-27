'use server';

import { createClient } from '@/lib/supabase/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';

export async function getSupabaseUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function syncUserProfile() {
  const user = await getSupabaseUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Convex에 프로필 동기화
  const profileId = await fetchMutation(api.supabaseAuth.syncSupabaseProfile, {
    supabaseUserId: user.id,
    email: user.email!,
    metadata: user.user_metadata,
  });

  return profileId;
}

export async function getCurrentProfile() {
  const user = await getSupabaseUser();
  if (!user) {
    return null;
  }

  // Convex에서 프로필 조회
  const profile = await fetchQuery(api.supabaseAuth.getProfileBySupabaseId, {
    supabaseUserId: user.id,
  });

  return profile;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
