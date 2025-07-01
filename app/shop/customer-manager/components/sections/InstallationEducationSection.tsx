"use client";

import React, { useEffect, useState } from 'react';
import { getInstallInfo } from '@/app/shop/api/get-install-info';

interface InstallationEducationSectionProps {
  shopId: string;
}

export default function InstallationEducationSection({ 
    shopId
}: InstallationEducationSectionProps) {
  const [info, setInfo] = useState<{date:string; name:string; phone:string}>({
    date: "", name: "", phone: ""
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstallInfo(shopId)
      .then(setInfo)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [shopId]);

  return (
    <div className="space-y-6">
      {/* 설치 교육 파트 */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h4 className="text-md font-semibold text-gray-800 border-b pb-2">설치 교육</h4>
        
        {/* 설치 교육 날짜 - 읽기전용 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="text-sm font-medium text-gray-700 w-20 sm:w-28 shrink-0">설치 교육:</label>
          <span className="flex-1 text-sm min-h-[36px] px-2.5 py-2 bg-gray-50 border rounded-md flex items-center min-w-0 truncate" title={loading ? "로딩 중..." : (info.date || "미입력")}>
            {loading ? "로딩 중..." : (info.date || "미입력")}
          </span>
        </div>
        
                          {/* 설치 담당자 - 읽기전용 */}
         <div className="flex items-center gap-2 sm:gap-3">
           <label className="text-sm font-medium text-gray-700 w-20 sm:w-28 shrink-0">설치 담당자:</label>
           <span className="text-sm px-2.5 py-2 bg-gray-50 border rounded-md flex-1 min-w-0 truncate" title={loading ? "로딩 중..." : (info.name || "미입력")}>
             {loading ? "로딩 중..." : (info.name || "미입력")}
           </span>
         </div>
        
                          {/* 연락처 - 읽기전용 */}
         <div className="flex items-center gap-2 sm:gap-3">
           <label className="text-sm font-medium text-gray-700 w-20 sm:w-28 shrink-0">연락처:</label>
           <span className="text-sm px-2.5 py-2 bg-gray-50 border rounded-md flex-1 min-w-0 truncate" title={loading ? "로딩 중..." : (info.phone || "미입력")}>
             {loading ? "로딩 중..." : (info.phone || "미입력")}
           </span>
         </div>
      </div>
      




      {/* TODO: 추후 실시간 업데이트 */}
      {/* 
      TODO: supabase.channel('customer_progress')
        .on('postgres_changes', {...})  // delivery 변경 시 setInfo 업데이트
      */}
    </div>
  );
} 