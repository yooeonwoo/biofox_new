import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BIOFOX Admin',
  description: 'BIOFOX KOL 시스템 관리자 대시보드',
};

export default function BiofoxAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
