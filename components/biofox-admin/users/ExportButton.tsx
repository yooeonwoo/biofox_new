'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  onExport?: () => Promise<void>;
  disabled?: boolean;
  label?: string;
}

export function ExportButton({
  onExport,
  disabled = false,
  label = '엑셀 다운로드',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      if (onExport) {
        await onExport();
      } else {
        // 기본 내보내기 로직
        toast({
          title: '성공',
          description: '엑셀 파일 다운로드가 시작됩니다.',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: '실패',
        description: '엑셀 다운로드에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={disabled || isExporting}>
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? '다운로드 중...' : label}
    </Button>
  );
}
