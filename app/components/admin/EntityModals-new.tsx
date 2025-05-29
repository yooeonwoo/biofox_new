"use client";

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Mail, AlertTriangle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
  region: string;
  status: string;
  email?: string;
};

type Shop = {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id?: number;
  region: string;
  status: string;
  email?: string;
};

// Zod 스키마 정의
const kolSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  shop_name: z.string().min(1, "샵명은 필수입니다"),
  region: z.string().optional(),
  email: z.string().email("유효한 이메일 주소를 입력해주세요").min(1, "이메일은 필수입니다"),
});

const shopSchema = z.object({
  shop_name: z.string().min(1, "전문점명은 필수입니다"),
  owner_name: z.string().min(1, "담당자명은 필수입니다"),
  kol_id: z.string().min(1, "KOL을 선택해주세요"),
  region: z.string().optional(),
  email: z.string().email("유효한 이메일 주소를 입력해주세요").optional().or(z.literal("")),
});

type KolFormData = z.infer<typeof kolSchema>;
type ShopFormData = z.infer<typeof shopSchema>;

interface KolModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKol: KOL | null;
  onSubmit: (data: KolFormData) => Promise<void>;
}

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShop: Shop | null;
  onSubmit: (data: ShopFormData) => Promise<void>;
  kols: KOL[];
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  deleteType: 'kol' | 'shop' | null;
  onConfirm: () => Promise<void>;
  relatedShopsCount: number;
}

export function KolModal({
  isOpen,
  onClose,
  selectedKol,
  onSubmit
}: KolModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<KolFormData>({
    resolver: zodResolver(kolSchema),
    defaultValues: {
      name: "",
      shop_name: "",
      region: "",
      email: "",
    },
  });

  // 선택된 KOL 데이터로 폼 초기화
  React.useEffect(() => {
    if (selectedKol) {
      form.reset({
        name: selectedKol.name,
        shop_name: selectedKol.shop_name,
        region: selectedKol.region || "",
        email: selectedKol.email || "",
      });
    } else {
      form.reset({
        name: "",
        shop_name: "",
        region: "",
        email: "",
      });
    }
  }, [selectedKol, form]);

  const handleSubmit = async (data: KolFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "성공",
        description: `KOL이 ${selectedKol ? '수정' : '추가'}되었습니다.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "오류",
        description: "작업 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedKol ? 'KOL 정보 수정' : 'KOL 추가'}
          </DialogTitle>
          <DialogDescription>
            {selectedKol ? 'KOL 정보를 수정합니다.' : '새로운 KOL을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름 *</FormLabel>
                  <FormControl>
                    <Input placeholder="이름을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="shop_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>샵명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="샵명을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지역</FormLabel>
                  <FormControl>
                    <Input placeholder="지역을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    이메일 {selectedKol && <Badge variant="secondary">읽기 전용</Badge>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder={selectedKol ? undefined : "연결할 사용자 이메일 주소"}
                      readOnly={selectedKol !== null}
                      className={selectedKol ? "bg-muted" : ""}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : selectedKol ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ShopModal({
  isOpen,
  onClose,
  selectedShop,
  onSubmit,
  kols
}: ShopModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<ShopFormData>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shop_name: "",
      owner_name: "",
      kol_id: "",
      region: "",
      email: "",
    },
  });

  // 선택된 Shop 데이터로 폼 초기화
  React.useEffect(() => {
    if (selectedShop) {
      form.reset({
        shop_name: selectedShop.shop_name,
        owner_name: selectedShop.owner_name,
        kol_id: selectedShop.kol_id ? selectedShop.kol_id.toString() : "",
        region: selectedShop.region || "",
        email: selectedShop.email || "",
      });
    } else {
      form.reset({
        shop_name: "",
        owner_name: "",
        kol_id: "",
        region: "",
        email: "",
      });
    }
  }, [selectedShop, form]);

  const handleSubmit = async (data: ShopFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast({
        title: "성공",
        description: `전문점이 ${selectedShop ? '수정' : '추가'}되었습니다.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "오류",
        description: "작업 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {selectedShop ? '전문점 정보 수정' : '전문점 추가'}
          </DialogTitle>
          <DialogDescription>
            {selectedShop ? '전문점 정보를 수정합니다.' : '새로운 전문점을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="shop_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>전문점명 *</FormLabel>
                  <FormControl>
                    <Input placeholder="전문점명을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="owner_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>담당자 *</FormLabel>
                  <FormControl>
                    <Input placeholder="담당자명을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="kol_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KOL 선택 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="KOL을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {kols.map((kol) => (
                        <SelectItem key={kol.id} value={kol.id.toString()}>
                          {kol.id} / {kol.name} / {kol.shop_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>지역</FormLabel>
                  <FormControl>
                    <Input placeholder="지역을 입력하세요" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    이메일 (선택)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="전문점 이메일 주소 (선택사항)"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : selectedShop ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteModal({
  isOpen,
  onClose,
  deleteType,
  onConfirm,
  relatedShopsCount
}: DeleteModalProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast({
        title: "삭제 완료",
        description: `${deleteType === 'kol' ? 'KOL' : '전문점'}이 삭제되었습니다.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            삭제 확인
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {deleteType === 'kol' ? (
              relatedShopsCount > 0 ? (
                <>
                  <p>이 KOL을 삭제하시겠습니까?</p>
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium text-destructive">
                      ⚠️ {relatedShopsCount}개의 전문점도 함께 삭제됩니다.
                    </p>
                  </div>
                  <p className="text-sm">이 작업은 되돌릴 수 없습니다.</p>
                </>
              ) : (
                <p>이 KOL을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
              )
            ) : (
              <p>이 전문점을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}