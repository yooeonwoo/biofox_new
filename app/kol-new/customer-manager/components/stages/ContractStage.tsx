import React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

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

  const [memoOpen, setMemoOpen] = useState(false);

  const setType = (tp: ContractStageValue["type"] | undefined) => {
    if (!tp) onChange(undefined);
    else onChange({ ...current, type: tp });
  };

  return (
    <div className="stage-block flex flex-col gap-2 border border-gray-200 rounded-md p-3 relative text-xs">
      {/* 메모 토글 */}
      <button
        aria-label={memoOpen ? "메모 닫기" : "메모 열기"}
        className="absolute top-2 right-2 text-gray-500 hover:text-blue-600 transition-colors"
        onClick={() => setMemoOpen((o) => !o)}
      >
        <Pencil size={14} />
      </button>

      {/* 메모 영역 */}
      <div
        className={`border border-gray-300 rounded-md bg-gray-50 overflow-hidden transition-[max-height,padding] duration-300 ${memoOpen ? "max-h-40 p-2 mt-7" : "max-h-0 p-0"}`}
      >
        <Textarea
          value={current.memo || ""}
          onChange={(e) => onChange({ ...current, memo: e.target.value })}
          placeholder="이 섹션에 대한 메모를 입력하세요..."
          className="h-24 text-xs"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
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