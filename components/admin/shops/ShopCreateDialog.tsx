'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateShop } from '@/lib/hooks/shops-convex';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Convex 스키마와 호환되는 강화된 유효성 검증
const schema = z.object({
  kolId: z.coerce
    .number({ invalid_type_error: 'KOL ID는 숫자여야 합니다' })
    .positive('KOL ID는 양수여야 합니다')
    .int('KOL ID는 정수여야 합니다'),
  ownerName: z
    .string()
    .min(1, '대표자명을 입력하세요')
    .max(50, '대표자명은 50자 이하여야 합니다')
    .regex(/^[가-힣a-zA-Z\s]+$/, '대표자명은 한글, 영문, 공백만 입력 가능합니다')
    .transform(name => name.trim()), // 공백 제거
  shopName: z
    .string()
    .min(1, '전문점명을 입력하세요')
    .max(100, '전문점명은 100자 이하여야 합니다')
    .transform(name => name.trim()), // 공백 제거
  region: z
    .string()
    .optional()
    .transform(region => region?.trim() || undefined), // 빈 문자열을 undefined로 처리
  contractDate: z
    .string()
    .optional()
    .refine(
      date => !date || /^\d{4}-\d{2}-\d{2}$/.test(date),
      '계약일은 YYYY-MM-DD 형식이어야 합니다'
    ),
});

type FormValues = z.infer<typeof schema>;

export default function ShopCreateDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kolId: undefined as unknown as number,
      ownerName: '',
      shopName: '',
      region: '',
      contractDate: '',
    },
  });

  const { mutate, isPending, isSuccess } = useCreateShop();

  // 성공 시 다이얼로그 닫기 (토스트 알림은 훅에서 처리)
  useEffect(() => {
    if (isSuccess) {
      form.reset();
      setOpen(false); // 다이얼로그 닫기
    }
  }, [isSuccess, form]);

  function onSubmit(values: FormValues) {
    // 기존 전역 에러 초기화
    form.clearErrors('root');

    mutate(values, {
      onError: error => {
        // 네트워크 에러, 유효성 검증 에러 등을 구분하여 처리
        let errorMessage = '매장 생성 중 오류가 발생했습니다.';

        if (error.message.includes('KOL ID')) {
          errorMessage = '유효하지 않은 KOL ID입니다. 올바른 KOL ID를 입력해주세요.';
        } else if (error.message.includes('네트워크')) {
          errorMessage = '네트워크 연결을 확인해주세요.';
        } else if (error.message.includes('권한')) {
          errorMessage = '매장 생성 권한이 없습니다. 관리자에게 문의하세요.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        // React Hook Form의 root 에러로 설정
        form.setError('root', {
          type: 'manual',
          message: errorMessage,
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">신규 전문점</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>신규 전문점 생성</DialogTitle>
          <DialogDescription>필수 정보를 입력하세요.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* 로딩 오버레이 */}
          {isPending && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">저장 중...</span>
              </div>
            </div>
          )}

          <form className="grid gap-4 py-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-4 items-center gap-2">
              <label className="text-right text-sm font-medium">KOL ID</label>
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="KOL ID를 입력하세요"
                  min="1"
                  disabled={isPending}
                  {...form.register('kolId', { valueAsNumber: true })}
                />
                {form.formState.errors.kolId && (
                  <p className="mt-1 text-sm text-red-500">{form.formState.errors.kolId.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <label className="text-right text-sm font-medium">대표자명</label>
              <div className="col-span-3">
                <Input
                  placeholder="대표자 이름을 입력하세요"
                  maxLength={50}
                  disabled={isPending}
                  {...form.register('ownerName')}
                />
                {form.formState.errors.ownerName && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.ownerName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <label className="text-right text-sm font-medium">전문점명</label>
              <div className="col-span-3">
                <Input
                  placeholder="전문점 이름을 입력하세요"
                  maxLength={100}
                  disabled={isPending}
                  {...form.register('shopName')}
                />
                {form.formState.errors.shopName && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.shopName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <label className="text-right text-sm font-medium">지역</label>
              <div className="col-span-3">
                <Input
                  placeholder="지역을 입력하세요 (선택사항)"
                  disabled={isPending}
                  {...form.register('region')}
                />
                {form.formState.errors.region && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.region.message}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <label className="text-right text-sm font-medium">계약일</label>
              <div className="col-span-3">
                <Input
                  type="date"
                  placeholder="YYYY-MM-DD"
                  disabled={isPending}
                  {...form.register('contractDate')}
                />
                {form.formState.errors.contractDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.contractDate.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="flex flex-col gap-2">
              {/* 전역 에러 메시지 표시 */}
              {form.formState.errors.root && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-500">
                  <p className="font-medium">오류가 발생했습니다:</p>
                  <p>{form.formState.errors.root.message}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isPending || !form.formState.isValid}
                  className="min-w-[100px]"
                  aria-describedby={isPending ? 'loading-text' : undefined}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span id="loading-text">저장 중...</span>
                    </>
                  ) : (
                    '저장'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
