"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface GrowthSectionProps {
  progressValues: Record<string, number>;
  customerProgress: Record<string, number[]>;
  learningProgress: Record<string, number>;
  evaluationScores: Record<string, number>;
  achievements: Record<string, boolean>;

  onProgressClick: (type: string, index: number) => void;
  onCustomerProgressClick: (customerIndex: number, progressIndex: number) => void;
  onLearningProgressClick: (subject: string, event: React.MouseEvent) => void;
  onScoreChange: (evalType: string, value: string) => void;
  onAchievementChange: (key: string, checked: boolean) => void;
  
  cardNumber: number;
}

const learningMaxProgress = { '홍조': 8, '기미': 12, '브리핑': 6, '여드름': 8 };

export default function GrowthSection({
  progressValues,
  customerProgress,
  learningProgress,
  evaluationScores,
  achievements,
  onProgressClick,
  onCustomerProgressClick,
  onLearningProgressClick,
  onScoreChange,
  onAchievementChange,
  cardNumber,
}: GrowthSectionProps) {

  const totalLearningProgress = useMemo(() => {
    const currentTotal = Object.values(learningProgress).reduce((sum, current) => sum + current, 0);
    const maxTotal = Object.values(learningMaxProgress).reduce((sum, max) => sum + max, 0);
    const percentage = maxTotal > 0 ? (currentTotal / maxTotal) * 100 : 0;
    return { currentTotal, maxTotal, percentage };
  }, [learningProgress]);

  const averageScore = useMemo(() => {
    const scores = Object.values(evaluationScores);
    const validScores = scores.filter(score => score > 0);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
  }, [evaluationScores]);

  return (
    <div className="space-y-6">
      {/* 임상 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-blue-800 border-b border-blue-200 pb-2">임상</h4>
        <div className="bg-white p-3 rounded-md border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm">👤 본인</span>
            <Button variant="outline" size="sm" className="text-xs h-6 px-2">보러가기</Button>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <button
                key={`personal-${i}`}
                className={`flex-1 h-8 border border-black rounded text-xs flex items-center justify-center cursor-pointer transition-colors ${
                  i < (progressValues.personal || 0) ? 'bg-black text-white' : 'bg-white text-black'
                }`}
                onClick={() => onProgressClick('personal', i)}
              >{i + 1}</button>
            ))}
          </div>
        </div>
        <div className="bg-white p-3 rounded-md border">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm">👥 고객</span>
            <Button variant="outline" size="sm" className="text-xs h-6 px-2">보러가기</Button>
          </div>
          <div className="space-y-2">
            {[...Array(2)].map((_, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 justify-between">
                {Array.from({ length: 5 }, (_, customerIndex) => {
                  const actualIndex = rowIndex * 5 + customerIndex;
                  return (
                    <div key={actualIndex} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500">{actualIndex + 1}</span>
                      <div className="flex gap-0.5 border border-gray-300 rounded p-1">
                        {[...Array(3)].map((_, progressIndex) => (
                          <button
                            key={progressIndex}
                            aria-label={`Customer ${actualIndex + 1} Progress ${progressIndex + 1}`}
                            className={`w-4 h-4 border border-black rounded-sm text-xs flex items-center justify-center cursor-pointer transition-colors ${
                              customerProgress[`customer-${actualIndex}`]?.includes(progressIndex) 
                                ? 'bg-black text-white' : 'bg-white'
                            }`}
                            onClick={() => onCustomerProgressClick(actualIndex, progressIndex)}
                          ></button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 학습 진도 */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-green-800 border-b border-green-200 pb-2">
          <h4 className="text-md font-semibold">학습 진도</h4>
          <div className="flex items-center gap-2">
            <Progress value={totalLearningProgress.percentage} className="h-1.5 w-20 [&>div]:bg-green-600" />
            <span className="text-xs font-medium whitespace-nowrap">{totalLearningProgress.currentTotal}/{totalLearningProgress.maxTotal}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(learningMaxProgress).map(([subject, max]) => (
            <div key={subject}>
              <div className="text-xs text-gray-700 mb-1 text-center">{subject}</div>
              <div className="h-8 border border-gray-300 rounded cursor-pointer relative overflow-hidden bg-gray-100 hover:bg-gray-200" onClick={(e) => onLearningProgressClick(subject, e)}>
                <div className="absolute inset-0 bg-green-500 transition-all" style={{ width: `${(learningProgress[subject] / max) * 100}%` }}/>
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <span className="text-xs font-medium text-gray-800">{learningProgress[subject] || 0}/{max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 평가 */}
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center text-yellow-800 border-b border-yellow-200 pb-2">
          <h4 className="text-md font-semibold">평가</h4>
          <span className="text-sm font-medium">평균: {averageScore}점</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(evaluationScores).map(([evalType]) => (
            <div key={evalType}>
              <div className="text-xs text-gray-700 mb-1 text-center">{evalType}</div>
              <div className="h-9 border border-gray-300 rounded bg-gray-100 flex items-center justify-center px-2">
                <Input type="number" min="0" max="100" className="text-xs h-7 w-full text-center border-0 bg-transparent p-0" value={evaluationScores[evalType] > 0 ? evaluationScores[evalType] : ''} placeholder="점수" onChange={(e) => onScoreChange(evalType, e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 본사 표준 프로토콜 체크박스 */}
      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2">
            <Checkbox id={`standard-protocol-${cardNumber}`} checked={achievements['standard-protocol']} onCheckedChange={(checked) => onAchievementChange('standard-protocol', !!checked)} className="w-4 h-4" />
            <label htmlFor={`standard-protocol-${cardNumber}`} className="text-sm text-gray-700">본사 표준 프로토콜을 잘 따르는가?</label>
            <div className="flex gap-1 ml-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-yellow-500">⭐</span>
            </div>
          </div>
      </div>
    </div>
  );
} 