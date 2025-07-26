/**
 * 임시 auth 파일 - Convex Auth로 마이그레이션 필요
 */

import { redirect } from 'next/navigation';

export async function checkAuthSupabase() {
  // TODO: Convex Auth로 마이그레이션
  // 현재는 빌드 에러 해결을 위한 임시 구현
  console.warn('checkAuthSupabase is deprecated. Please migrate to Convex Auth.');

  // 임시로 인증되지 않은 것으로 처리
  redirect('/signin');
}

export async function getUserFromSupabase() {
  // TODO: Convex Auth로 마이그레이션
  return null;
}
