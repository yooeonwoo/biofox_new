'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useShopCreation, ShopFormData } from '@/lib/hooks/useShopCreation';

interface Props {
  createdBy: number;
  onSuccess?: (shopId: string) => void;
}

export default function NewShopDialog({ createdBy, onSuccess }: Props) {
  const [open, setOpen] = useState(false);

  // 통합된 useShopCreation 훅 사용
  const {
    kols,
    isKolsLoading,
    isCreating,
    isSuccess,
    isError,
    error,
    createShopWithRelations,
    getKolByNumber,
    validateShopName,
    reset: resetMutation,
  } = useShopCreation();

  // React Hook Form 설정
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset: resetForm,
  } = useForm<ShopFormData>({
    defaultValues: {
      withDevice: false,
      createdBy,
    },
    mode: 'onChange',
  });

  // 폼 필드 감시
  const selectedKolId = watch('kolId');
  const withDevice = watch('withDevice');
  const shopName = watch('shopName');
  const deductValue = watch('deduct');

  // 차감액 선택 상태
  const [deductSelect, setDeductSelect] = useState<string>('');

  // KOL 선택 시 자동 필드 설정
  useEffect(() => {
    if (selectedKolId) {
      const selectedKol = getKolByNumber(selectedKolId);
      if (selectedKol?.region) {
        setValue('region', selectedKol.region);
      }
    }
  }, [selectedKolId, getKolByNumber, setValue]);

  // 매장 이름 실시간 검증
  const isShopNameValid = shopName ? validateShopName(shopName) : true;

  // 폼 제출 처리
  const onSubmit = handleSubmit(async data => {
    try {
      createShopWithRelations(data);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  });

  // 성공 시 처리
  useEffect(() => {
    if (isSuccess && open) {
      setOpen(false);
      resetForm();
      resetMutation();
      setDeductSelect('');
      onSuccess?.('success'); // 실제 shopId는 내부적으로 처리됨
    }
  }, [isSuccess, open, resetForm, resetMutation, onSuccess]);

  // 다이얼로그 닫힐 때 정리
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
      resetMutation();
      setDeductSelect('');
    }
  };

  // 차감액 선택 처리
  const handleDeductChange = (value: string) => {
    setDeductSelect(value);
    if (value === 'custom') {
      setValue('deduct', undefined);
    } else {
      setValue('deduct', Number(value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">전문점 추가</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>신규 전문점 등록</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          {/* KOL 선택 */}
          <div className="space-y-2">
            <Select
              disabled={isKolsLoading || isCreating}
              onValueChange={v => {
                setValue('kolId', Number(v), { shouldValidate: true });
              }}
            >
              <SelectTrigger className="w-full bg-white" size="sm">
                <SelectValue placeholder={isKolsLoading ? '로딩 중...' : '전문점 선택'} />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto bg-white">
                {kols &&
                  Object.entries(
                    kols.reduce(
                      (groups, kol) => {
                        const key = kol.shopName;
                        if (!groups[key]) groups[key] = [];
                        groups[key].push(kol);
                        return groups;
                      },
                      {} as Record<string, typeof kols>
                    )
                  ).map(([groupName, groupKols]) => (
                    <SelectGroup key={groupName}>
                      <SelectLabel>{groupName}</SelectLabel>
                      {groupKols.map(kol => (
                        <SelectItem key={kol.id} value={String(kol.id)}>
                          {kol.name}
                          {kol.status !== 'active' && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({kol.status})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
              </SelectContent>
            </Select>
            {errors.kolId && <p className="text-sm text-destructive">KOL을 선택해주세요.</p>}
          </div>

          {/* 대표자 이름 */}
          <div className="space-y-2">
            <Input
              {...register('ownerName', {
                required: '대표자 이름을 입력해주세요.',
                minLength: { value: 2, message: '최소 2글자 이상 입력해주세요.' },
              })}
              placeholder="대표자 이름"
              disabled={isCreating}
            />
            {errors.ownerName && (
              <p className="text-sm text-destructive">{errors.ownerName.message}</p>
            )}
          </div>

          {/* 전문점명 */}
          <div className="space-y-2">
            <Input
              {...register('shopName', {
                required: '전문점명을 입력해주세요.',
                minLength: { value: 2, message: '최소 2글자 이상 입력해주세요.' },
                validate: value => isShopNameValid || '유효하지 않은 매장 이름입니다.',
              })}
              placeholder="전문점명"
              disabled={isCreating}
              className={!isShopNameValid ? 'border-destructive' : ''}
            />
            {errors.shopName && (
              <p className="text-sm text-destructive">{errors.shopName.message}</p>
            )}
            {!isShopNameValid && shopName && (
              <p className="text-sm text-destructive">매장 이름은 2글자 이상이어야 합니다.</p>
            )}
          </div>

          {/* 계약일자 */}
          <Input
            type="date"
            {...register('contractDate')}
            placeholder="계약일자"
            disabled={isCreating}
          />

          {/* 지역 */}
          <Input
            {...register('region')}
            placeholder="지역 (KOL 선택 시 자동 설정)"
            disabled={isCreating}
          />

          {/* 스마트플레이스 링크 */}
          <Input
            {...register('smartPlaceLink')}
            placeholder="플레이스 주소(URL)"
            disabled={isCreating}
            type="url"
          />

          {/* 기기 추가 옵션 */}
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('withDevice')} disabled={isCreating} />
            <span>기기 1대 함께 추가</span>
          </div>

          {/* 차감액 설정 (기기 추가 시에만) */}
          {withDevice && (
            <div className="space-y-2">
              <Select value={deductSelect} onValueChange={handleDeductChange} disabled={isCreating}>
                <SelectTrigger className="w-32 bg-white" size="sm">
                  <SelectValue placeholder="차감액" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="55">55</SelectItem>
                  <SelectItem value="34">34</SelectItem>
                  <SelectItem value="21">21</SelectItem>
                  <SelectItem value="0">없음</SelectItem>
                  <SelectItem value="custom">직접입력</SelectItem>
                </SelectContent>
              </Select>

              {deductSelect === 'custom' && (
                <Input
                  type="number"
                  placeholder="차감액 직접입력"
                  {...register('deduct', {
                    valueAsNumber: true,
                    min: { value: 0, message: '0 이상의 값을 입력해주세요.' },
                  })}
                  className="w-32"
                  disabled={isCreating}
                />
              )}

              {errors.deduct && <p className="text-sm text-destructive">{errors.deduct.message}</p>}
            </div>
          )}

          {/* 제출 버튼 */}
          <Button
            type="submit"
            disabled={isCreating || !isValid || isKolsLoading}
            className="w-full"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? '생성 중...' : '저장'}
          </Button>

          {/* 에러 메시지 */}
          {isError && error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </div>
          )}

          {/* 로딩 상태 (KOL 데이터) */}
          {isKolsLoading && (
            <div className="flex items-center justify-center p-3 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              KOL 목록을 불러오는 중...
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
