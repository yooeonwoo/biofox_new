import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export interface ContractStageValue {
  type?: "buy" | "deposit" | "reject";
  buyDate?: string;
  buyAmount?: string;
  depositDate?: string;
  depositAmount?: string;
  rejectDate?: string;
  rejectReason?: string;
  rejectAd?: boolean;
  memo?: string;
}

interface Props {
  value: ContractStageValue | undefined;
  onChange: (val: ContractStageValue | undefined) => void;
}

const BTN: Record<string, { label: string; value: ContractStageValue["type"] }> = {
  buy: { label: "구매", value: "buy" },
  deposit: { label: "계약금", value: "deposit" },
  reject: { label: "거절", value: "reject" },
};

export default function ContractStage({ value, onChange }: Props) {
  const current = value || {};

  const setType = (tp: ContractStageValue["type"] | undefined) => {
    if (!tp) onChange(undefined);
    else onChange({ ...current, type: tp });
  };

  return (
    <div className="stage-block flex flex-col gap-2 border border-gray-200 rounded-md p-3 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* 구매 */}
        <div className="flex flex-col gap-1">
          <Button
            variant={current.type === "buy" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setType(current.type === "buy" ? undefined : "buy")}
          >
            {BTN.buy.label}
          </Button>
          <Input
            placeholder="날짜"
            className="text-xs h-7 w-full"
            value={current.buyDate || ""}
            onChange={(e) => onChange({ ...current, buyDate: e.target.value })}
          />
          <Input
            placeholder="금액"
            className="text-xs h-7 w-full"
            value={current.buyAmount || ""}
            onChange={(e) => onChange({ ...current, buyAmount: e.target.value })}
          />
        </div>

        {/* 계약금 */}
        <div className="flex flex-col gap-1">
          <Button
            variant={current.type === "deposit" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setType(current.type === "deposit" ? undefined : "deposit")}
          >
            {BTN.deposit.label}
          </Button>
          <Input
            placeholder="날짜"
            className="text-xs h-7 w-full"
            value={current.depositDate || ""}
            onChange={(e) => onChange({ ...current, depositDate: e.target.value })}
          />
          <Input
            placeholder="금액"
            className="text-xs h-7 w-full"
            value={current.depositAmount || ""}
            onChange={(e) => onChange({ ...current, depositAmount: e.target.value })}
          />
        </div>

        {/* 거절 */}
        <div className="flex flex-col gap-1">
          <Button
            variant={current.type === "reject" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setType(current.type === "reject" ? undefined : "reject")}
          >
            {BTN.reject.label}
          </Button>
          <Input
            placeholder="날짜"
            className="text-xs h-7 w-full"
            value={current.rejectDate || ""}
            onChange={(e) => onChange({ ...current, rejectDate: e.target.value })}
          />
          <Input
            placeholder="사유"
            className="text-xs h-7 w-full"
            value={current.rejectReason || ""}
            onChange={(e) => onChange({ ...current, rejectReason: e.target.value })}
          />
          <div className="flex items-center gap-1 justify-end">
            <Checkbox
              checked={current.rejectAd || false}
              onCheckedChange={(checked) => onChange({ ...current, rejectAd: !!checked })}
              className="w-4 h-4"
              id="reject-ad"
            />
            <label htmlFor="reject-ad" className="text-xs">광고추가</label>
          </div>
        </div>
      </div>
    </div>
  );
} 