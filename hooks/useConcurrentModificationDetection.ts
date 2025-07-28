import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import type { ClinicalCase } from '@/types/clinical';

interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  resolver?: (local: any, remote: any) => any;
}

interface UseConcurrentModificationOptions {
  onConflict?: (local: ClinicalCase, remote: ClinicalCase) => void;
  resolution?: ConflictResolution;
  pollingInterval?: number;
}

/**
 * 동시 수정 감지 Hook
 * 다른 사용자의 변경사항을 감지하고 충돌을 처리합니다.
 */
export function useConcurrentModificationDetection(
  caseId: string | undefined,
  localCase: ClinicalCase | undefined,
  options: UseConcurrentModificationOptions = {}
) {
  const { onConflict, resolution = { strategy: 'manual' }, pollingInterval = 5000 } = options;

  const lastKnownVersionRef = useRef<number>(0);
  const conflictDetectedRef = useRef(false);

  // Convex에서 최신 케이스 데이터 실시간 구독
  const remoteCase = useQuery(
    api.clinical.getClinicalCase,
    caseId ? { caseId: caseId as Id<'clinical_cases'> } : 'skip'
  );

  // 버전 비교 함수
  const compareVersions = useCallback((local: ClinicalCase, remote: any) => {
    // 간단한 타임스탬프 기반 버전 비교
    const localTimestamp = new Date(local.createdAt || 0).getTime(); // ✅ undefined 안전성
    const remoteTimestamp = new Date(remote._creationTime).getTime();

    return {
      hasConflict: remoteTimestamp > localTimestamp && !conflictDetectedRef.current,
      localVersion: localTimestamp,
      remoteVersion: remoteTimestamp,
    };
  }, []);

  // 충돌 해결 함수
  const resolveConflict = useCallback(
    async (local: ClinicalCase, remote: any): Promise<ClinicalCase> => {
      switch (resolution.strategy) {
        case 'local':
          // 로컬 변경사항 우선
          toast.info('다른 사용자의 변경사항이 감지되었습니다. 현재 변경사항을 유지합니다.');
          return local;

        case 'remote':
          // 원격 변경사항 우선
          toast.warning('다른 사용자의 변경사항으로 업데이트되었습니다.');
          return mapRemoteToLocal(remote);

        case 'merge':
          // 자동 병합 시도
          if (resolution.resolver) {
            const merged = resolution.resolver(local, remote);
            toast.success('변경사항이 자동으로 병합되었습니다.');
            return merged;
          }
        // resolver가 없으면 manual로 폴백

        case 'manual':
        default:
          // 사용자에게 선택 요청
          onConflict?.(local, mapRemoteToLocal(remote));
          return local; // 일단 로컬 유지
      }
    },
    [resolution, onConflict]
  );

  // 원격 데이터를 로컬 타입으로 변환
  const mapRemoteToLocal = useCallback((remote: any): ClinicalCase => {
    return {
      id: remote._id,
      customerName: remote.name || '',
      status: remote.status === 'in_progress' ? 'active' : 'completed',
      createdAt: new Date(remote._creationTime).toISOString(),
      consentReceived: remote.consentReceived || false,
      consentImageUrl: remote.consentImageUrl,
      photos: remote.photos || [],
      customerInfo: remote.metadata?.customerInfo || {
        name: remote.name || '',
        age: remote.age,
        gender: remote.gender,
        products: [],
        skinTypes: [],
        memo: '',
      },
      roundCustomerInfo: remote.metadata?.roundCustomerInfo || {},
      // 체크박스 필드들
      cureBooster: remote.metadata?.cureBooster || false,
      cureMask: remote.metadata?.cureMask || false,
      premiumMask: remote.metadata?.premiumMask || false,
      allInOneSerum: remote.metadata?.allInOneSerum || false,
      skinRedSensitive: remote.metadata?.skinRedSensitive || false,
      skinPigment: remote.metadata?.skinPigment || false,
      skinPore: remote.metadata?.skinPore || false,
      skinTrouble: remote.metadata?.skinTrouble || false,
      skinWrinkle: remote.metadata?.skinWrinkle || false,
      skinEtc: remote.metadata?.skinEtc || false,
      treatmentPlan: remote.treatmentPlan,
      concernArea: remote.concernArea,
    };
  }, []);

  // 충돌 감지 및 처리
  useEffect(() => {
    if (!localCase || !remoteCase || !caseId) return;

    const { hasConflict, remoteVersion } = compareVersions(localCase, remoteCase);

    if (hasConflict) {
      conflictDetectedRef.current = true;

      // 충돌 해결
      resolveConflict(localCase, remoteCase).then(resolved => {
        // 해결된 데이터로 업데이트
        lastKnownVersionRef.current = remoteVersion;
        conflictDetectedRef.current = false;
      });
    } else {
      lastKnownVersionRef.current = remoteVersion;
    }
  }, [localCase, remoteCase, caseId, compareVersions, resolveConflict]);

  return {
    hasConflict: conflictDetectedRef.current,
    remoteCase: remoteCase ? mapRemoteToLocal(remoteCase) : undefined,
  };
}

/**
 * 자동 병합을 위한 헬퍼 함수들
 */
export const conflictResolvers = {
  // 필드별 병합 전략
  mergeByField: (fieldPriority: Record<string, 'local' | 'remote'>) => {
    return (local: any, remote: any) => {
      const merged = { ...local };

      for (const [field, priority] of Object.entries(fieldPriority)) {
        if (priority === 'remote' && remote[field] !== undefined) {
          merged[field] = remote[field];
        }
      }

      return merged;
    };
  },

  // 타임스탬프 기반 병합
  mergeByTimestamp: (local: any, remote: any) => {
    const localTime = new Date(local.updatedAt || local.createdAt).getTime();
    const remoteTime = new Date(remote._lastModified || remote._creationTime).getTime();

    return remoteTime > localTime ? remote : local;
  },

  // 배열 병합 (중복 제거)
  mergeArrays: (localArray: any[], remoteArray: any[], keyField = 'id') => {
    const merged = new Map();

    // 로컬 먼저 추가
    localArray.forEach(item => {
      merged.set(item[keyField], item);
    });

    // 원격 추가 (중복은 덮어씀)
    remoteArray.forEach(item => {
      if (!merged.has(item[keyField])) {
        merged.set(item[keyField], item);
      }
    });

    return Array.from(merged.values());
  },
};
