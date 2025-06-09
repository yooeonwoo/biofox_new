'use client';

import { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
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

export default function NotificationsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kolInfo, setKolInfo] = useState<{name: string, shopName: string} | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user.publicMetadata?.role as string || "kol";
      setIsKol(userRole === "kol");
    }
  }, [isLoaded, isSignedIn, user]);

  // KOL 정보 및 알림 데이터 가져오기
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol) {
      const fetchKolInfo = async () => {
        try {
          setLoading(true);
          
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
        } catch (error) {
          console.error('KOL 정보 조회 중 오류:', error);
          setError('KOL 정보를 불러오는데 실패했습니다.');
          
          // 에러 발생 시 기본 정보 설정
          setKolInfo({
            name: user?.firstName || user?.username || '사용자',
            shopName: '내 상점'
          });
        } finally {
          setLoading(false);
        }
      };
      
      const fetchNotifications = async () => {
        try {
          const response = await fetch('/api/kol-new/notifications', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (!response.ok) {
            throw new Error('알림을 불러오는데 실패했습니다.');
          }
          
          const notificationData = await response.json();
          
          // 알림 데이터에 timeAgo 추가
          const processedNotifications = notificationData.map((notification: Notification) => ({
            ...notification,
            timeAgo: formatDistanceToNow(new Date(notification.created_at), { 
              addSuffix: true, 
              locale: ko 
            })
          }));
          
          setNotifications(processedNotifications);
          setError(null);
        } catch (error) {
          console.error('알림 데이터 조회 중 오류:', error);
          setError('알림을 불러오는데 실패했습니다.');
        }
      };
      
      fetchKolInfo();
      fetchNotifications();
    }
  }, [isLoaded, isSignedIn, isKol, user]);

  // 개별 알림 읽음 처리
  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/kol-new/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('알림 읽음 처리에 실패했습니다.');
      }
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      toast({
        title: "알림 읽음",
        description: "알림이 읽음으로 표시되었습니다.",
      });
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
      toast({
        title: "오류 발생",
        description: "알림 읽음 처리에 실패했습니다.",
      });
    }
  };

  // 전체 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/kol-new/notifications/read-all', {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('전체 알림 읽음 처리에 실패했습니다.');
      }
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      toast({
        title: "모든 알림 읽음",
        description: "모든 알림이 읽음으로 표시되었습니다.",
      });
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패:', error);
      toast({
        title: "오류 발생",
        description: "전체 알림 읽음 처리에 실패했습니다.",
      });
    }
  };

  // 데이터 새로고침
  const refreshData = async () => {
    setRefreshing(true);
    
    try {
      const response = await fetch('/api/kol-new/notifications', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('알림을 새로고침하는데 실패했습니다.');
      }
      
      const notificationData = await response.json();
      
      // 알림 데이터에 timeAgo 추가
      const processedNotifications = notificationData.map((notification: Notification) => ({
        ...notification,
        timeAgo: formatDistanceToNow(new Date(notification.created_at), { 
          addSuffix: true, 
          locale: ko 
        })
      }));
      
      setNotifications(processedNotifications);
      setError(null);
      
      toast({
        title: "새로고침 완료",
        description: "알림 데이터가 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('데이터 새로고침 실패:', error);
      setError('알림 데이터를 새로고침하는데 실패했습니다.');
      
      toast({
        title: "오류 발생",
        description: "데이터를 새로고침하는데 실패했습니다.",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // 알림 상세보기
  const viewNotificationDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
    
    // 읽지 않은 알림인 경우 읽음으로 표시
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

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
    <div className="flex h-screen flex-col">
      {/* Header */}
      <KolHeader 
        userName={kolInfo?.name || '사용자'}
        shopName={kolInfo?.shopName || '내 상점'}
        userImage={user?.imageUrl}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop Only */}
        <KolSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">알림</h1>
              <p className="text-sm text-muted-foreground">중요한 알림과 업데이트를 확인하세요.</p>
            </div>

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
                    disabled={refreshing || loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={markAllAsRead}
                    disabled={!notifications.some(n => !n.read)}
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
                    <p className="mt-4 text-sm text-destructive">{error}</p>
                    <Button 
                      className="mt-4"
                      variant="outline"
                      onClick={refreshData}
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

            {/* Footer */}
            <KolFooter />
          </div>
        </main>
      </div>

      {/* Mobile Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger className="block sm:hidden">
          <div className="flex items-center justify-center p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-white">
          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
          <KolMobileMenu 
            userName={kolInfo?.name || '사용자'} 
            shopName={kolInfo?.shopName || '내 상점'} 
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
} 