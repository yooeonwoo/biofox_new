import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface GrowthStageValue {
  personalLevel?: number;
  customerProgress?: Record<string, number[]>;
  learningProgress?: Record<string, number>;
  evaluationScores?: Record<string, number>;
  salesData?: number[];
}

interface Props {
  value: GrowthStageValue | undefined;
  onChange: (val: GrowthStageValue | undefined) => void;
}

const LEARNING_MAX: Record<string, number> = {
  홍조: 8,
  기미: 12,
  브리핑: 6,
  여드름: 8,
};

const EVAL_ITEMS = ["모의 테스트", "평가 테스트", "튜터링"] as const;

function defaultValue(): GrowthStageValue {
  return {
    personalLevel: 0,
    customerProgress: {},
    learningProgress: Object.fromEntries(Object.keys(LEARNING_MAX).map((k) => [k, 0])),
    evaluationScores: Object.fromEntries(EVAL_ITEMS.map((k) => [k, 0])),
    salesData: [320, 280, 450, 380, 520, 480, 610, 580, 530, 620, 580, 650],
  } as GrowthStageValue;
}

/**
 * GrowthStageShad – 기존 GrowthStage 를 그대로 사용하되 컨테이너 배경/테두리만 shad 토큰으로 조정.
 */
export default function GrowthStageShad({ value, onChange }: Props) {
  const current = { ...defaultValue(), ...(value || {}) };

  const setPersonalLevel = (lvl: number) => {
    onChange({ ...current, personalLevel: lvl });
  };

  const toggleCustomerProgress = (idx: number, progIdx: number) => {
    const key = `customer-${idx}`;
    const arr = current.customerProgress?.[key] || [];
    const newArr = arr.includes(progIdx) ? arr.filter((i) => i !== progIdx) : [...arr, progIdx];
    onChange({
      ...current,
      customerProgress: { ...current.customerProgress, [key]: newArr },
    });
  };

  const setLearningProgress = (subject: string, val: number) => {
    onChange({
      ...current,
      learningProgress: { ...current.learningProgress, [subject]: val },
    });
  };

  const setScore = (item: string, score: number) => {
    onChange({
      ...current,
      evaluationScores: { ...current.evaluationScores, [item]: score },
    });
  };

  const totalLearning = useMemo(() => {
    const cur = Object.values(current.learningProgress!).reduce((a, b) => a + b, 0);
    const max = Object.entries(LEARNING_MAX).reduce((a, [, m]) => a + m, 0);
    return {
      current: cur,
      max,
      percent: max > 0 ? (cur / max) * 100 : 0,
    };
  }, [current.learningProgress]);

  const averageScore = useMemo(() => {
    const scores = Object.values(current.evaluationScores!);
    const valid = scores.filter((s) => s > 0);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  }, [current.evaluationScores]);

  return (
    <div className="stage-block border rounded-md p-3 flex flex-col gap-4 text-xs bg-card">
      {/* 임상 */}
      <div className="p-3 border rounded-md bg-muted/20">
        <h5 className="text-sm font-medium mb-3">임상</h5>

        {/* 본인 */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">👤 본인</span>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
            보러가기
          </Button>
        </div>

        <div className="flex gap-1 mb-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <button
              key={i}
              className={`w-6 h-6 border rounded flex items-center justify-center ${i < (current.personalLevel || 0) ? "bg-foreground text-background" : "bg-background"}`}
              onClick={() => setPersonalLevel(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Progress value={((current.personalLevel || 0) / 10) * 100} />

        {/* 고객 */}
        <div className="flex justify-between items-center mt-4 mb-2">
          <span className="text-sm font-medium">👥 고객</span>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
            보러가기
          </Button>
        </div>

        <div className="space-y-2">
          {[0, 1].map((row) => (
            <div key={row} className="flex gap-1 justify-between">
              {Array.from({ length: 5 }).map((_, idx) => {
                const customerIdx = row * 5 + idx;
                return (
                  <div key={customerIdx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{customerIdx + 1}</span>
                    <div className="flex gap-0.5 border rounded p-0.5">
                      {Array.from({ length: 3 }).map((_, progIdx) => (
                        <button
                          key={progIdx}
                          className={`w-3 h-3 border rounded ${current.customerProgress?.[`customer-${customerIdx}`]?.includes(progIdx) ? "bg-foreground" : "bg-background"}`}
                          aria-label={`고객 ${customerIdx + 1} 단계 ${progIdx + 1}`}
                          onClick={() => toggleCustomerProgress(customerIdx, progIdx)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 학습 진도 */}
      <div className="p-3 rounded-md border bg-green-50/40 border-green-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">학습 진도</span>
          <div className="flex items-center gap-2">
            <Progress value={totalLearning.percent} className="h-1 w-16" />
            <span>
              {totalLearning.current}/{totalLearning.max}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {Object.entries(LEARNING_MAX).map(([subject, max]) => (
            <div key={subject} className="flex-1">
              <div className="text-center mb-1">{subject}</div>
              <div
                className="h-6 bg-muted border rounded relative cursor-pointer"
                onClick={(e) => {
                  const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  const newVal = Math.max(0, Math.min(max, Math.round(ratio * max)));
                  setLearningProgress(subject, newVal);
                }}
              >
                <div
                  className="absolute inset-0 bg-green-500"
                  style={{ width: `${((current.learningProgress?.[subject] || 0) / max) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-medium">
                  {current.learningProgress?.[subject] || 0}/{max}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 평가 */}
      <div className="p-3 rounded-md border bg-yellow-50/40 border-yellow-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">평가</span>
          <span className="text-xs">평균: {averageScore}점</span>
        </div>
        <div className="flex gap-2">
          {EVAL_ITEMS.map((item) => (
            <div key={item} className="flex-1">
              <div className="text-center mb-1">{item}</div>
              <Input
                type="number"
                min={0}
                max={100}
                value={current.evaluationScores?.[item] || ""}
                onChange={(e) => setScore(item, parseInt(e.target.value) || 0)}
                className="h-7 text-center text-[10px]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 매출 */}
      <div className="p-3 rounded-md border bg-purple-50/40 border-purple-200">
        <div className="font-medium mb-2">매출 (최근 12개월)</div>
        {(() => {
          const arr = current.salesData!;
          const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
          const last = arr[arr.length - 1];
          const prev = arr[arr.length - 2] || last;
          const diff = Math.round(((last - prev) / prev) * 100);
          return (
            <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
              <div className="bg-blue-500 text-white rounded p-2">
                평균 매출<br />
                <span className="font-semibold text-sm">{avg}만원</span>
              </div>
              <div className={`${diff >= 0 ? "bg-emerald-500" : "bg-red-500"} text-white rounded p-2`}>
                전월 매출<br />
                <span className="font-semibold text-sm">{last}만원</span> ({diff >= 0 ? "+" : ""}
                {diff}%)
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
} 