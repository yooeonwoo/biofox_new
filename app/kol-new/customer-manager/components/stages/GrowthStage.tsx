import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface GrowthStageValue {
  // 1) 임상 – 본인 진행도 (0~10)
  personalLevel?: number;
  // 1) 임상 – 고객별 진행도 (customer-0~9 : 완료 인덱스 배열)
  customerProgress?: Record<string, number[]>;
  // 2) 학습 진도 – 과목별 현재 진행도
  learningProgress?: Record<string, number>;
  // 3) 평가 점수 – 항목별 0~100
  evaluationScores?: Record<string, number>;
  // 4) 매출 – 12개월 월별 매출(만원)
  salesData?: number[];
}

interface Props {
  value: GrowthStageValue | undefined;
  onChange: (val: GrowthStageValue | undefined) => void;
}

// 과목별 최대 진도 정의 (고정)
const LEARNING_MAX: Record<string, number> = {
  홍조: 8,
  기미: 12,
  브리핑: 6,
  여드름: 8,
};

// 평가 항목 목록
const EVAL_ITEMS = ["모의 테스트", "평가 테스트", "튜터링"] as const;

// 기본값 생성 헬퍼
function defaultValue(): GrowthStageValue {
  return {
    personalLevel: 0,
    customerProgress: {},
    learningProgress: Object.fromEntries(Object.keys(LEARNING_MAX).map((k) => [k, 0])),
    evaluationScores: Object.fromEntries(EVAL_ITEMS.map((k) => [k, 0])),
    salesData: [320, 280, 450, 380, 520, 480, 610, 580, 530, 620, 580, 650],
  } as GrowthStageValue;
}

export default function GrowthStage({ value, onChange }: Props) {
  const current = { ...defaultValue(), ...(value || {}) };

  // ------------- handlers ------------
  const setPersonalLevel = (lvl: number) => {
    onChange({ ...current, personalLevel: lvl });
  };

  const toggleCustomerProgress = (idx: number, progIdx: number) => {
    const key = `customer-${idx}`;
    const arr = current.customerProgress?.[key] || [];
    const newArr = arr.includes(progIdx)
      ? arr.filter((i) => i !== progIdx)
      : [...arr, progIdx];
    onChange({
      ...current,
      customerProgress: { ...current.customerProgress, [key]: newArr },
    });
  };

  const setLearningProgress = (subject: string, value: number) => {
    onChange({
      ...current,
      learningProgress: { ...current.learningProgress, [subject]: value },
    });
  };

  const setScore = (item: string, score: number) => {
    onChange({
      ...current,
      evaluationScores: { ...current.evaluationScores, [item]: score },
    });
  };

  // ---------- 계산 ------------
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
    <div className="stage-block border border-gray-200 rounded-md p-3 flex flex-col gap-4 text-xs">
      {/* ──────────── 임상 ──────────── */}
      <div className="p-3 border border-gray-300 rounded-md">
        <h5 className="text-sm font-medium mb-3">임상</h5>

        {/* 본인 영역 */}
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
              className={`w-6 h-6 border border-black rounded flex items-center justify-center ${i < (current.personalLevel || 0) ? "bg-black text-white" : "bg-white"}`}
              onClick={() => setPersonalLevel(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <Progress value={((current.personalLevel || 0) / 10) * 100} />

        {/* 고객 영역 */}
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
                    <span className="text-[10px] text-gray-500">{customerIdx + 1}</span>
                    <div className="flex gap-0.5 border border-gray-300 rounded p-0.5">
                      {Array.from({ length: 3 }).map((_, progIdx) => (
                        <button
                          key={progIdx}
                          className={`w-3 h-3 border border-black rounded ${current.customerProgress?.[`customer-${customerIdx}`]?.includes(progIdx) ? "bg-black" : "bg-white"}`}
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

      {/* ──────────── 학습 진도 ──────────── */}
      <div className="p-3 bg-green-50 rounded-md border border-green-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">학습 진도</span>
          <div className="flex items-center gap-2">
            <Progress value={totalLearning.percent} className="h-1 w-16" />
            <span>{totalLearning.current}/{totalLearning.max}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {Object.entries(LEARNING_MAX).map(([subject, max]) => (
            <div key={subject} className="flex-1">
              <div className="text-center mb-1">{subject}</div>
              <div
                className="h-6 bg-gray-100 border border-gray-300 rounded relative cursor-pointer"
                onClick={(e) => {
                  const rect = (e.target as HTMLDivElement).getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  const newVal = Math.max(0, Math.min(max, Math.round(ratio * max)));
                  setLearningProgress(subject, newVal);
                }}
              >
                <div
                  className="absolute inset-0 bg-green-500"
                  style={{ width: `${(current.learningProgress?.[subject] || 0) / max * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-medium">
                  {(current.learningProgress?.[subject] || 0)}/{max}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──────────── 평가 ──────────── */}
      <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
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

      {/* ──────────── 매출 (간략) ──────────── */}
      <div className="p-3 bg-purple-50 rounded-md border border-purple-200">
        <div className="font-medium mb-2">매출 (최근 12개월)</div>
        {/* 평균 & 최근 월 간단 통계 */}
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
              <div className={`rounded p-2 ${diff >= 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                전월 매출<br />
                <span className="font-semibold text-sm">{last}만원</span> ({diff >= 0 ? "+" : ""}{diff}%)
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
