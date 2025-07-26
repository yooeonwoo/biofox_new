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
import { useSupabaseAuth } from '@/providers/supabase-auth-provider';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';

// 스키마 정의
const signInSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

const signUpSchema = z
  .object({
    name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
    email: z.string().email('올바른 이메일 형식이 아닙니다.'),
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

export type AuthFormType = 'signin' | 'signup';

interface AuthFormProps {
  type: AuthFormType;
}

export const AuthForm: React.FC<AuthFormProps> = ({ type }) => {
  const { signIn, signUp } = useSupabaseAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(type === 'signup' ? signUpSchema : signInSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (type === 'signin') {
        await signIn(values.email, values.password);

        toast({
          title: '로그인 성공',
          description: '환영합니다!',
        });

        // 로그인 후 대시보드로 이동
        router.push('/kol-new');
      } else {
        await signUp(values.email, values.password, {
          name: values.name,
          shop_name: '매장명 미입력',
          role: 'shop_owner',
          region: '지역 미입력',
        });

        toast({
          title: '회원가입 성공',
          description: '프로필을 완성해주세요.',
        });

        // 회원가입 후 프로필 페이지로 이동
        router.push('/profile');
      }
    } catch (err: any) {
      console.error('인증 오류:', err);

      let errorMessage = '인증 중 오류가 발생했습니다.';

      // 에러 메시지 처리
      if (err.message?.includes('Invalid email or password')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (err.message?.includes('User already exists')) {
        errorMessage = '이미 등록된 이메일입니다.';
      } else if (err.message?.includes('Network error')) {
        errorMessage = '네트워크 오류가 발생했습니다. 다시 시도해주세요.';
      }

      toast({
        title: '오류',
        description: errorMessage,
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
            {type === 'signin' ? '로그인' : '회원가입'}
          </CardTitle>
          <CardDescription>
            {type === 'signin'
              ? 'Biofox KOL 시스템에 로그인하세요.'
              : 'Biofox KOL 시스템에 가입하세요.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {type === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  이름
                </Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  {...form.register('name')}
                  disabled={isSubmitting}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message as string}
                  </p>
                )}
              </div>
            )}

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
                <p className="text-sm text-red-500">
                  {form.formState.errors.email.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                비밀번호
              </Label>
              <Input
                id="password"
                placeholder="••••••••"
                type="password"
                {...form.register('password')}
                disabled={isSubmitting}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.password.message as string}
                </p>
              )}
            </div>

            {type === 'signup' && (
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
                    {form.formState.errors.confirmPassword.message as string}
                  </p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : type === 'signin' ? (
                '로그인'
              ) : (
                '회원가입'
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {type === 'signin' ? (
                <>
                  계정이 없으신가요?{' '}
                  <Link
                    href="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    회원가입
                  </Link>
                </>
              ) : (
                <>
                  이미 계정이 있으신가요?{' '}
                  <Link
                    href="/signin"
                    className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    로그인
                  </Link>
                </>
              )}
            </div>

            {type === 'signin' && (
              <Link
                href="/forgot-password"
                className="text-center text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
