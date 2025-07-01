'use client';

import React from 'react';
import { cn } from "@/lib/utils";

type CaseStatus = 'active' | 'completed';

interface CaseStatusTabsProps {
  status: CaseStatus;
  onStatusChange: (status: CaseStatus) => void;
  className?: string;
}

const CaseStatusTabs: React.FC<CaseStatusTabsProps> = ({
  status,
  onStatusChange,
  className
}) => {
  const tabs = [
    {
      key: 'active' as CaseStatus,
      label: '진행중',
      color: 'blue'
    },
    {
      key: 'completed' as CaseStatus,
      label: '완료',
      color: 'green'
    }
  ];

  return (
    <div className={cn("flex bg-gray-100/70 p-1 rounded-lg flex-shrink-0", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onStatusChange(tab.key)}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-md transition-all duration-150",
            status === tab.key 
              ? "bg-white text-biofox-dark-blue-violet shadow-sm" 
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default CaseStatusTabs;