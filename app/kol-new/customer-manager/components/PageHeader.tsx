"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageHeaderProps {
  backPath: string;
  onAddCustomer: () => void;
  isAdding: boolean;
  title?: string;
}

export default function PageHeader({
  backPath,
  onAddCustomer,
  isAdding,
  title,
}: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <div className="w-full flex h-12 xs:h-14 items-center justify-between gap-3 xs:gap-4 px-3 xs:px-4 sm:px-6 md:px-8">
        {/* 뒤로가기 버튼 */}
        <Button 
          variant="outline" 
          size="sm" 
          asChild 
          className="h-8 xs:h-9 px-3 xs:px-4 text-xs xs:text-sm font-medium bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-all duration-200 flex-shrink-0"
        >
          <Link href={backPath}>
            뒤로 가기
          </Link>
        </Button>

        {/* 제목 */}
        {title && (
          <div className="flex-1 text-center">
            <h1 className="text-sm xs:text-base font-semibold text-gray-900 truncate">
              {title}
            </h1>
          </div>
        )}

        {/* 고객 추가 버튼 */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <Button 
            onClick={onAddCustomer}
            size="sm"
            disabled={isAdding}
            className="h-8 xs:h-9 px-3 xs:px-4 text-xs xs:text-sm font-medium bg-biofox-blue-violet hover:bg-biofox-dark-blue-violet text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            고객 추가
          </Button>
          {isAdding && (
            <p className="text-[10px] xs:text-xs text-orange-600 text-center whitespace-nowrap max-w-[140px] xs:max-w-[180px] sm:max-w-none leading-tight">
              신규 고객을 저장하거나 삭제 후 추가할 수 있습니다
            </p>
          )}
        </div>


      </div>
    </div>
  );
} 