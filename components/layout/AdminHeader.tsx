'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from 'lucide-react';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export default function AdminHeader() {
  const { user, logout } = useSimpleAuth();

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
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={undefined} alt={user?.name} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.name || '사용자'}</p>
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>프로필 설정</DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
