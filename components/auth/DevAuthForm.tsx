import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users, ShoppingCart } from 'lucide-react';

const DEV_ACCOUNTS = [
  {
    email: 'reflance88@gmail.com',
    password: 'admin123',
    role: 'kol',
    name: 'KOL 테스트 계정',
    icon: User,
    description: 'KOL 계정으로 로그인',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
  },
  {
    email: 'sales@test.com',
    password: 'sales123',
    role: 'sales',
    name: 'Sales 테스트 계정',
    icon: ShoppingCart,
    description: 'Sales 계정으로 로그인',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
  },
  {
    email: 'admin@biofox.com',
    password: 'admin123',
    role: 'admin',
    name: '관리자 계정',
    icon: Users,
    description: '관리자 계정으로 로그인',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200',
  },
];

export const DevAuthForm: React.FC = () => {
  const { signIn } = useAuthActions();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);

  const handleDevLogin = async (account: (typeof DEV_ACCOUNTS)[0]) => {
    setIsLoggingIn(account.email);
    try {
      await signIn('password', {
        flow: 'signIn',
        email: account.email,
        password: account.password,
      });

      toast({
        description: `${account.name}으로 로그인되었습니다!`,
        variant: 'default',
      });

      // 역할별 리다이렉트
      switch (account.role) {
        case 'admin':
          router.push('/admin-new');
          break;
        case 'kol':
          router.push('/kol-new');
          break;
        case 'sales':
          router.push('/shop');
          break;
        default:
          router.push('/');
      }
    } catch (err: any) {
      console.error('개발 로그인 실패:', err);
      toast({
        description: err.message || '로그인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">🚀 개발용 로그인</CardTitle>
            <p className="mt-2 text-gray-600">테스트 계정을 선택하여 원클릭 로그인하세요</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {DEV_ACCOUNTS.map(account => {
              const Icon = account.icon;
              const isLoading = isLoggingIn === account.email;

              return (
                <Button
                  key={account.email}
                  onClick={() => handleDevLogin(account)}
                  disabled={isLoading}
                  className={`h-20 w-full ${account.bgColor} ${account.borderColor} border-2 text-gray-800 transition-all duration-200 hover:text-gray-900`}
                  variant="ghost"
                >
                  <div className="flex w-full items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-lg font-semibold">{account.name}</div>
                      <div className="text-sm opacity-70">{account.description}</div>
                      <div className="mt-1 text-xs opacity-50">
                        {account.email} • {account.role.toUpperCase()}
                      </div>
                    </div>
                    {isLoading && (
                      <div className="flex-shrink-0">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>⚠️ 이 화면은 개발 환경에서만 표시됩니다</p>
          <p className="mt-1">프로덕션에서는 일반 로그인 폼이 표시됩니다</p>
        </div>
      </div>
    </div>
  );
};
