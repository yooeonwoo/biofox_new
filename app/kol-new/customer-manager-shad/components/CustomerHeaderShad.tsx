"use client";

import { Customer, CustomerProgress, StageData } from "@/lib/types/customer";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  customer: Customer;
  progress: CustomerProgress;
  cardNumber: number;
  basicInfo: any;
  onBasicInfoChange: (info: any) => void;
}

function getCompletedCount(stageData: StageData): number {
  if (!stageData) return 0;
  return (
    [
      stageData.inflow,
      stageData.contract,
      stageData.delivery,
      stageData.educationNotes,
      stageData.growth,
      stageData.expert,
    ].filter(Boolean).length || 0
  );
}

export default function CustomerHeaderShad({ customer, progress, cardNumber, basicInfo, onBasicInfoChange }: Props) {
  const completed = getCompletedCount(progress?.stageData || ({} as StageData));
  const percent = (completed / 6) * 100;

  const setField = (field: string, val: string) => {
    onBasicInfoChange({ ...basicInfo, [field]: val });
  };

  return (
    <div className="mb-4 rounded-lg border bg-muted/40 p-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow">
            {cardNumber}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{customer.name}</h3>
            {(() => {
              const ach = progress?.achievements;
              const level = ach?.expertCourse
                ? 3
                : ach?.standardProtocol
                ? 2
                : ach?.basicTraining
                ? 1
                : 0;
              return (
                <div className="flex items-center gap-1">
                  {Array.from({ length: level }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className="fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="text-right space-y-1">
          {customer.manager && <div className="text-sm">담당자 : {customer.manager}</div>}
          {customer.assignee && <div className="text-xs text-muted-foreground">배정자 : {customer.assignee}</div>}
        </div>
      </div>

      <hr className="my-3" />

      {/* Form rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="min-w-[40px]">샵명:</span>
          <Input className="h-7 flex-1" value={basicInfo.shopName || ""} onChange={(e) => setField("shopName", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[30px]">번호:</span>
          <Input className="h-7 flex-1" value={basicInfo.phone || ""} onChange={(e) => setField("phone", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[30px]">지역:</span>
          <Input className="h-7 flex-1" value={basicInfo.region || ""} onChange={(e) => setField("region", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[70px]">플레이스 주소:</span>
          <Input className="h-7 flex-1" value={basicInfo.placeAddress || ""} onChange={(e) => setField("placeAddress", e.target.value)} />
        </div>
      </div>

      {/* 진행률 바 */}
      <Progress value={percent} className="mt-2" />
    </div>
  );
} 