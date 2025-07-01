import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  onAddCustomer: () => void;
  hasUnsavedNewCustomer: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  onAddCustomer,
  hasUnsavedNewCustomer,
}) => {
  return (
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm">
      {/* 모바일/태블릿에서 잘리지 않도록 패딩과 간격 최소화 */}
      <div className="w-full flex h-12 xs:h-14 items-center justify-between gap-1 xs:gap-2 sm:gap-4 px-2 xs:px-3 sm:px-6 md:px-8">
        {/* 뒤로가기 버튼 - 640px 미만에서는 아이콘만 */}
        <Button variant="default" size="sm" asChild className="h-7 px-1 xs:px-1.5 sm:h-9 sm:px-4 whitespace-nowrap flex-shrink-0">
          <Link href="/kol-new/clinical-photos">
            <ArrowLeft className="h-3 xs:h-4 w-3 xs:w-4" />
            <span className="hidden sm:inline ml-2 text-sm">뒤로가기</span>
          </Link>
        </Button>

        {/* 새 고객 추가 버튼 - 640px 미만에서는 아이콘만 */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Button 
            onClick={onAddCustomer}
            className="legacy-btn flex items-center gap-1 h-7 px-1 xs:px-1.5 sm:h-9 sm:px-4 text-xs whitespace-nowrap"
            size="sm"
            disabled={hasUnsavedNewCustomer}
          >
            <Plus className="h-3 xs:h-4 w-3 xs:w-4" />
            <span className="hidden sm:inline">새 고객 추가</span>
          </Button>
          {hasUnsavedNewCustomer && (
            <p className="text-xs text-orange-600 text-right whitespace-nowrap max-w-[160px] xs:max-w-[200px] sm:max-w-none text-[10px] xs:text-xs">
              현재 고객을 저장한 후 새 고객을 추가할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 