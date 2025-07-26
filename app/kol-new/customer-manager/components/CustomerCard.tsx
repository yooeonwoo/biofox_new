'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Customer, CustomerProgress, StageData, Achievements } from '@/lib/types/customer';
import StageBlocks from './StageBlocks';
import { debounce } from '@/lib/utils';
import CustomerHeader, { BasicInfoValue } from './CustomerHeader';
import { ConnectionLineProvider } from '../contexts/ConnectionLineProvider';
import ConnectionLines from './ConnectionLines';

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
