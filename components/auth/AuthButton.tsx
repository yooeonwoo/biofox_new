'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';

export function AuthButton() {
  const { isAuthenticated, isLoading, user, profile, signOut } = useAuth();

  if (isLoading) {
    return (
      <Button variant="ghost" disabled>
        로딩중...
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button asChild variant="default">
        <a href="/signin">
          <LogIn className="mr-2 h-4 w-4" />
          로그인
        </a>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* 사용자 정보 표시 */}
      <div className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1">
        <User className="h-4 w-4" />
        <span className="text-sm">{profile?.display_name || user?.name || '사용자'}</span>
        {profile?.role && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
            {getRoleLabel(profile.role)}
          </span>
        )}
      </div>

      {/* 로그아웃 버튼 */}
      <Button variant="outline" size="sm" onClick={() => signOut()}>
        <LogOut className="mr-2 h-4 w-4" />
        로그아웃
      </Button>
    </div>
  );
}

function getRoleLabel(role: string): string {
  const roleLabels = {
    admin: '관리자',
    kol: 'KOL',
    ol: 'OL',
    shop_owner: '매장 관리자',
  };

  return roleLabels[role as keyof typeof roleLabels] || role;
}
