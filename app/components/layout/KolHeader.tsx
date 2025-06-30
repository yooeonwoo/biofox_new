"use client";

import Link from 'next/link';
import { 
  ChevronDown, 
  Menu,
  LogOut,
  Key,
  Bell,
  X,
  User
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../../../components/ui/sheet";
import { DialogTitle } from "../../../components/ui/dialog";
import { Separator } from "../../../components/ui/separator";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import KolSidebar from "./KolSidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface KolHeaderProps {
  userName?: string;
  shopName?: string;
  userImage?: string;
  onSignOut?: () => void;
  onMenuClick?: () => void;
  className?: string;
}

export default function KolHeader({ 
  userName, 
  shopName, 
  userImage,
  onSignOut,
  onMenuClick,
  className
}: KolHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userInitials = userName?.substring(0, 2) || "KL";
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 임시 사용자 정보 (로컬 개발용)
  const tempUser = {
    id: 'temp-user-id',
    name: '테스트 사용자',
    email: 'test@example.com',
    avatar: null
  };

  useEffect(() => {
    // 알림 데이터 로드 (userId 제거)
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/kol-new/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('알림 로드 실패:', error);
      }
    };

    loadNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/kol-new/notifications/read-all', {
        method: 'POST',
      });
      
      if (response.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await fetch(`/api/kol-new/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, isRead: true }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 프로필 표시 개선 함수
  const getDisplayName = () => {
    if (!userName) return "사용자";
    return userName;
  };

  const getDisplayShopName = () => {
    if (!shopName) return "내 상점";
    return shopName;
  };

  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-4 shadow-sm",
        "lg:h-[60px] lg:px-6",
        className
      )}>
        {/* 햄버거 메뉴 (모바일) */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        {/* 로고 (모바일에서만 표시) */}
        <div className="flex items-center space-x-2 md:hidden">
          <img 
            src="/images/biofox-logo.png" 
            alt="BIOFOX" 
            className="h-8 w-auto"
          />
          <span className="text-xl font-bold text-gray-900">BIOFOX</span>
        </div>
        
        {/* 비어있는 공간 */}
        <div className="flex-1" />

        {/* 우측 메뉴 영역 */}
        <div className="flex items-center space-x-4">
          {/* 알림 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <span className="font-semibold">알림</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    모두 읽음
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    새로운 알림이 없습니다
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex flex-col items-start p-3 cursor-pointer",
                        !notification.isRead && "bg-blue-50"
                      )}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {notification.message}
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 사용자 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={tempUser.avatar || ''} alt={tempUser.name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{tempUser.name}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {tempUser.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                프로필 설정
              </DropdownMenuItem>
              <DropdownMenuItem>
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
    </>
  );
} 