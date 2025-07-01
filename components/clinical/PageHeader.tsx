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
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm -mt-3 xs:-mt-4 md:-mt-6">
      {/* 전체 너비를 활용하면서 반응형으로 동작 */}
      <div className="w-full flex h-12 xs:h-14 items-center justify-between gap-3 xs:gap-4 px-3 xs:px-4 sm:px-6 md:px-8">
        {/* 뒤로가기 버튼 */}
        <Button variant="default" size="sm" asChild className="h-7 px-2 xs:h-8 xs:px-3 sm:h-9 sm:px-4 whitespace-nowrap flex-shrink-0">
          <Link href="/kol-new/clinical-photos">
            <ArrowLeft className="mr-1 xs:mr-2 h-3 xs:h-4 w-3 xs:w-4" />
            <span className="text-xs xs:text-sm">뒤로가기</span>
          </Link>
        </Button>

        {/* 새 고객 추가 버튼 */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Button 
            onClick={onAddCustomer}
            className="legacy-btn flex items-center gap-1 xs:gap-2 h-7 px-2 xs:h-8 xs:px-3 sm:h-9 sm:px-4 text-xs xs:text-xs sm:text-sm whitespace-nowrap"
            size="sm"
            disabled={hasUnsavedNewCustomer}
          >
            <Plus className="h-3 xs:h-4 w-3 xs:w-4" />
            새 고객 추가
          </Button>
          {hasUnsavedNewCustomer && (
            <p className="text-xs text-orange-600 text-right whitespace-nowrap max-w-[200px] xs:max-w-none">
              현재 고객을 저장한 후 새 고객을 추가할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 