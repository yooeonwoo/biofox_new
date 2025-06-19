"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

interface AchievementSectionProps {
    achievements: Record<string, boolean>;
    onAchievementChange: (key: string, checked: boolean) => void;
}

const achievementLevels = [
    { key: 'basic-training', label: '본사 실무교육 이수' },
    { key: 'standard-protocol', label: 'Standard 프로토콜 마스터' },
    { key: 'expert-course', label: '전문가 과정 수료' },
];

export default function AchievementSection({ achievements, onAchievementChange }: AchievementSectionProps) {
    const getHighestAchievement = () => {
        if (achievements['expert-course']) return 3;
        if (achievements['standard-protocol']) return 2;
        if (achievements['basic-training']) return 1;
        return 0;
    };

    const progressValue = (getHighestAchievement() / achievementLevels.length) * 100;

    return (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-blue-800">최종 성취도</h3>
                <span className="text-sm font-bold text-blue-600">{getHighestAchievement()} / {achievementLevels.length}</span>
            </div>
            <Progress value={progressValue} className="h-2 [&>div]:bg-blue-500" />
            <div className="space-y-3 pt-2">
                {achievementLevels.map((level, index) => (
                    <div
                        key={level.key}
                        className="flex items-center space-x-3 bg-white/60 p-3 rounded-md border border-blue-100"
                    >
                        <Checkbox
                            id={level.key}
                            checked={achievements[level.key] || false}
                            onCheckedChange={(checked) => onAchievementChange(level.key, !!checked)}
                        />
                        <label
                            htmlFor={level.key}
                            className="text-sm font-medium text-gray-800 flex-1 cursor-pointer"
                        >
                           <span className="font-bold text-blue-600 mr-2">{index + 1}단계:</span> {level.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
} 