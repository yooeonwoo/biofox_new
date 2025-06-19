"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Customer, CustomerProgress, StageData, Achievements } from "@/lib/types/customer";
import StageBlocks from "./StageBlocks";
import { useUpdateCustomer } from "@/lib/hooks/customers";
import { debounce } from "@/lib/utils";
import CustomerHeader, { BasicInfoValue } from "./CustomerHeader";
import { useUpdateCustomerInfo } from "@/lib/hooks/customer-info";
import { ConnectionLineProvider } from "../contexts/ConnectionLineProvider";
import ConnectionLines from "./ConnectionLines";

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
  const initialProgress: CustomerProgress =
    customer.customer_progress?.[0] || {
      id: "temp-" + customer.id,
      customerId: customer.id.toString(),
      stageData: defaultStageData,
      achievements: defaultAchievements,
      updatedAt: null,
    };

  const [localProgress, setLocalProgress] = useState<CustomerProgress>(initialProgress);
  const updateMutation = useUpdateCustomer();

  const debouncedSave = useCallback(
    debounce((p: CustomerProgress) => {
      updateMutation.mutate({ customerId: customer.id.toString(), progress: p });
    }, 1000),
    [customer.id]
  );

  useEffect(() => {
    debouncedSave(localProgress);
  }, [localProgress, debouncedSave]);

  function handleStageChange(stageKey: keyof StageData, value: any) {
    setLocalProgress((prev) => ({
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

  const updateInfoMutation = useUpdateCustomerInfo();
  const debouncedSaveInfo = useCallback(
    debounce((info: BasicInfoValue) => {
      updateInfoMutation.mutate({ customerId: customer.id.toString(), info });
    }, 1000),
    []
  );

  useEffect(() => {
    debouncedSaveInfo(basicInfo);
  }, [basicInfo, debouncedSaveInfo]);

  function handleAchievementChange(newAch: Achievements) {
    setLocalProgress((prev) => ({ ...prev, achievements: newAch }));
  }

  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={cardRef} className="relative bg-card border rounded-xl p-4 mb-5 max-w-full md:max-w-4xl mx-auto shadow">
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
        <StageBlocks
          stageData={localProgress.stageData}
          onStageChange={handleStageChange}
          achievements={localProgress.achievements}
          onAchievementsChange={handleAchievementChange}
        />
      </ConnectionLineProvider>
    </div>
  );
} 