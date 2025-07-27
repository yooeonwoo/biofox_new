import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  onAddCustomer?: () => void;
  hasUnsavedNewCustomer?: boolean;
  title?: string;
  backPath?: string;
  showAddButton?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onAddCustomer,
  hasUnsavedNewCustomer = false,
  title,
  backPath = '/kol-new/clinical-photos',
  showAddButton = true,
}) => {
  return (
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <div className="relative flex h-12 w-full items-center gap-3 px-3 xs:h-14 xs:gap-4 xs:px-4 sm:px-6 md:px-8">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="outline"
          size="sm"
          asChild
          className="h-8 flex-shrink-0 border-gray-200 bg-white px-3 text-xs font-medium transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 xs:h-9 xs:px-4 xs:text-sm"
        >
          <Link href={backPath}>뒤로 가기</Link>
        </Button>

        {/* 제목 */}
        {title && (
          <div
            className={`${showAddButton && onAddCustomer ? 'flex-1 text-center' : 'absolute left-1/2 -translate-x-1/2 transform'}`}
          >
            <h1 className="truncate text-sm font-semibold text-gray-900 xs:text-base">{title}</h1>
          </div>
        )}

        {/* 새 고객 버튼 */}
        {showAddButton && onAddCustomer && (
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            <Button
              onClick={onAddCustomer}
              size="sm"
              disabled={hasUnsavedNewCustomer}
              className="h-8 bg-biofox-blue-violet px-3 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-biofox-dark-blue-violet hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 xs:h-9 xs:px-4 xs:text-sm"
            >
              새 고객
            </Button>
            {hasUnsavedNewCustomer && (
              <p className="max-w-[140px] whitespace-nowrap text-right text-[10px] leading-tight text-orange-600 xs:max-w-[180px] xs:text-xs sm:max-w-none">
                현재 고객을 저장한 후 새 고객을 추가할 수 있습니다
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
