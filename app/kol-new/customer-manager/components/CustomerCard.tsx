'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Customer, CustomerProgress, StageData, Achievements } from '@/lib/types/customer';
import StageBlocks from './StageBlocks';
import { useUpdateCustomerProgress, useUpdateCustomer } from '@/hooks/useCustomers';
import { debounce } from '@/lib/utils';
import CustomerHeader, { BasicInfoValue } from './CustomerHeader';
import { ConnectionLineProvider } from '../contexts/ConnectionLineProvider';
import ConnectionLines from './ConnectionLines';
import { Id } from '@/convex/_generated/dataModel';

interface Props {
  customer: Customer & { customer_progress?: CustomerProgress[] };
  progress?: CustomerProgress;
  cardNumber: number;
  isNew?: boolean;
  onDelete?: () => void;
}

const defaultStageData: StageData = {} as StageData;

const defaultAchievements: Achievements = {
  basicTraining: false,
  standardProtocol: false,
  expertCourse: false,
};

export default function CustomerCard({ customer, cardNumber, isNew, onDelete }: Props) {
  const initialProgress: CustomerProgress = customer.customer_progress?.[0] || {
    id: 'temp-' + customer.id,
    customerId: customer.id.toString(),
    stageData: defaultStageData,
    achievements: defaultAchievements,
    updatedAt: null,
  };

  const [localProgress, setLocalProgress] = useState<CustomerProgress>(initialProgress);
  const { updateProgress } = useUpdateCustomerProgress();
  const { updateCustomer } = useUpdateCustomer();

  const debouncedSave = useCallback(
    debounce((p: CustomerProgress) => {
      updateProgress({
        customerId: customer.id as Id<'customers'>,
        stageData: p.stageData,
        achievements: p.achievements,
      });
    }, 1000),
    [customer.id, updateProgress]
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
      updateCustomer({
        customerId: customer.id as Id<'customers'>,
        updates: {
          shopName: info.shopName,
          phone: info.phone,
          region: info.region,
          placeAddress: info.placeAddress,
          assignee: info.assignee,
          manager: info.manager,
        },
      });
    }, 1000),
    [updateCustomer]
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
          />
        </div>
      </ConnectionLineProvider>
    </div>
  );
}
