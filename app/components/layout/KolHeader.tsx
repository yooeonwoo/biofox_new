'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  User,
  Settings,
  LogOut,
  CreditCard,
  FileText,
  BarChart3,
  Calendar,
  MessageSquare,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// Convex imports
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high';
  createdAt: number;
  relatedType?: string;
  relatedId?: any;
}

export default function KolHeader() {
  const { user, profile, signOut } = useAuth();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Convex queries와 뮤테이션은 로그인된 경우에만 실행
  const notificationsResult = useQuery(
    api.notifications.getUserNotifications,
    profile
      ? {
          paginationOpts: { numItems: 10, cursor: null },
          isRead: false,
          sortBy: 'created_at',
          sortOrder: 'desc',
        }
      : 'skip'
  );

  const unreadCountResult = useQuery(
    api.notifications.getUnreadNotificationCount,
    profile ? {} : 'skip'
  );

  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);

  // Extract data from Convex queries
  const notifications = notificationsResult?.page || [];
  const unreadCount = unreadCountResult?.unreadCount || 0;
  const hasHighPriority = unreadCountResult?.hasHighPriority || false;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }

    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen]);

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // Handle individual notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead({ notificationId: notification.id as any });
      }

      // Handle navigation based on notification type
      if (notification.relatedType && notification.relatedId) {
        // Navigate to related content if available
        // This would be implemented based on your routing logic
        console.log('Navigate to:', notification.relatedType, notification.relatedId);
      }
    } catch (error) {
      console.error('알림 처리 실패:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string | undefined) => {
    switch (type) {
      case 'order_created':
        return <FileText className="h-4 w-4" />;
      case 'commission_paid':
        return <CreditCard className="h-4 w-4" />;
      case 'clinical_progress':
        return <BarChart3 className="h-4 w-4" />;
      case 'approval_required':
        return <MessageSquare className="h-4 w-4" />;
      case 'status_changed':
        return <Settings className="h-4 w-4" />;
      case 'reminder':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get notification priority color
  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 lg:px-8">
      {/* Logo and Title */}
      <div className="flex items-center">
        <Link href="/kol-new" className="flex items-center space-x-3">
          <div className="text-xl font-bold text-blue-600">BIOFOX KOL</div>
        </Link>
      </div>

      {/* Navigation Menu - Mobile hidden */}
      <nav className="hidden items-center space-x-6 md:flex">
        <Link href="/kol-new" className="text-gray-700 transition-colors hover:text-blue-600">
          대시보드
        </Link>
        <Link
          href="/kol-new/sales-journal"
          className="text-gray-700 transition-colors hover:text-blue-600"
        >
          영업일지
        </Link>
        <Link
          href="/kol-new/customer-manager"
          className="text-gray-700 transition-colors hover:text-blue-600"
        >
          고객관리
        </Link>
        <Link
          href="/kol-new/clinical-photos"
          className="text-gray-700 transition-colors hover:text-blue-600"
        >
          임상사진
        </Link>
        <Link
          href="/kol-new/stores"
          className="text-gray-700 transition-colors hover:text-blue-600"
        >
          매장관리
        </Link>
      </nav>

      {/* Right Side - Notifications and User Menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationOpen(!notificationOpen)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant={hasHighPriority ? 'destructive' : 'default'}
                className="absolute -right-2 -top-2 flex h-5 w-5 min-w-[20px] items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* Notification Dropdown */}
          {notificationOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">알림</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        모두 읽음
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setNotificationOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">새로운 알림이 없습니다</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`flex-shrink-0 rounded-full p-2 ${getPriorityColor(notification.priority)}`}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                              >
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                            <p className="mt-1 text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ko,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-gray-100 p-3">
                  <Link
                    href="/kol-new/notifications"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => setNotificationOpen(false)}
                  >
                    모든 알림 보기
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.profile_image_url || undefined} />
                <AvatarFallback>
                  {profile?.display_name?.slice(0, 2) || profile?.name?.slice(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <div className="text-sm font-medium text-gray-900">
                  {profile?.display_name || profile?.name || '사용자'}
                </div>
                <div className="text-xs text-gray-500">{profile?.shop_name || '매장명 없음'}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                프로필 관리
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/kol-new/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center text-red-600 focus:text-red-600"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
