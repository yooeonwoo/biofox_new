'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { 
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
  Filter,
  Check
} from "lucide-react";
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import KolHeader from "../../components/layout/KolHeader";
import KolSidebar from "../../components/layout/KolSidebar";
import KolFooter from "../../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogClose } from "@radix-ui/react-dialog";
import KolMobileMenu from "../../components/layout/KolMobileMenu";
import NotificationPermission from "@/components/NotificationPermission";

// 알림 데이터 타입 정의
interface Notification {
  id: number;
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  timeAgo?: string;
}

// API 함수들
const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await fetch('/api/kol-new/notifications', {
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache' }
  });
  
  if (!response.ok) {
    throw new Error('알림을 불러오는데 실패했습니다.');
  }
  
  const data = await response.json();
  
  // 알림 데이터에 timeAgo 추가
  return data.map((notification: Notification) => ({
    ...notification,
    timeAgo: formatDistanceToNow(new Date(notification.created_at), { 
      addSuffix: true, 
      locale: ko 
    })
  }));
};

const markAsReadAPI = async (id: number): Promise<void> => {
  const response = await fetch(`/api/kol-new/notifications/${id}/read`, {
    method: 'PUT',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('알림 읽음 처리에 실패했습니다.');
  }
};

const markAllAsReadAPI = async (): Promise<void> => {
  const response = await fetch('/api/kol-new/notifications/read-all', {
    method: 'PUT',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('전체 알림 읽음 처리에 실패했습니다.');
  }
};

export default function NotificationsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kolInfo, setKolInfo] = useState<{name: string, shopName: string} | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user.publicMetadata?.role as string || "kol";
      setIsKol(userRole === "kol");
    }
  }, [isLoaded, isSignedIn, user]);

  // React Query로 알림 데이터 가져오기
  const { 
    data: notifications = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: isLoaded && isSignedIn && isKol === true,
    staleTime: 5 * 60 * 1000, // 5분
    cacheTime: 10 * 60 * 1000, // 10분
    refetchInterval: 30 * 1000, // 30초마다 자동 갱신
    refetchIntervalInBackground: false, // 백그라운드에서는 자동 갱신 안함
  });

  // 개별 알림 읽음 처리 mutation
  const markAsReadMutation = useMutation({
    mutationFn: markAsReadAPI,
    onSuccess: () => {
      // 성공 시 알림 목록 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast({
        title: "알림 읽음",
        description: "알림이 읽음으로 표시되었습니다.",
      });
    },
    onError: (error) => {
      console.error('알림 읽음 처리 실패:', error);
      toast({
        title: "오류 발생",
        description: "알림 읽음 처리에 실패했습니다.",
      });
    }
  });

  // 전체 알림 읽음 처리 mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsReadAPI,
    onSuccess: () => {
      // 성공 시 알림 목록 다시 가져오기
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast({
        title: "모든 알림 읽음",
        description: "모든 알림이 읽음으로 표시되었습니다.",
      });
    },
    onError: (error) => {
      console.error('전체 알림 읽음 처리 실패:', error);
      toast({
        title: "오류 발생",
        description: "전체 알림 읽음 처리에 실패했습니다.",
      });
    }
  });

  // KOL 정보 가져오기
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol) {
      const fetchKolInfo = async () => {
        try {
          // 대시보드 API를 사용하여 KOL 정보 가져오기
          const response = await fetch('/api/kol-new/dashboard', { 
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' } 
          });
          
          if (!response.ok) {
            throw new Error('KOL 정보를 불러오는데 실패했습니다.');
          }
          
          const data = await response.json();
          
          setKolInfo({
            name: data.kolInfo?.name || user?.firstName || user?.username || '사용자',
            shopName: data.kolInfo?.shop_name || '내 상점'
          });
          
          // 현재 사용자의 DB ID 저장 (Realtime 필터링용)
          setCurrentUserId(data.userId);
        } catch (error) {
          console.error('KOL 정보 조회 중 오류:', error);
          
          // 에러 발생 시 기본 정보 설정
          setKolInfo({
            name: user?.firstName || user?.username || '사용자',
            shopName: '내 상점'
          });
        }
      };
      
      fetchKolInfo();
    }
  }, [isLoaded, isSignedIn, isKol, user]);

  // Supabase Realtime 구독
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isKol || !currentUserId) return;

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Realtime 채널 생성 및 구독
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}` // 현재 사용자의 알림만 필터링
        },
        (payload) => {
          console.log('새 알림 수신:', payload);
          
          // React Query 캐시 무효화 - 알림 목록 다시 가져오기
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          
          // 브라우저 푸시 알림 표시 (권한이 허용된 경우)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(payload.new.title || '새 알림', {
                body: payload.new.content || '새로운 알림을 확인해보세요.',
                icon: '/favicon.ico', // 프로젝트 파비콘 사용
                badge: '/favicon.ico',
                tag: `notification-${payload.new.id}`, // 중복 방지
                requireInteraction: false, // 자동으로 사라짐
                silent: false,
              });
            } catch (error) {
              console.error('브라우저 알림 표시 실패:', error);
            }
          }
          
          // 새 알림 토스트 메시지 (인앱 알림)
          toast({
            title: "새 알림이 도착했습니다",
            description: payload.new.title || "새로운 알림을 확인해보세요.",
            action: (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // 새 알림을 바로 표시
                  const newNotification = {
                    ...payload.new,
                    timeAgo: '방금 전'
                  } as Notification;
                  viewNotificationDetail(newNotification);
                }}
              >
                보기
              </Button>
            ),
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime 구독 상태:', status);
      });

    // 컴포넌트 언마운트시 구독 해제
    return () => {
      console.log('Realtime 구독 해제');
      supabase.removeChannel(channel);
    };
  }, [isLoaded, isSignedIn, isKol, currentUserId, queryClient, viewNotificationDetail]);

  // 개별 알림 읽음 처리
  const markAsRead = (id: number) => {
    markAsReadMutation.mutate(id);
  };

  // 전체 알림 읽음 처리
  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // 데이터 새로고침
  const refreshData = async () => {
    const { isFetching } = await refetch();
    
    if (!isFetching) {
      toast({
        title: "새로고침 완료",
        description: "알림 데이터가 업데이트되었습니다.",
      });
    }
  };

  // 알림 상세보기
  const viewNotificationDetail = useCallback((notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    
    // 읽지 않은 알림인 경우 읽음으로 표시
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
  }, [markAsReadMutation]);

  // 필터링된 알림 목록
  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'read') return notification.read;
      if (filter === 'unread') return !notification.read;
      return true;
    })
    .filter(notification => 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      notification.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // 로그아웃 함수
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!isLoaded || isKol === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">사용자 정보를 확인하는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KOL이 아닌 경우 홈으로 리다이렉트
  if (!isKol) {
    return redirect('/');
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">알림</h1>
        <p className="text-sm text-muted-foreground">중요한 알림과 업데이트를 확인하세요.</p>
      </div>

      {/* 브라우저 푸시 알림 권한 요청 */}
      <NotificationPermission />

      {/* 검색 및 필터 영역 */}
      <div className="mb-6 flex flex-col space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="알림 검색..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-2">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread' | 'read')} className="flex-1">
            <TabsList className="w-full sm:w-auto grid grid-cols-3">
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="unread">안 읽은 알림</TabsTrigger>
              <TabsTrigger value="read">읽은 알림</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button 
              variant="outline"
              onClick={markAllAsRead}
              disabled={!notifications.some(n => !n.read) || markAllAsReadMutation.isLoading}
              className="whitespace-nowrap flex-1 sm:flex-initial"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              모두 읽음
            </Button>
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 목록</CardTitle>
          <CardDescription>
            {filter === 'all' ? '모든 알림' : filter === 'unread' ? '읽지 않은 알림' : '읽은 알림'}
            {` (${filteredNotifications.length}개)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">알림을 불러오는 중입니다...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="mt-4 text-sm text-destructive">{error instanceof Error ? error.message : '알림을 불러오는데 실패했습니다.'}</p>
              <Button 
                className="mt-4"
                variant="outline"
                onClick={() => refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 시도
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-blue-50 p-4 dark:bg-blue-900/20">
                <Bell className="h-10 w-10 text-blue-500 dark:text-blue-400" />
              </div>
              <p className="mt-6 text-center text-base font-medium">
                {filter === 'all' ? '현재 알림이 없습니다.' : 
                 filter === 'unread' ? '읽지 않은 알림이 없습니다.' : 
                 '읽은 알림이 없습니다.'}
              </p>
              <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
                {searchTerm ? '검색 조건에 맞는 알림이 없습니다.' : 
                 '새로운 알림이 도착하면 여기에 표시됩니다.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`flex items-start space-x-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                  onClick={() => viewNotificationDetail(notification)}
                >
                  <div className="flex-shrink-0">
                    {!notification.read ? (
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                    ) : (
                      <div className="h-2 w-2 bg-gray-300 rounded-full mt-2" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium truncate ${
                        !notification.read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <time className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {notification.timeAgo}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {notification.content}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      {!notification.read && (
                        <Badge variant="secondary" className="text-xs">
                          새 알림
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {filteredNotifications.length > 0 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
            </div>
            <div className="text-sm text-muted-foreground">
              전체 {notifications.length}개, 안 읽음 {notifications.filter(n => !n.read).length}개
            </div>
          </CardFooter>
        )}
      </Card>

      {/* 알림 상세 보기 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md bg-white backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">{selectedNotification?.content}</p>
            <Separator />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                <Clock className="mr-1 inline-block h-3 w-3" />
                {selectedNotification && format(new Date(selectedNotification.created_at), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </span>
              <span>
                {selectedNotification?.read ? (
                  <>
                    <Eye className="mr-1 inline-block h-3 w-3" />
                    읽음
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-1 inline-block h-3 w-3" />
                    읽지 않음
                  </>
                )}
              </span>
            </div>
          </div>
          <DialogClose asChild>
            <Button>확인</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
} 