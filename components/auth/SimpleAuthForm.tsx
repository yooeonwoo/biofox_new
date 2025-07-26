import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthActions } from '@convex-dev/auth/react';
import { LogOut, ArrowLeft } from 'lucide-react';
import { DevAuthForm } from './DevAuthForm';

// 스키마 정의
const signInSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
});

const signUpSchema = signInSchema
  .extend({
    name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
    confirmPassword: z.string().min(6, '비밀번호 확인을 입력해주세요.'),
  })
  .refine(data => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '비밀번호가 일치하지 않습니다.',
  });

interface SimpleAuthFormProps {
  initialTab?: 'signin' | 'signup' | 'dev';
  onAuthSuccess?: () => void;
}

export const SimpleAuthForm: React.FC<SimpleAuthFormProps> = ({
  initialTab = 'dev',
  onAuthSuccess,
}) => {
  const { signIn, signOut } = useAuthActions();
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 폼
  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  // 회원가입 폼
  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', name: '' },
  });

  // 로그인 처리
  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    try {
      await signIn('password', {
        flow: 'signIn',
        email: values.email,
        password: values.password,
      });

      toast({ description: '로그인 성공!' });
      onAuthSuccess?.();
      router.refresh();
    } catch (err: any) {
      console.error('로그인 실패:', err);
      toast({
        description: err.message || '로그인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 회원가입 처리
  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      await signIn('password', {
        flow: 'signUp',
        email: values.email,
        password: values.password,
        name: values.name,
      });

      toast({
        description: '회원가입 성공! 프로필을 완성해주세요.',
        duration: 5000,
      });
      onAuthSuccess?.();
      router.push('/profile');
    } catch (err: any) {
      console.error('회원가입 실패:', err);
      toast({
        description: err.message || '회원가입 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로그아웃 처리
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ description: '로그아웃 되었습니다.' });
      router.push('/signin');
    } catch (err: any) {
      console.error('로그아웃 실패:', err);
      toast({
        description: '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 개발 모드 체크 (프로덕션에서도 임시로 허용)
  const isDevelopment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname.includes('127.0.0.1') ||
      window.location.hostname.includes('vercel.app') ||
      window.location.hostname.includes('.app') ||
      process.env.NODE_ENV === 'development' ||
      true); // 임시로 항상 true

  // 개발 모드에서는 DevAuthForm을 기본으로 표시
  if (isDevelopment && activeTab === 'dev') {
    return (
      <div>
        <DevAuthForm />
        <div className="fixed right-4 top-4">
          <Button
            onClick={() => setActiveTab('signin')}
            variant="outline"
            size="sm"
            className="bg-white shadow-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            일반 로그인
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-900">
              Biofox KOL
            </CardTitle>
          </CardHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab as any}>
            <TabsList className="mx-6 grid w-full grid-cols-2">
              <TabsTrigger value="signin">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            {/* 로그인 탭 */}
            <TabsContent value="signin">
              <form onSubmit={signInForm.handleSubmit(handleSignIn)}>
                <CardContent className="space-y-4">
                  <div>
                    <Input placeholder="이메일" type="email" {...signInForm.register('email')} />
                    {signInForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {signInForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="비밀번호"
                      type="password"
                      {...signInForm.register('password')}
                    />
                    {signInForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-500">
                        {signInForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? '로그인 중...' : '로그인'}
                  </Button>

                  {isDevelopment && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab('dev')}
                    >
                      🚀 개발용 로그인
                    </Button>
                  )}
                </CardFooter>
              </form>
            </TabsContent>

            {/* 회원가입 탭 */}
            <TabsContent value="signup">
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)}>
                <CardContent className="space-y-4">
                  <div>
                    <Input placeholder="이름" {...signUpForm.register('name')} />
                    {signUpForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-500">
                        {signUpForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input placeholder="이메일" type="email" {...signUpForm.register('email')} />
                    {signUpForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {signUpForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="비밀번호"
                      type="password"
                      {...signUpForm.register('password')}
                    />
                    {signUpForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-500">
                        {signUpForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="비밀번호 확인"
                      type="password"
                      {...signUpForm.register('confirmPassword')}
                    />
                    {signUpForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">
                        {signUpForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? '가입 중...' : '회원가입'}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        {/* 로그아웃 버튼 (별도 카드) */}
        <Card className="mt-4">
          <CardContent className="pt-4">
            <Button onClick={handleSignOut} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleAuthForm;
