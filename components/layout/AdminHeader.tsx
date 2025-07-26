'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import Link from 'next/link';

export default function AdminHeader() {
  const { user: currentUser, profile, isLoading } = useAuth();

  const getUserInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <header className="flex h-16 items-center justify-end border-b bg-gray-50 px-4">
        <div className="h-8 w-24 animate-pulse rounded-md bg-gray-200" />
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center space-x-2">
        <img src="/images/biofox-logo.png" alt="BIOFOX" className="h-8 w-auto" />
        <span className="text-xl font-bold text-gray-900">BIOFOX 관리자</span>
      </div>

      <div className="flex items-center space-x-4">
        {/* 사용자 메뉴 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-full justify-start text-sm">
              <Avatar className="mr-2 h-8 w-8">
                <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                <AvatarFallback>{getUserInitials(profile?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="font-medium">{profile?.name || 'Admin'}</span>
                <span className="text-xs text-gray-500">{currentUser?.email}</span>
              </div>
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{currentUser?.user?.name || '사용자'}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {currentUser?.user?.email || '로그인 중...'}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">프로필 설정</Link>
            </DropdownMenuItem>
            <div className="p-1">
              <SignOutButton
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                confirmDialog={true}
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
