/**
 * ⚠️ DEPRECATED: 이 파일은 Convex로 전환되었습니다
 *
 * 새로운 파일을 사용하세요:
 * - /lib/hooks/adminNewKols-convex.ts
 * - 실시간 동기화 지원
 * - 더 나은 타입 안전성
 * - 향상된 성능
 *
 * 기존 호환성을 위해 잠시 유지됩니다.
 */

'use client';

import { useQuery } from '@tanstack/react-query';

// 새로운 Convex 기반 훅을 re-export (향후 전환)
// export { useAdminNewKols, useAdminKolDetail, useAdminKolStats } from './adminNewKols-convex';

export interface AdminKol {
  id: number;
  kol_id: number;
  name: string;
  kol_shop_name: string;
  shop_name: string;
  shop_id: number;
}

export function useAdminNewKols() {
  return useQuery({
    queryKey: ['adminNewKols'],
    queryFn: async (): Promise<AdminKol[]> => {
      const res = await fetch('/api/admin-new/kols/list');
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      return json.data as AdminKol[];
    },
  });
}
