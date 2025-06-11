"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useCreateAdminNewShop } from "@/lib/hooks/adminNewShops";
import { Loader2 } from "lucide-react";
import { useAdminNewKols } from "@/lib/hooks/adminNewKols";

interface FormValues {
  kolId: number;
  ownerName: string;
  shopName: string;
  region?: string;
  contractDate?: string;
  smartPlaceLink?: string;
  withDevice: boolean;
  deduct?: number;
}

export default function NewShopDialog({ createdBy }: { createdBy: number }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: { withDevice: false },
  });
  const withDevice = watch("withDevice");
  const deductWatch = watch("deduct");
  const [deductSelect, setDeductSelect] = useState<string>("");
  const { data: kols = [] } = useAdminNewKols();

  const mutation = useCreateAdminNewShop();

  const onSubmit = handleSubmit((data) => {
    mutation.mutate({ ...data, createdBy, deduct: data.deduct ?? 0 });
  });

  // 효과: 성공 시 닫기 및 초기화
  if (mutation.isSuccess && open) {
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">전문점 추가</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>신규 전문점 등록</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Select
            onValueChange={(v) => {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              register("kolId").onChange({ target: { value: Number(v) } });
            }}
          >
            <SelectTrigger className="w-full" size="sm">
              <SelectValue placeholder="KOL 선택" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-auto">
              {kols.map((k) => (
                <SelectItem key={k.id} value={String(k.id)}>{k.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input {...register("ownerName", { required: true })} placeholder="대표자 이름" />
          <Input {...register("shopName", { required: true })} placeholder="전문점명" />
          <Input type="date" {...register("contractDate")} placeholder="계약일자" />
          <Input {...register("region")} placeholder="지역" />
          <Input {...register("smartPlaceLink")}
            placeholder="플레이스 주소(URL)" />

          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("withDevice")} />
            <span>기기 1대 함께 추가</span>
          </div>

          {withDevice && (
            <>
            <Select
              value={deductSelect}
              onValueChange={(v) => {
                setDeductSelect(v);
                if (v === "custom") {
                  // reset deduct
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  register("deduct").onChange({ target: { value: undefined } });
                } else {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  register("deduct").onChange({ target: { value: Number(v) } });
                }
              }}
            >
              <SelectTrigger className="w-32" size="sm">
                <SelectValue placeholder="차감액" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="55">55</SelectItem>
                <SelectItem value="34">34</SelectItem>
                <SelectItem value="21">21</SelectItem>
                <SelectItem value="0">없음</SelectItem>
                <SelectItem value="custom">직접입력</SelectItem>
              </SelectContent>
            </Select>

            {deductSelect === "custom" && (
              <Input
                type="number"
                placeholder="차감액 직접입력"
                {...register("deduct", { valueAsNumber: true })}
                className="w-32"
              />
            )}
            </>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>

          {mutation.isError && <p className="text-destructive">{(mutation.error as Error).message}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
} 