'use client';

import React from 'react';
import { Calendar, Check } from 'lucide-react';

export default function UpcomingTasks() {
  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-lg font-medium">예정된 일정</h2>
      <div className="space-y-4">
        <div className="flex items-start space-x-4 p-3 rounded-md border border-gray-100 hover:bg-gray-50">
          <div className="rounded-full bg-blue-100 p-2">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">아바에 광진 세미나</h3>
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">7월 12일</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">오후 2시 ~ 4시, 참가자 12명</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4 p-3 rounded-md border border-gray-100 hover:bg-gray-50">
          <div className="rounded-full bg-green-100 p-2">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">아바에 강남 방문</h3>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">7월 15일</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">오전 11시, 제품 데모 및 신규 계약 논의</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4 p-3 rounded-md border border-gray-100 hover:bg-gray-50">
          <div className="rounded-full bg-purple-100 p-2">
            <Calendar className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">월간 KOL 미팅</h3>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">7월 20일</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">온라인 미팅, 신제품 출시 안내</p>
          </div>
        </div>
      </div>
    </div>
  );
} 