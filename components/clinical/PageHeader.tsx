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
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 px-4 md:px-6 border-b border-gray-100">
      <div className="flex items-center justify-center gap-16 max-w-2xl mx-auto">
        <div>
          <Button variant="default" size="sm" asChild>
            <Link href="/kol-new/clinical-photos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Link>
          </Button>
        </div>
        
        {/* 새 고객 추가 버튼 */}
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
  );
}; 