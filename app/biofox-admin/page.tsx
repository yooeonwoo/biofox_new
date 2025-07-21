'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BiofoxAdminPage() {
  const router = useRouter();

  useEffect(() => {
    // 기본적으로 사용자 관리 페이지로 리다이렉트
    router.replace('/biofox-admin/users');
  }, [router]);

  return null;
}
