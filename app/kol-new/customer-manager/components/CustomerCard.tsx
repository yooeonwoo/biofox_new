"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Customer, CustomerProgress, StageData, Achievements } from "@/lib/types/customer";
import CustomerHeader from "./CustomerHeader";
import StageBlocks from "./StageBlocks";
import ConnectionLines from "./ConnectionLines";
import { useUpdateCustomer } from "@/lib/hooks/customers";
import { debounce } from "@/lib/utils";
import BasicInfoStage, { BasicInfoValue } from "./stages/BasicInfoStage";

interface Props {
  customer: Customer & { customer_progress?: CustomerProgress[] };
  progress?: CustomerProgress;
  cardNumber: number;
}

const defaultStageData: StageData = {} as StageData;

const defaultAchievements: Achievements = {
  basicTraining: false,
  standardProtocol: false,
  expertCourse: false,
};

export default function CustomerCard({ customer, cardNumber }: Props) {
  const initialProgress: CustomerProgress =
    customer.customer_progress?.[0] || {
      id: "temp-" + customer.id,
      customerId: customer.id,
      stageData: defaultStageData,
      achievements: defaultAchievements,
      updatedAt: null,
    };

  const [localProgress, setLocalProgress] = useState<CustomerProgress>(initialProgress);

  const updateMutation = useUpdateCustomer();

  const debouncedSave = useCallback(
    debounce((p: CustomerProgress) => {
      updateMutation.mutate({ customerId: customer.id, progress: p });
    }, 1000),
    [customer.id]
  );

  // 저장 사이드이펙트
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

  const cardRef = useRef<HTMLDivElement>(null);

  const [basicInfo, setBasicInfo] = useState<BasicInfoValue>({
    shopName: customer.shopName,
    phone: customer.phone,
    region: customer.region,
    placeAddress: customer.placeAddress,
    assignee: customer.assignee,
    manager: customer.manager,
  });

  // Save basic info debounce
  const debouncedSaveInfo = useCallback(
    debounce((info: BasicInfoValue) => {
      // TODO: update customer table via mutation
    }, 1000),
    [],
  );

  useEffect(() => {
    debouncedSaveInfo(basicInfo);
  }, [basicInfo, debouncedSaveInfo]);

  return (
    <div
      ref={cardRef}
      className="relative bg-white border-2 border-black rounded-xl p-4 mb-5 max-w-full md:max-w-4xl mx-auto"
    >
      <ConnectionLines cardRef={cardRef} />
      <CustomerHeader
        customer={customer}
        progress={localProgress}
        cardNumber={cardNumber}
        basicInfo={basicInfo}
        onBasicInfoChange={setBasicInfo}
      />

      <StageBlocks stageData={localProgress.stageData} onStageChange={handleStageChange} />
    </div>
  );
} 