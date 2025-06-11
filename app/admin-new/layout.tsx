import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

export default async function AdminNewLayout({ children }: { children: ReactNode }) {
  const { userId, sessionClaims } = await auth();

  // 로그인되지 않았으면 로그인 페이지로
  if (!userId) {
    redirect('/signin');
  }

  // 'admin-new' 권한이 아닌 경우 홈으로 리다이렉트
  const role = sessionClaims?.role as string | undefined;
  if (role !== 'admin-new') {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-gray-800 px-4 py-3 text-white">
        <h1 className="text-lg font-bold">BIOFOX 새 관리자</h1>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
} 