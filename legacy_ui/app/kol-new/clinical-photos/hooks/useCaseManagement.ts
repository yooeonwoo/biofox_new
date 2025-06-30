import { useCallback, useEffect, useState } from 'react';
import type { ClinicalCase } from '@/app/kol-new/clinical-photos/types';
import {
  ensurePersonalCaseExists,
  fetchCustomerCases,
} from '@/lib/clinical-photos-service';

/**
 * 케이스 데이터를 불러오고 상태를 관리하는 커스텀 훅
 * @param type 'personal' | 'customer'
 */
export const useCaseManagement = (type: 'personal' | 'customer') => {
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      let data: ClinicalCase[] = [];
      if (type === 'personal') {
        const personal = await ensurePersonalCaseExists();
        if (personal) data = [personal];
      } else {
        data = await fetchCustomerCases();
      }
      setCases(data);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // 초기 로드
  useEffect(() => {
    loadCases();
  }, [loadCases]);

  return { cases, loading, refresh: loadCases, setCases };
}; 