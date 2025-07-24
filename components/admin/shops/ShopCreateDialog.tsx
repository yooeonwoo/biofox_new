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
import { useCreateShop } from '@/lib/hooks/shops'; // TODO: Convex 전환 후 shops-convex로 변경
import { useEffect } from 'react';
import { toast } from 'sonner';

const schema = z.object({
  kolId: z.coerce.number().positive(),
  ownerName: z.string().min(1, '대표자명을 입력하세요'),
  shopName: z.string().min(1, '전문점명을 입력하세요'),
  region: z.string().optional(),
  contractDate: z.string().optional(), // YYYY-MM-DD
});

type FormValues = z.infer<typeof schema>;

export default function ShopCreateDialog() {
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

  // 성공 시 다이얼로그 닫기
  useEffect(() => {
    if (isSuccess) {
      toast.success('전문점이 생성되었습니다.');
      form.reset();
    }
  }, [isSuccess]);

  function onSubmit(values: FormValues) {
    mutate(values);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">신규 전문점</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>신규 전문점 생성</DialogTitle>
          <DialogDescription>필수 정보를 입력하세요.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="text-right text-sm font-medium">KOL ID</label>
            <Input
              type="number"
              className="col-span-3"
              {...form.register('kolId', { valueAsNumber: true })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="text-right text-sm font-medium">대표자명</label>
            <Input className="col-span-3" {...form.register('ownerName')} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="text-right text-sm font-medium">전문점명</label>
            <Input className="col-span-3" {...form.register('shopName')} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="text-right text-sm font-medium">지역</label>
            <Input className="col-span-3" {...form.register('region')} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <label className="text-right text-sm font-medium">계약일</label>
            <Input type="date" className="col-span-3" {...form.register('contractDate')} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
