'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(/[A-Z]/, '대문자를 포함해야 합니다.')
      .regex(/[a-z]/, '소문자를 포함해야 합니다.')
      .regex(/[0-9]/, '숫자를 포함해야 합니다.'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 일치하지 않습니다.',
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // URL에서 토큰 확인
    const checkResetToken = async () => {
      const supabase = createClient();

      try {
        // 현재 세션 확인
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setIsValidToken(true);
        } else {
          // 세션이 없으면 인증 상태 변경 리스너 설정
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
              setIsValidToken(true);
            }
          });

          // 컴포넌트 언마운트 시 구독 해제
          return () => subscription.unsubscribe();
        }
      } catch (error) {
        console.error('토큰 확인 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkResetToken();
  }, []);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      setIsSuccess(true);

      toast({
        title: '비밀번호 변경 완료',
        description: '새로운 비밀번호로 로그인해주세요.',
      });

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } catch (error: any) {
      console.error('비밀번호 변경 오류:', error);

      toast({
        title: '오류',
        description: error.message || '비밀번호 변경 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">유효하지 않은 링크</CardTitle>
            <CardDescription>
              비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                비밀번호 재설정을 다시 시도하려면 비밀번호 찾기 페이지로 이동하세요.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full">비밀번호 찾기로 이동</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            {isSuccess ? '비밀번호 변경 완료' : '새 비밀번호 설정'}
          </CardTitle>
          <CardDescription>
            {isSuccess ? '새로운 비밀번호가 설정되었습니다.' : '새로운 비밀번호를 입력해주세요.'}
          </CardDescription>
        </CardHeader>

        {isSuccess ? (
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>

            <Alert>
              <AlertDescription className="text-center">
                비밀번호가 성공적으로 변경되었습니다.
                <br />
                잠시 후 로그인 페이지로 이동합니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />새 비밀번호
                </Label>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  {...form.register('password')}
                  disabled={isSubmitting}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  비밀번호 확인
                </Label>
                <Input
                  id="confirmPassword"
                  placeholder="••••••••"
                  type="password"
                  {...form.register('confirmPassword')}
                  disabled={isSubmitting}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  비밀번호는 8자 이상이며, 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  '비밀번호 변경'
                )}
              </Button>

              <Link
                href="/signin"
                className="text-center text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                로그인 페이지로 돌아가기
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
