import React, { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CustomerMiniProgress from "@/components/CustomerMiniProgress";

export interface GrowthStageValue {
  clinicalProgress?: {
    personal: number;
    customers: number[];
  };
  learningProgress?: {
    [key: string]: { value: number; max: number; label: string };
  };
  evaluationScores?: {
    [key: string]: number;
  };
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
    clinicalProgress: {
      personal: 0,
      customers: [],
    },
    learningProgress: Object.fromEntries(Object.keys(LEARNING_MAX).map((k) => [k, { value: 0, max: LEARNING_MAX[k], label: k }])),
    evaluationScores: Object.fromEntries(EVAL_ITEMS.map((k) => [k, 0])),
    salesData: [320, 280, 450, 380, 520, 480, 610, 580, 530, 620, 580, 650],
  } as GrowthStageValue;
}

/**
 * GrowthStageShad – 기존 GrowthStage 를 그대로 사용하되 컨테이너 배경/테두리만 shad 토큰으로 조정.
 */
export default function GrowthStage({ value, onChange }: Props) {
  const current = { ...defaultValue(), ...(value || {}) };

  const setPersonalLevel = (lvl: number) => {
    onChange({ ...current, clinicalProgress: { ...current.clinicalProgress, personal: lvl, customers: current.clinicalProgress?.customers || [] } });
  };

  const toggleCustomerProgress = (idx: number, progIdx: number) => {
    const customersProgress = [...(current.clinicalProgress?.customers || [])];
    while (customersProgress.length <= idx) {
      customersProgress.push(0);
    }
    
    if (customersProgress[idx] === progIdx + 1) {
      customersProgress[idx] = progIdx;
    } else {
      customersProgress[idx] = progIdx + 1;
    }

    onChange({
      ...current,
      clinicalProgress: { personal: current.clinicalProgress?.personal || 0, customers: customersProgress },
    });
  };

  const setLearningProgress = (subject: string, val: number) => {
    onChange({
      ...current,
      learningProgress: { ...current.learningProgress, [subject]: { ...current.learningProgress![subject], value: val } },
    });
  };

  const setScore = (item: string, score: number) => {
    onChange({
      ...current,
      evaluationScores: { ...current.evaluationScores, [item]: score },
    });
  };

  const totalLearning = useMemo(() => {
    const cur = Object.values(current.learningProgress!).reduce((a, b) => a + b.value, 0);
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

  const chartData = useMemo(() => {
    return (current.salesData || []).map((sales, i) => ({
      name: `${i + 1}월`,
      sales,
    }));
  }, [current.salesData]);

  const totalLearningProgress = useMemo(() => {
    if(!current.learningProgress) return { current: 0, max: 0, percentage: 0 };
    const max = Object.values(current.learningProgress).reduce((a,b) => a+b.max, 0);
    const val = Object.values(current.learningProgress).reduce((a,b) => a+b.value, 0);
    return {
      current: val,
      max,
      percentage: max > 0 ? (val / max) * 100 : 0
    }
  }, [current.learningProgress]);

  return (
    <div className="stage-block border rounded-md p-3 flex flex-col gap-4 text-xs bg-card">
      {/* 임상 */}
      <div className="p-3 border rounded-md bg-muted/20">
        <h5 className="text-sm font-medium mb-3">임상</h5>

        {/* 본인 임상 */}
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">👤 본인</span>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">보러가기</Button>
        </div>
        <div className="relative h-6 w-full bg-gray-200 rounded-full cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const newLevel = Math.round((clickX / rect.width) * 10);
          setPersonalLevel(Math.min(10, Math.max(0, newLevel)));
        }}>
          <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all" style={{width: `${(current.clinicalProgress?.personal || 0) * 10}%`}}></div>
          <div className="absolute inset-0 flex justify-between items-center px-2">
            {Array.from({length: 10}).map((_, i) => (
              <span key={i} className="text-xs text-white mix-blend-difference">{i+1}</span>
            ))}
          </div>
        </div>

        {/* 고객 임상 */}
        <div className="flex justify-between items-center mt-4 mb-2">
          <span className="text-sm font-medium">👥 고객&nbsp;(3회&nbsp;10명)</span>
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">보러가기</Button>
        </div>
        <CustomerMiniProgress 
          customers={Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            completed: (current.clinicalProgress?.customers?.[i] || 0) as 0 | 1 | 2 | 3
          }))}
          onProgressClick={toggleCustomerProgress}
        />
      </div>

      {/* 학습 진도 */}
      <div className="p-3 rounded-md border bg-green-50/40 border-green-200">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">학습 진도</span>
          <div className="flex items-center gap-2">
            <Progress value={totalLearningProgress.percentage} className="h-1 w-16" />
            <span className="text-[11px]">{totalLearningProgress.current}/{totalLearningProgress.max}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(current.learningProgress || {}).map(([key, p]) => (
            <div key={key} className="flex-1 min-w-[60px]">
              <div className="text-center mb-1 text-muted-foreground text-[11px]">{p.label}</div>
              <div className="h-8 bg-gray-200 border border-gray-300 rounded relative cursor-pointer flex items-center justify-center text-[10px] font-medium">
                {p.value}/{p.max}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.entries(current.evaluationScores || {}).map(([key, score]) => (
            <div key={key} className="flex-1 min-w-[60px]">
              <div className="text-center mb-1 text-muted-foreground text-[11px]">{key}</div>
              <Input
                type="number"
                min="0"
                max="100"
                className="text-xs h-8 w-full text-center border-gray-200 bg-white"
                value={score > 0 ? score : ""}
                placeholder="점수"
                onChange={(e) => setScore(key, parseInt(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 매출 */}
      <div className="p-3 rounded-md border bg-purple-50/40 border-purple-200">
        <div className="font-medium mb-2">매출 (최근 12개월)</div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip 
                contentStyle={{ fontSize: '12px', padding: '5px' }}
                formatter={(value: number) => [`${value}만원`, '매출']}
              />
              <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {(() => {
          const arr = current.salesData!;
          const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
          const last = arr[arr.length - 1];
          const prev = arr[arr.length - 2] || last;
          const diff = prev !== 0 ? Math.round(((last - prev) / prev) * 100) : 0;
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center text-[11px] mt-3">
              <div className="bg-blue-600 text-white rounded-lg p-2 shadow-sm">
                평균 매출<br />
                <span className="font-semibold text-sm">{avg}만원</span>
              </div>
              <div className={`${diff >= 0 ? "bg-green-500" : "bg-red-500"} text-white rounded-lg p-2 shadow-sm`}>
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