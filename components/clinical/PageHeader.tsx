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
    <div className="sticky top-0 z-10 border-b bg-white shadow-sm -mt-4 md:-mt-6 mb-4 md:mb-6">
      {/* 카드와 동일한 max-width로 제한 */}
      <div className="mx-auto max-w-4xl flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6">
        {/* 뒤로가기 버튼 */}
        <div>
          <Button variant="default" size="sm" asChild>
            <Link href="/kol-new/clinical-photos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
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
              className="legacy-btn flex items-center gap-2"
              size="sm"
              disabled={hasUnsavedNewCustomer}
            >
              <Plus className="h-4 w-4" />
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