import React, { useRef, useContext, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ConnectionLineContext } from "../../contexts/ConnectionLineContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

/**
 * ContractStageShad
 * 기존 ContractStage 와 동일한 기능 + shadcn 디자인 적용.
 */
export default function ContractStageShad({ value, onChange }: Props) {
  const current = value || {};
  const context = useContext(ConnectionLineContext);

  const buttonRefs = {
    buy: useRef<HTMLButtonElement>(null),
    deposit: useRef<HTMLButtonElement>(null),
    reject: useRef<HTMLButtonElement>(null),
  };

  useEffect(() => {
    if (context) {
      Object.entries(buttonRefs).forEach(([key, ref]) => {
        context.registerButton(`contract-${key}`, ref);
      });
    }
    return () => {
      if (context) {
        Object.keys(buttonRefs).forEach(key => {
          context.unregisterButton(`contract-${key}`);
        });
      }
    };
  }, [context]);

  const setType = (tp: ContractStageValue["type"] | undefined) => {
    if (!tp) onChange(undefined);
    else onChange({ ...current, type: tp });
  };

  const setField = (field: keyof ContractStageValue, value: string) => {
    onChange({ ...current, [field]: value });
  };

  return (
    <div className="stage-block flex flex-col gap-2 border rounded-md p-3 text-xs bg-card">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-2">
        {/* 구매 */}
        <div className="flex flex-col gap-1">
          <Button
            ref={buttonRefs.buy}
            variant={current.type === "buy" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setType(current.type === "buy" ? undefined : "buy")}
          >
            {BTN.buy.label}
          </Button>
          <Input
            type="date"
            className="text-xs h-7 border-gray-200"
            value={current.buyDate || ""}
            onChange={(e) => setField("buyDate", e.target.value)}
          />
          <Input
            type="number"
            placeholder="금액(만원)"
            className="text-xs h-7 border-gray-200"
            value={current.buyAmount || ""}
            onChange={(e) => setField("buyAmount", e.target.value)}
          />
        </div>

        {/* 계약금 */}
        <div className="flex flex-col gap-1">
          <Button
            ref={buttonRefs.deposit}
            variant={current.type === "deposit" ? "default" : "outline"}
            size="sm"
            className="text-xs h-8"
            onClick={() => setType(current.type === "deposit" ? undefined : "deposit")}
          >
            {BTN.deposit.label}
          </Button>
          <Input
            type="date"
            className="text-xs h-7 border-gray-200"
            value={current.depositDate || ""}
            onChange={(e) => setField("depositDate", e.target.value)}
          />
          <Input
            type="number"
            placeholder="금액(만원)"
            className="text-xs h-7 border-gray-200"
            value={current.depositAmount || ""}
            onChange={(e) => setField("depositAmount", e.target.value)}
          />
        </div>

        {/* 거절 */}
        <div className="flex flex-col gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                ref={buttonRefs.reject}
                variant={current.type === "reject" ? "destructive" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={(e) => {
                  if (current.type === "reject") {
                    e.preventDefault();
                    setType(undefined);
                  }
                }}
              >
                {BTN.reject.label}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>거절 처리하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다. 고객을 '거절' 상태로 변경하고 관련 정보를 기록합니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => setType("reject")}>
                  확인
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Input
            type="date"
            className="text-xs h-7 border-gray-200"
            value={current.rejectDate || ""}
            onChange={(e) => setField("rejectDate", e.target.value)}
          />
          <div className="flex flex-col justify-between flex-grow">
            <Input
              placeholder="거절사유"
              className="text-xs h-7 border-gray-200"
              value={current.rejectReason || ""}
              onChange={(e) => setField("rejectReason", e.target.value)}
            />
            <div className="flex items-center justify-end gap-1 mt-auto pt-1">
              <Checkbox
                id={`ad-add-${BTN.reject.label}`}
                checked={current.rejectAd}
                onCheckedChange={(c) => onChange({ ...current, rejectAd: !!c })}
              />
              <label htmlFor={`ad-add-${BTN.reject.label}`} className="text-xs font-normal">광고추가</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 