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
  backPath = "/kol-new/clinical-photos",
  showAddButton = true,
}) => {
  return (
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <div className="w-full flex h-12 xs:h-14 items-center gap-3 xs:gap-4 px-3 xs:px-4 sm:px-6 md:px-8 relative">
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
          <div className={`${showAddButton && onAddCustomer ? 'flex-1 text-center' : 'absolute left-1/2 transform -translate-x-1/2'}`}>
            <h1 className="text-sm xs:text-base font-semibold text-gray-900 truncate">
              {title}
            </h1>
          </div>
        )}

        {/* 새 고객 버튼 */}
        {showAddButton && onAddCustomer && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Button 
              onClick={onAddCustomer}
              size="sm"
              disabled={hasUnsavedNewCustomer}
              className="h-8 xs:h-9 px-3 xs:px-4 text-xs xs:text-sm font-medium bg-biofox-blue-violet hover:bg-biofox-dark-blue-violet text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              새 고객
            </Button>
            {hasUnsavedNewCustomer && (
              <p className="text-[10px] xs:text-xs text-orange-600 text-right whitespace-nowrap max-w-[140px] xs:max-w-[180px] sm:max-w-none leading-tight">
                현재 고객을 저장한 후 새 고객을 추가할 수 있습니다
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 