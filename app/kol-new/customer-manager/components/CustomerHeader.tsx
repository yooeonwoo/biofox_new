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

// 단계 완료 개수 계산
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

export default function CustomerHeader({ customer, progress, cardNumber, basicInfo, onBasicInfoChange }: Props) {
  const completed = getCompletedCount(progress?.stageData || {} as StageData);
  const percent = (completed / 6) * 100;

  const setField = (field: string, val: string) => {
    onBasicInfoChange({ ...basicInfo, [field]: val });
  };

  return (
    <div className="mb-4 border border-gray-200 bg-gray-50 rounded-lg p-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold shadow">
            {cardNumber}
          </div>
          <h3 className="text-lg font-semibold">{customer.name}</h3>
        </div>
        <div className="text-right space-y-1">
          {customer.manager && <div className="text-sm">담당자 : {customer.manager}</div>}
          {customer.assignee && <div className="text-xs text-gray-500 opacity-75">배정자 : {customer.assignee}</div>}
        </div>
      </div>

      <hr className="my-3" />

      {/* Form rows */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="min-w-[40px]">샵명:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.shopName || ""}
            onChange={(e) => setField("shopName", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[30px]">번호:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.phone || ""}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[30px]">지역:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.region || ""}
            onChange={(e) => setField("region", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[70px]">플레이스 주소:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.placeAddress || ""}
            onChange={(e) => setField("placeAddress", e.target.value)}
          />
        </div>
      </div>

      {/* 성취 배지 */}
      <div className="flex items-center justify-between gap-2 mt-4">
        {progress?.achievements?.basicTraining && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" /> 기본
          </Badge>
        )}
        {progress?.achievements?.standardProtocol && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" /> 표준
          </Badge>
        )}
        {progress?.achievements?.expertCourse && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" /> 전문가
          </Badge>
        )}
      </div>

      {/* 진행률 바 */}
      <Progress value={percent} />
    </div>
  );
} 