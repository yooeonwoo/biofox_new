"use client";

import { ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CustomerSectionProps {
  number: string;
  title?: string;
  sectionId: string;
  memo: string;
  isMemoOpen: boolean;
  onMemoToggle: () => void;
  onMemoChange: (value: string) => void;
  getMemoBackgroundColor: (sectionId: string) => string;
  children: ReactNode;
}

export default function CustomerSectionWrapper({ 
  number, 
  title, 
  sectionId, 
  memo, 
  isMemoOpen, 
  onMemoToggle, 
  onMemoChange, 
  getMemoBackgroundColor,
  children 
}: CustomerSectionProps) {
  return (
    <div className="border border-gray-300 rounded-lg mb-4 overflow-hidden relative z-10">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-medium">
            {number}
          </div>
          {title && <div className="font-medium">{title}</div>}
        </div>
        
        <button
          onClick={onMemoToggle}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            memo.trim() ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={isMemoOpen ? '메모 닫기' : '메모 열기'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
      
      {isMemoOpen && (
        <div className={cn(getMemoBackgroundColor(sectionId), "border-b border-gray-300 p-3 animate-in slide-in-from-top-2 duration-200")}>
          <Textarea
            value={memo}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onMemoChange(e.target.value)}
            placeholder="이 섹션에 대한 메모를 입력하세요..."
            className="w-full h-20 p-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{memo.length}자</span>
            <div className="flex gap-2">
              <button onClick={() => onMemoChange('')} className="text-xs text-gray-500 hover:text-red-500 transition-colors">지우기</button>
              <button onClick={onMemoToggle} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors">완료</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
} 