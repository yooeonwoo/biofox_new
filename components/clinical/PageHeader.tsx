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
      {/* 카드와 동일한 max-width로 제한 */}
      <div className="mx-auto w-full xs:max-w-[95%] sm:max-w-2xl flex h-12 xs:h-14 items-center gap-3 xs:gap-4 px-3 xs:px-4 md:px-0">
        {/* 뒤로가기 버튼 */}
        <div>
          <Button variant="default" size="sm" asChild className="h-8 px-3 xs:h-9 xs:px-4">
            <Link href="/kol-new/clinical-photos">
              <ArrowLeft className="mr-1 xs:mr-2 h-3 xs:h-4 w-3 xs:w-4" />
              <span className="text-xs xs:text-sm">뒤로가기</span>
            </Link>
          </Button>
        </div>
        
        {/* 비어있는 공간 */}
        <div className="flex-1" />

        {/* 새 고객 추가 버튼 */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col items-center gap-1">
            <Button 
              onClick={onAddCustomer}
              className="legacy-btn flex items-center gap-1 xs:gap-2 h-8 px-3 xs:h-9 xs:px-4 text-xs xs:text-sm"
              size="sm"
              disabled={hasUnsavedNewCustomer}
            >
              <Plus className="h-3 xs:h-4 w-3 xs:w-4" />
              새 고객 추가
            </Button>
            {hasUnsavedNewCustomer && (
              <p className="text-xs text-orange-600 text-right whitespace-nowrap">
                현재 고객을 저장한 후 새 고객을 추가할 수 있습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 