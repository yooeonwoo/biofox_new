'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, User, Building2, MapPin, Percent } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// 폼 검증 스키마
const userFormSchema = z.object({
  email: z
    .string()
    .min(1, '이메일은 필수입니다')
    .email('유효한 이메일을 입력해주세요'),
  name: z
    .string()
    .min(2, '이름은 최소 2글자 이상이어야 합니다')
    .max(50, '이름은 50글자를 초과할 수 없습니다'),
  role: z.enum(['admin', 'kol', 'ol', 'shop_owner'], {
    errorMap: () => ({ message: '역할을 선택해주세요' })
  }),
  shop_name: z
    .string()
    .min(2, '상점명은 최소 2글자 이상이어야 합니다')
    .max(100, '상점명은 100글자를 초과할 수 없습니다'),
  region: z
    .string()
    .max(50, '지역은 50글자를 초과할 수 없습니다')
    .optional()
    .or(z.literal('')),
  commission_rate: z
    .number()
    .min(0, '수수료율은 0% 이상이어야 합니다')
    .max(100, '수수료율은 100% 이하여야 합니다')
    .optional()
    .or(z.literal(0))
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// 역할 레이블 매핑
const roleLabels = {
  admin: '관리자',
  kol: 'KOL',
  ol: 'OL',
  shop_owner: '상점 운영자'
};

// 역할 설명 매핑
const roleDescriptions = {
  admin: '시스템 전체 관리 권한',
  kol: 'Key Opinion Leader - 의료진',
  ol: 'Opinion Leader - 고급 사용자',
  shop_owner: '상점/샵 운영자'
};

export function UserAddModal({ isOpen, onClose, onSuccess }: UserAddModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: '',
      name: '',
      role: 'shop_owner',
      shop_name: '',
      region: '',
      commission_rate: 0
    }
  });

  const selectedRole = form.watch('role');

  // 폼 초기화
  const resetForm = () => {
    form.reset();
    setSubmitError(null);
  };

  // 모달 닫기
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          name: data.name.trim(),
          role: data.role,
          shop_name: data.shop_name.trim(),
          region: data.region?.trim() || null,
          commission_rate: data.commission_rate || 0
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details && Array.isArray(result.details)) {
          // 검증 오류 처리
          const errorMsg = result.details.map((err: any) => err.message).join(', ');
          setSubmitError(errorMsg);
        } else {
          setSubmitError(result.error || '사용자 생성에 실패했습니다.');
        }
        return;
      }

      // 성공
      toast({
        title: '사용자 생성 완료',
        description: `${data.name}님에게 초대 이메일이 발송되었습니다.`,
      });

      resetForm();
      onSuccess();
      onClose();

    } catch (error) {
      console.error('User creation error:', error);
      setSubmitError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            새 사용자 추가
          </DialogTitle>
          <DialogDescription>
            새로운 사용자를 초대하고 계정을 생성합니다. 초대 이메일이 자동으로 발송됩니다.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 에러 메시지 */}
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 이메일 */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      이메일 주소 *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="user@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 이름 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      이름 *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="사용자 이름"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 역할 */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>역할 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger disabled={isSubmitting}>
                          <SelectValue placeholder="역할을 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <span>{label}</span>
                              <Badge variant="outline" className="text-xs">
                                {roleDescriptions[value as keyof typeof roleDescriptions]}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 상점명 */}
              <FormField
                control={form.control}
                name="shop_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      상점명 *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="상점/샵 이름"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 지역 */}
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      지역
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="서울, 부산, 대구 등"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 수수료율 - KOL/OL/Shop Owner에게만 표시 */}
            {selectedRole !== 'admin' && (
              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      수수료율 (%)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 안내 메시지 */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">초대 이메일 발송</p>
                  <p>사용자 생성 후 입력한 이메일 주소로 계정 활성화 링크가 자동으로 발송됩니다.</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  '사용자 생성'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 