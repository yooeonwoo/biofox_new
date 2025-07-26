'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Customer, CustomerProgress, StageData, Achievements } from '@/lib/types/customer';
import StageBlocks from './StageBlocks';
import { debounce } from '@/lib/utils';
import CustomerHeader, { BasicInfoValue } from './CustomerHeader';
import { ConnectionLineProvider } from '../contexts/ConnectionLineProvider';
import ConnectionLines from './ConnectionLines';

// Convex 관련 imports
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface Props {
  customer: Customer & { customer_progress?: CustomerProgress[] };
  progress?: CustomerProgress;
  cardNumber: number;
  isNew?: boolean;
  onDelete?: () => void;
  onSave?: (customerData: {
    name: string;
    shopName?: string;
    phone: string;
    region: string;
    placeAddress?: string;
    assignee: string;
    manager: string;
    notes?: string;
  }) => void;
  isDummyMode?: boolean;
}

const defaultStageData: StageData = {} as StageData;

const defaultAchievements: Achievements = {
  basicTraining: false,
  standardProtocol: false,
  expertCourse: false,
};

export default function CustomerCard({
  customer,
  cardNumber,
  isNew,
  onDelete,
  onSave,
  isDummyMode = false,
}: Props) {
  const initialProgress: CustomerProgress = customer.customer_progress?.[0] || {
    id: 'temp-' + customer.id,
    customerId: customer.id.toString(),
    stageData: defaultStageData,
    achievements: defaultAchievements,
    updatedAt: null,
  };

  const [localProgress, setLocalProgress] = useState<CustomerProgress>(initialProgress);

  // 인적사항 저장 상태 관리
  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);
  const [lastSavedBasicInfo, setLastSavedBasicInfo] = useState<Date | null>(null);

  // Convex mutation
  const updateCustomer = useMutation(api.customers.updateCustomer);

  const debouncedSave = useCallback(
    debounce((p: CustomerProgress) => {
      // 더미 모드에서는 API 호출하지 않음
      if (!isDummyMode) {
        console.log('Production mode would save:', p);
        // 실제 API 호출은 하지 않음 (하드코딩 인증 시스템)
      }
    }, 1000),
    [customer.id, isDummyMode]
  );

  useEffect(() => {
    debouncedSave(localProgress);
  }, [localProgress, debouncedSave]);

  function handleStageChange(stageKey: keyof StageData, value: any) {
    setLocalProgress(prev => ({
      ...prev,
      stageData: {
        ...prev.stageData,
        [stageKey]: value,
      },
    }));
  }

  // 기본 정보 편집
  const [basicInfo, setBasicInfo] = useState<BasicInfoValue>({
    shopName: customer.shopName,
    phone: customer.phone,
    region: customer.region,
    placeAddress: customer.placeAddress,
    assignee: customer.assignee,
    manager: customer.manager,
  });

  const debouncedSaveInfo = useCallback(
    debounce((info: BasicInfoValue) => {
      // 더미 모드에서는 API 호출하지 않음
      if (!isDummyMode) {
        console.log('Production mode would save info:', info);
        // 실제 API 호출은 하지 않음 (하드코딩 인증 시스템)
      }
    }, 1000),
    [isDummyMode, customer.id]
  );

  useEffect(() => {
    debouncedSaveInfo(basicInfo);
  }, [basicInfo, debouncedSaveInfo]);

  // 인적사항 수동 저장 함수
  const handleSaveBasicInfo = useCallback(async () => {
    if (
      isDummyMode ||
      !customer.id ||
      (typeof customer.id === 'string' && customer.id.startsWith('new-'))
    ) {
      console.log('더미 모드 또는 신규 고객: 인적사항 저장 시뮬레이션', { basicInfo });

      // 더미 모드에서도 저장 상태 업데이트
      setIsSavingBasicInfo(true);

      // 1초 대기 후 완료 처리
      setTimeout(() => {
        setIsSavingBasicInfo(false);
        setLastSavedBasicInfo(new Date());
        toast.success('인적사항이 저장되었습니다.');
      }, 1000);

      return;
    }

    try {
      setIsSavingBasicInfo(true);

      await updateCustomer({
        customerId: customer.id as any,
        updates: {
          shopName: basicInfo.shopName,
          phone: basicInfo.phone || '',
          region: basicInfo.region || '',
          placeAddress: basicInfo.placeAddress,
          assignee: basicInfo.assignee || '',
          manager: basicInfo.manager || '',
        },
      });

      setLastSavedBasicInfo(new Date());
      toast.success('인적사항이 저장되었습니다.');
    } catch (error) {
      console.error('인적사항 저장 실패:', error);
      toast.error('인적사항 저장에 실패했습니다.');
    } finally {
      setIsSavingBasicInfo(false);
    }
  }, [customer.id, basicInfo, updateCustomer, isDummyMode]);

  function handleAchievementChange(newAch: Achievements) {
    setLocalProgress(prev => ({ ...prev, achievements: newAch }));
  }

  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <ConnectionLineProvider cardRef={cardRef}>
        {/* 연결선 */}
        <ConnectionLines stageData={localProgress.stageData} />

        {/* 상단 헤더 */}
        <CustomerHeader
          customer={customer}
          progress={localProgress}
          cardNumber={cardNumber}
          basicInfo={basicInfo}
          onBasicInfoChange={setBasicInfo}
          isNew={isNew}
          onDelete={onDelete}
          onSaveBasicInfo={handleSaveBasicInfo}
          isSavingBasicInfo={isSavingBasicInfo}
          lastSavedBasicInfo={lastSavedBasicInfo}
        />

        {/* 스테이지 블록 */}
        <div className="p-3 xs:p-4 sm:p-6">
          <StageBlocks
            stageData={localProgress.stageData}
            onStageChange={handleStageChange}
            achievements={localProgress.achievements}
            onAchievementsChange={handleAchievementChange}
            customerId={
              // 새로운 고객이거나 임시 ID인 경우 undefined로 처리
              isNew || (typeof customer.id === 'string' && customer.id.startsWith('new-'))
                ? undefined
                : (customer.id as any)
            }
            isDummyMode={isDummyMode}
          />
        </div>
      </ConnectionLineProvider>
    </div>
  );
}
