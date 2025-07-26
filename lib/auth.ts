/**
 * 인증 유틸리티 - Convex Auth 사용
 */

import { redirect } from 'next/navigation';

// Supabase 관련 함수들은 모두 제거됨
// Convex Auth를 사용하세요:
//
// 1. 클라이언트에서: useAuthActions(), useCurrentUser()
// 2. 서버에서: convex/auth.ts의 getCurrentUser() 함수 사용
//
// 예시:
// import { useAuthActions, useCurrentUser } from "@convex-dev/auth/react";
// const { signIn, signOut } = useAuthActions();
// const user = useCurrentUser();

console.info('lib/auth.ts: Supabase 인증 함수들이 제거되었습니다. Convex Auth를 사용하세요.');
