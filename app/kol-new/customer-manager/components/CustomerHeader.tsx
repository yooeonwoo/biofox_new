"use client";

import { Customer, CustomerProgress, StageData } from "@/lib/types/customer";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface Props {
  customer: Customer;
  progress: CustomerProgress;
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

export default function CustomerHeader({ customer, progress }: Props) {
  const completed = getCompletedCount(progress?.stageData || {} as StageData);
  const percent = (completed / 6) * 100;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {/* 이름 & 전화 */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{customer.name}</h3>
          {customer.phone && <p className="text-sm text-gray-600">{customer.phone}</p>}
        </div>
        {/* 성취 배지 */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* 진행률 바 */}
      <Progress value={percent} />
    </div>
  );
} 