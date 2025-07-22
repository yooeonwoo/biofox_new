'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  nodeToDelete: {
    id: string;
    name: string;
    shop_name: string;
    subordinates: any[];
  } | null;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onSuccess,
  nodeToDelete,
}: DeleteConfirmDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!nodeToDelete) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/relationships?shop_owner_id=${nodeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '관계 삭제 실패');
      }

      toast({
        title: '삭제 완료',
        description: `${nodeToDelete.name}의 관계가 삭제되었습니다.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: '삭제 실패',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>관계 삭제 확인</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {nodeToDelete && (
              <>
                <div>
                  <strong>{nodeToDelete.name}</strong>의 소속 관계를 삭제하시겠습니까?
                </div>
                <div className="text-sm text-gray-600">에스테틱: {nodeToDelete.shop_name}</div>
                {nodeToDelete.subordinates.length > 0 && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                    <div className="text-sm font-medium text-yellow-800">⚠️ 주의사항</div>
                    <div className="mt-1 text-sm text-yellow-700">
                      이 에스테틱은 {nodeToDelete.subordinates.length}개의 하위 에스테틱을 가지고
                      있습니다. 관계를 삭제하면 하위 관계들도 영향을 받을 수 있습니다.
                    </div>
                  </div>
                )}
                <div className="text-sm font-medium text-red-600">
                  이 작업은 되돌릴 수 없습니다.
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              '삭제'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
