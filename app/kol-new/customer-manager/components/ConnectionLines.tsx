"use client";

import React, { useContext, useMemo } from 'react';
import { ConnectionLineContext } from '../contexts/ConnectionLineContext';
import { StageData } from '@/lib/types/customer';

interface Props {
    stageData: StageData;
}

const connectionFlow: (keyof StageData)[][] = [
    ['inflow'],
    ['contract'],
    ['delivery'],
];

export default function ConnectionLinesShad({ stageData }: Props) {
    const context = useContext(ConnectionLineContext);
    
    const connectionPaths = useMemo(() => {
        if (!context || !stageData) return [];

        const { buttonPositions } = context;
        const paths: Array<{ from: { x: number; y: number }, to: { x: number; y: number } }> = [];
        
        for (let i = 0; i < connectionFlow.length - 1; i++) {
            const currentStageKey = connectionFlow[i][0];
            const nextStageKey = connectionFlow[i+1][0];

            const currentStageInfo = (stageData as any)[currentStageKey];
            const nextStageInfo = (stageData as any)[nextStageKey];

            const fromKey = currentStageInfo?.type || currentStageInfo?.source;
            const toKey = nextStageInfo?.type || nextStageInfo?.source;
            
            if (fromKey && toKey) {
                const fromButtonKey = `${currentStageKey}-${fromKey}`;
                const toButtonKey = `${nextStageKey}-${toKey}`;
                
                const fromPos = buttonPositions[fromButtonKey];
                const toPos = buttonPositions[toButtonKey];

                if (fromPos && toPos) {
                    paths.push({
                        from: { x: fromPos.x, y: fromPos.y + fromPos.height / 2 },
                        to: { x: toPos.x, y: toPos.y + toPos.height / 2 },
                    });
                }
            }
        }

        return paths;
    }, [stageData, context]);

    if (!context) {
        return null;
    }

    return (
        <svg
            className="absolute inset-0 pointer-events-none z-0"
            width="100%"
            height="100%"
            style={{ overflow: 'visible' }}
        >
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
            </defs>
            {connectionPaths.map((path, index) => (
                <line
                    key={index}
                    x1={path.from.x}
                    y1={path.from.y}
                    x2={path.to.x}
                    y2={path.to.y}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    markerEnd="url(#arrowhead)"
                    className="drop-shadow-sm"
                />
            ))}
        </svg>
    );
} 