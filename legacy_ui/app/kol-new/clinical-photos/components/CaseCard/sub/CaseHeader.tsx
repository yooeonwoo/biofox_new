import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ClinicalCase } from '@/app/kol-new/clinical-photos/types';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface CaseHeaderProps {
  caseItem: ClinicalCase;
  showDelete?: boolean;
  onDelete?: (caseId: number) => void;
}

export const CaseHeader: React.FC<CaseHeaderProps> = ({ caseItem, showDelete = false, onDelete }) => {
  return (
    <CardHeader className="relative flex flex-row items-center justify-between pr-9">
      {/* 고객 이름은 값이 있을 때만 보여줌 */}
      {caseItem.customerName && (
        <CardTitle className="text-lg font-medium truncate">
          {caseItem.customerName}
        </CardTitle>
      )}

      {/* 삭제 버튼 */}
      {showDelete && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-1 right-1 text-gray-400 hover:text-red-600"
              aria-label="delete case"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-sm bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>케이스를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                삭제 후에는 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={() => onDelete(caseItem.id)}
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </CardHeader>
  );
}; 