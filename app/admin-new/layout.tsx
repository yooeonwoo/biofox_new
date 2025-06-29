import type { ReactNode } from 'react';
import AdminHeader from '@/components/layout/AdminHeader';

export default async function AdminNewLayout({
  children,
}: {
  children: ReactNode;
}) {
  // 로컬 개발환경에서는 인증 체크를 건너뜀
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminHeader />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
} 