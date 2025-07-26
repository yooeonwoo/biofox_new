'use client';

import type { ReactNode } from 'react';
import AdminHeader from '@/components/layout/AdminHeader';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminNewLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['sales']}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <AdminHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
