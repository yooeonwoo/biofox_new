'use client';

import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Filter,
  Calendar,
  FileText,
  CreditCard,
  BarChart3,
  MessageSquare,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronDown,
  MoreVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  metadata?: any;
}

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 실제 Convex 알림 데이터 조회 (사용자 프로필 ID 기반)
  const notifications = useQuery(
    api.notifications.getNotificationsByProfile,
    user?.profileId ? { profileId: user.profileId, limit: 20, offset: (page - 1) * 20 } : 'skip'
  );

  // 더미 데이터 (실제 Convex 연동 전까지 사용)
  const getDummyNotifications = (): Notification[] => {
    if (!user) return [];

    return [
      {
        id: '1',
        type: 'sales_update',
        title: '매출 업데이트',
        message: `${user.shop_name || user.name}님의 이번 달 매출이 전월 대비 15% 증가했습니다.`,
        isRead: false,
        priority: 'high',
        createdAt: Date.now() - 3600000, // 1시간 전
        relatedType: 'sales',
        relatedId: 'sales_001',
      },
      {
        id: '2',
        type: 'commission_ready',
        title: '수수료 정산 완료',
        message: '이번 달 수수료 정산이 완료되었습니다. 확인해주세요.',
        isRead: false,
        priority: 'normal',
        createdAt: Date.now() - 7200000, // 2시간 전
        relatedType: 'commission',
        relatedId: 'comm_001',
      },
      {
        id: '3',
        type: 'training_reminder',
        title: '교육 일정 알림',
        message: '내일 오후 2시 온라인 교육이 예정되어 있습니다.',
        isRead: true,
        priority: 'normal',
        createdAt: Date.now() - 86400000, // 1일 전
        relatedType: 'training',
        relatedId: 'train_001',
      },
    ];
  };

  const getNotifications = () => {
    // Convex 데이터가 있으면 사용, 없으면 더미 데이터 사용
    return notifications || getDummyNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setLoading(true);
    try {
      // TODO: Convex mutation 호출
      console.log('알림 읽음 처리:', notificationId);
      // await markNotificationAsRead({ notificationId });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      // TODO: Convex mutation 호출
      console.log('모든 알림 읽음 처리');
      // await markAllNotificationsAsRead({ profileId: user?.profileId });
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      // TODO: Convex mutation 호출
      console.log('알림 삭제:', notificationId);
      // await deleteNotification({ notificationId });
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  // 로딩 중일 때
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 사용자가 없을 때
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">인증이 필요합니다</h2>
          <p className="text-gray-600">알림을 확인하려면 로그인해주세요.</p>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sales_update':
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'commission_ready':
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case 'training_reminder':
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case 'system_notice':
        return <Settings className="h-5 w-5 text-gray-600" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'sales_update':
        return '매출 업데이트';
      case 'commission_ready':
        return '수수료 정산';
      case 'training_reminder':
        return '교육 알림';
      case 'system_notice':
        return '시스템 공지';
      case 'message':
        return '메시지';
      default:
        return '알림';
    }
  };

  const allNotifications = getNotifications();
  const filteredNotifications = allNotifications.filter(notification => {
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'important' && notification.priority !== 'high') return false;
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    return true;
  });

  const unreadCount = allNotifications.filter(n => !n.isRead).length;
  const types = [...new Set(allNotifications.map(n => n.type))];

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          <p className="text-sm text-gray-600">
            {user.shop_name || user.name}님의 알림{' '}
            {unreadCount > 0 && `(읽지 않음 ${unreadCount}개)`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={loading || unreadCount === 0}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            모두 읽음
          </Button>
        </div>
      </div>

      {/* 필터링 */}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="flex gap-1">
          {(['all', 'unread', 'important'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' && '전체'}
              {f === 'unread' && '읽지 않음'}
              {f === 'important' && '중요'}
            </Button>
          ))}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-1 h-4 w-4" />
              {selectedType === 'all' ? '모든 종류' : getTypeDisplayName(selectedType)}
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedType('all')}>모든 종류</DropdownMenuItem>
            <DropdownMenuSeparator />
            {types.map(type => (
              <DropdownMenuItem key={type} onClick={() => setSelectedType(type)}>
                {getTypeDisplayName(type)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 알림 목록 */}
      <NotificationList
        notifications={filteredNotifications}
        loading={loading}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        getNotificationIcon={getNotificationIcon}
        getPriorityColor={getPriorityColor}
        getTypeDisplayName={getTypeDisplayName}
      />

      {/* 더 보기 버튼 */}
      {hasMore && filteredNotifications.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? '로딩 중...' : '더 보기'}
          </Button>
        </div>
      )}

      {/* 빈 상태 */}
      {filteredNotifications.length === 0 && (
        <div className="py-12 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">알림이 없습니다</h3>
          <p className="text-gray-600">
            {filter === 'all' ? '새로운 알림이 없습니다.' : '해당 조건에 맞는 알림이 없습니다.'}
          </p>
        </div>
      )}
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getNotificationIcon: (type: string) => JSX.Element;
  getPriorityColor: (priority: string) => string;
  getTypeDisplayName: (type: string) => string;
}

function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getPriorityColor,
  getTypeDisplayName,
}: NotificationListProps) {
  return (
    <div className="space-y-3">
      {notifications.map(notification => (
        <Card
          key={notification.id}
          className={`transition-all duration-200 hover:shadow-md ${
            !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* 아이콘 */}
              <div className="mt-0.5 flex-shrink-0">{getNotificationIcon(notification.type)}</div>

              {/* 내용 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3
                        className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                      >
                        {notification.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                      >
                        {getTypeDisplayName(notification.type)}
                      </Badge>
                      {notification.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          긴급
                        </Badge>
                      )}
                    </div>
                    <p
                      className={`text-sm ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}
                    >
                      {notification.message}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!notification.isRead && (
                        <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          읽음 표시
                        </DropdownMenuItem>
                      )}
                      {notification.isRead && (
                        <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                          <EyeOff className="mr-2 h-4 w-4" />
                          읽지 않음 표시
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(notification.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
