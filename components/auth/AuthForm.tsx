import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthActions } from '@convex-dev/auth/react';
import Link from 'next/link';

// 공통 스키마
const baseSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

const signUpSchema = baseSchema
  .extend({
    confirmPassword: z.string().min(6, '비밀번호 확인을 입력해주세요.'),
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
  const { signIn } = useAuthActions();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(type === 'signup' ? signUpSchema : baseSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (type === 'signin') {
        await signIn('password', {
          flow: 'signIn',
          email: values.email,
          password: values.password,
        });
        toast({ description: '로그인 성공!' });
        router.push('/');
      } else {
        await signIn('password', {
          flow: 'signUp',
          email: values.email,
          password: values.password,
        });
        toast({ description: '회원가입 성공! 확인 이메일을 확인하세요.' });
        router.push('/signup/success');
      }
    } catch (err: any) {
      console.error(err);
      toast({ description: err.message || '인증 중 오류가 발생했습니다.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{type === 'signin' ? '로그인' : '회원가입'}</CardTitle>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Input placeholder="이메일" {...form.register('email')} type="email" />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.email.message as string}
                </p>
              )}
            </div>
            <div>
              <Input placeholder="비밀번호" {...form.register('password')} type="password" />
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.password.message as string}
                </p>
              )}
            </div>
            {type === 'signup' && (
              <div>
                <Input
                  placeholder="비밀번호 확인"
                  {...form.register('confirmPassword')}
                  type="password"
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.confirmPassword.message as string}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : type === 'signin' ? '로그인' : '회원가입'}
            </Button>
            {type === 'signin' ? (
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Link href="/signup" className="text-blue-600 hover:underline">
                  회원가입
                </Link>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link href="/signin" className="text-blue-600 hover:underline">
                  로그인
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
