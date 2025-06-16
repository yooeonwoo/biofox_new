import React from "react";
import { Input } from "@/components/ui/input";
import StageWrapper from "./StageWrapper";
import { User } from "lucide-react";

export interface BasicInfoValue {
  shopName?: string;
  phone?: string;
  region?: string;
  placeAddress?: string;
  assignee?: string;
  manager?: string;
}

interface Props {
  value: BasicInfoValue;
  onChange: (val: BasicInfoValue) => void;
}

export default function BasicInfoStage({ value, onChange }: Props) {
  const setField = (field: keyof BasicInfoValue, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <StageWrapper
      title="인적사항"
      number={0}
      accentColor="bg-gray-50"
      icon={<User size={14} className="text-gray-600" />}
    >
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="min-w-[50px]">샵명</span>
          <Input
            className="h-7 flex-1"
            value={value.shopName || ""}
            onChange={(e) => setField("shopName", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[50px]">번호</span>
          <Input
            className="h-7 flex-1"
            value={value.phone || ""}
            onChange={(e) => setField("phone", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[50px]">지역</span>
          <Input
            className="h-7 flex-1"
            value={value.region || ""}
            onChange={(e) => setField("region", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[70px]">플레이스</span>
          <Input
            className="h-7 flex-1"
            value={value.placeAddress || ""}
            onChange={(e) => setField("placeAddress", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[50px]">담당자</span>
          <Input
            className="h-7 flex-1"
            value={value.manager || ""}
            onChange={(e) => setField("manager", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[50px]">배정자</span>
          <Input
            className="h-7 flex-1"
            value={value.assignee || ""}
            onChange={(e) => setField("assignee", e.target.value)}
          />
        </div>
      </div>
    </StageWrapper>
  );
} 