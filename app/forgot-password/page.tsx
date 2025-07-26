'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Image from 'next/image';

const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      // TODO: 실제 비밀번호 재설정 이메일 발송 API 호출
      // await sendPasswordResetEmail(values.email);

      // 임시로 성공 처리
      await new Promise(resolve => setTimeout(resolve, 1500));

      setIsSuccess(true);

      toast({
        title: '이메일 전송 완료',
        description: '비밀번호 재설정 링크가 이메일로 전송되었습니다.',
      });
    } catch (error: any) {
      console.error('비밀번호 재설정 오류:', error);

      toast({
        title: '오류',
        description: error.message || '이메일 전송 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          {/* 로고 */}
          <div className="mb-4 flex justify-center">
            <Image
              src="/images/biofox-logo.png"
              alt="Biofox Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>

          <CardTitle className="text-2xl font-bold">
            {isSuccess ? '이메일 전송 완료' : '비밀번호 찾기'}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? '비밀번호 재설정 링크를 확인해주세요.'
              : '가입하신 이메일 주소를 입력해주세요.'}
          </CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>

            <Alert>
              <AlertDescription className="text-center">
                <strong>{form.getValues('email')}</strong>로 비밀번호 재설정 링크를 전송했습니다.
                <br />
                이메일을 확인하시고 링크를 클릭하여 새 비밀번호를 설정해주세요.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-center text-sm text-gray-600">
              <p>이메일이 도착하지 않았나요?</p>
              <p>스팸 메일함을 확인하거나 다시 시도해주세요.</p>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  이메일
                </Label>
                <Input
                  id="email"
                  placeholder="example@biofox.com"
                  type="email"
                  {...form.register('email')}
                  disabled={isSubmitting}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  입력하신 이메일로 비밀번호 재설정 링크를 보내드립니다. 링크는 24시간 동안
                  유효합니다.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  '비밀번호 재설정 링크 받기'
                )}
              </Button>
            </CardFooter>
          </form>
        )}

        <CardFooter>
          <Link
            href="/signin"
            className="flex w-full items-center justify-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            로그인 페이지로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
