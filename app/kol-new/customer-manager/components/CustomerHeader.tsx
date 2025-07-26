'use client';

import { Customer, CustomerProgress, StageData } from '@/lib/types/customer';
import { Badge } from '@/components/ui/badge';
import { Star, Trash2, Save, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface BasicInfoValue {
  shopName?: string;
  phone?: string;
  region?: string;
  placeAddress?: string;
  assignee?: string;
  manager?: string;
}

interface Props {
  customer: Customer;
  progress: CustomerProgress;
  cardNumber: number;
  basicInfo: BasicInfoValue;
  onBasicInfoChange: (info: BasicInfoValue) => void;
  isNew?: boolean;
  onDelete?: () => void;
  // 저장 기능을 위한 새로운 props
  onSaveBasicInfo?: () => Promise<void>;
  isSavingBasicInfo?: boolean;
  lastSavedBasicInfo?: Date | null;
}

export default function CustomerHeader({
  customer,
  progress,
  cardNumber,
  basicInfo,
  onBasicInfoChange,
  isNew,
  onDelete,
  onSaveBasicInfo,
  isSavingBasicInfo = false,
  lastSavedBasicInfo,
}: Props) {
  const setField = (field: string, val: string) => {
    onBasicInfoChange({ ...basicInfo, [field]: val });
  };

  const handleSaveBasicInfo = async () => {
    if (onSaveBasicInfo && !isSavingBasicInfo) {
      await onSaveBasicInfo();
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="mb-4 rounded-lg border bg-muted/40 p-4">
      {/* Top row */}
      <div className="flex flex-col items-start justify-between gap-y-3 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground shadow">
            {cardNumber}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{customer.name}</h3>
            {isNew && <Badge variant="destructive">신규</Badge>}
            {(() => {
              const ach = progress?.achievements;
              const level = ach?.expertCourse
                ? 3
                : ach?.standardProtocol
                  ? 2
                  : ach?.basicTraining
                    ? 1
                    : 0;
              return (
                <div className="flex items-center gap-1">
                  {Array.from({ length: level }).map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-full space-y-1 text-left sm:w-auto sm:text-right">
            {customer.manager && <div className="text-sm">담당자 : {customer.manager}</div>}
            {customer.assignee && (
              <div className="text-xs text-muted-foreground">배정자 : {customer.assignee}</div>
            )}
          </div>

          {/* 저장 상태 및 시간 표시 */}
          {lastSavedBasicInfo && (
            <div className="hidden text-xs text-muted-foreground sm:block">
              {formatLastSaved(lastSavedBasicInfo)}에<br />
              저장됨
            </div>
          )}

          {/* 인적사항 저장 버튼 */}
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0 transition-colors hover:bg-muted/70',
                    isSavingBasicInfo && 'pointer-events-none'
                  )}
                  onClick={handleSaveBasicInfo}
                  disabled={isSavingBasicInfo}
                >
                  {isSavingBasicInfo ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                  ) : lastSavedBasicInfo ? (
                    <Check size={16} className="text-green-600" />
                  ) : (
                    <Save size={16} className="text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isSavingBasicInfo
                    ? '인적사항 저장 중...'
                    : lastSavedBasicInfo
                      ? '인적사항 다시 저장'
                      : '인적사항 저장'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isNew && onDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              className="text-red-500 hover:bg-red-100"
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>

      <hr className="my-3" />

      {/* Form rows */}
      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <span className="min-w-[40px]">샵명:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.shopName || ''}
            onChange={e => setField('shopName', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[30px]">번호:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.phone || ''}
            onChange={e => setField('phone', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[30px]">지역:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.region || ''}
            onChange={e => setField('region', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-[70px]">플레이스 주소:</span>
          <Input
            className="h-7 flex-1"
            value={basicInfo.placeAddress || ''}
            onChange={e => setField('placeAddress', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
