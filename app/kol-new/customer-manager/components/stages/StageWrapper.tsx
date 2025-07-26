import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Pencil, Save, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  number: number;
  memo: string;
  onMemoChange: (m: string) => void;
  bgClass?: string;
  children: React.ReactNode;
  // 저장 기능을 위한 새로운 props
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

/**
 * StageWrapperShad
 * 기존 StageWrapper 와 레이아웃/DOM 구조는 동일하게 유지하면서 shadcn-ui 의 Card 컴포넌트를 이용해 스타일만 변경했다.
 * 저장 버튼 추가
 */
export default function StageWrapper({
  title,
  number,
  memo,
  onMemoChange,
  children,
  bgClass,
  onSave,
  isSaving = false,
  lastSaved,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (onSave && !isSaving) {
      await onSave();
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
    <Card className={cn('stage-block relative border-black/5 bg-white p-4 shadow-sm', bgClass)}>
      {/* 헤더 (번호 + 제목 + 저장 버튼) */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
          {number}
        </div>
        <h4 className="flex-1 text-sm font-semibold">{title}</h4>

        {/* 저장 상태 및 시간 표시 */}
        {lastSaved && (
          <div className="hidden text-xs text-muted-foreground sm:block">
            {formatLastSaved(lastSaved)}에 저장됨
          </div>
        )}

        {/* 저장 버튼 */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 transition-colors hover:bg-muted/70',
                  isSaving && 'pointer-events-none'
                )}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                ) : lastSaved ? (
                  <Check size={16} className="text-green-600" />
                ) : (
                  <Save size={16} className="text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isSaving ? '저장 중...' : lastSaved ? '다시 저장' : '저장'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* 메모 토글 버튼 */}
              <button
                type="button"
                aria-label={open ? '메모 닫기' : '메모 열기'}
                className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
                onClick={() => setOpen(o => !o)}
              >
                <Pencil size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{open ? '메모 닫기' : '메모 열기'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 메모 영역 */}
      <div
        className={cn(
          'overflow-hidden rounded-md text-xs transition-[max-height,padding] duration-300',
          open
            ? 'mb-3 max-h-48 border border-muted bg-muted/50 p-3'
            : 'mb-0 max-h-0 border-0 bg-transparent p-0'
        )}
      >
        <Textarea
          value={memo}
          onChange={e => onMemoChange(e.target.value)}
          placeholder="이 섹션에 대한 메모를 입력하세요..."
          className="h-24 text-xs"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">{memo.length}자</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-destructive"
              onClick={() => onMemoChange('')}
            >
              지우기
            </button>
            <button
              type="button"
              className="rounded bg-primary px-2 py-1 text-[11px] text-primary-foreground hover:bg-primary/90"
              onClick={() => setOpen(false)}
            >
              완료
            </button>
          </div>
        </div>
      </div>

      {children}
    </Card>
  );
}
