'use client';

import { useState } from 'react';
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
} from 'lucide-react';

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
  metadata?: any;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [paginationOpts, setPaginationOpts] = useState({
    numItems: 20,
    cursor: null as string | null,
  });

  // Convex queries and mutations
  const allNotificationsResult = useQuery(api.notifications.getUserNotifications, {
    paginationOpts,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const unreadNotificationsResult = useQuery(api.notifications.getUserNotifications, {
    paginationOpts,
    isRead: false,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const unreadCountResult = useQuery(api.notifications.getUnreadNotificationCount, {});

  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  // Extract data based on active tab
  const getNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotificationsResult?.page || [];
      case 'all':
      default:
        return allNotificationsResult?.page || [];
    }
  };

  const notifications = getNotifications();
  const loading = allNotificationsResult === undefined;
  const unreadCount = unreadCountResult?.unreadCount || 0;

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // Handle delete notification
  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification({
        notificationId: notificationId as any,
        permanent: false, // 소프트 삭제
      });
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  // Handle pagination
  const handleLoadMore = () => {
    const currentResult =
      activeTab === 'unread' ? unreadNotificationsResult : allNotificationsResult;
    if (currentResult && !currentResult.isDone && currentResult.continueCursor) {
      setPaginationOpts(prev => ({
        ...prev,
        cursor: currentResult.continueCursor,
      }));
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return <FileText className="h-5 w-5" />;
      case 'commission_paid':
        return <CreditCard className="h-5 w-5" />;
      case 'clinical_progress':
        return <BarChart3 className="h-5 w-5" />;
      case 'approval_required':
        return <MessageSquare className="h-5 w-5" />;
      case 'status_changed':
        return <Settings className="h-5 w-5" />;
      case 'reminder':
        return <Calendar className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get notification priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Get type display name
  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      system: '시스템',
      crm_update: 'CRM 업데이트',
      order_created: '주문 생성',
      commission_paid: '커미션 지급',
      clinical_progress: '임상 진행',
      approval_required: '승인 요청',
      status_changed: '상태 변경',
      reminder: '알림',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">알림</h1>
          <p className="mt-1 text-gray-600">
            {unreadCount > 0
              ? `${unreadCount}개의 읽지 않은 알림이 있습니다`
              : '모든 알림을 확인했습니다'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPaginationOpts({ numItems: 20, cursor: null })}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} disabled={loading}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              모두 읽음
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">전체 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allNotificationsResult?.page.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">읽지 않음</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">우선순위 높음</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {unreadCountResult?.hasHighPriority ? '있음' : '없음'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">전체 알림</TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            읽지 않음
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <NotificationList
            notifications={notifications}
            loading={loading}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            getTypeDisplayName={getTypeDisplayName}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <NotificationList
            notifications={notifications}
            loading={loading}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            getTypeDisplayName={getTypeDisplayName}
          />
        </TabsContent>
      </Tabs>

      {/* Load More Button */}
      {!loading && notifications.length > 0 && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={allNotificationsResult?.isDone}
          >
            더 보기
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && notifications.length === 0 && (
        <div className="py-12 text-center">
          <Bell className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {activeTab === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'unread'
              ? '모든 알림을 확인했습니다.'
              : '새로운 알림이 있을 때 여기에 표시됩니다.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Notification List Component
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
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                  <div className="h-3 w-1/4 rounded bg-gray-200"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map(notification => (
        <Card
          key={notification.id}
          className={`border-l-4 transition-all hover:shadow-md ${
            !notification.isRead ? getPriorityColor(notification.priority) : 'border-l-gray-300'
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex flex-1 items-start space-x-4">
                <div
                  className={`flex-shrink-0 rounded-full p-2 ${
                    notification.priority === 'high'
                      ? 'bg-red-100 text-red-600'
                      : notification.priority === 'normal'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`text-lg font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getTypeDisplayName(notification.type)}
                    </Badge>
                  </div>

                  <p className="mt-2 leading-relaxed text-gray-600">{notification.message}</p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                    <Badge
                      variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {notification.priority === 'high'
                        ? '높음'
                        : notification.priority === 'normal'
                          ? '보통'
                          : '낮음'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="ml-4 flex items-center space-x-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
