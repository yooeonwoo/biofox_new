'use client';

import { useEffect, useState, useRef } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  CoinsIcon,
  TrendingUp,
  TrendingDown,
  Store,
  Wallet,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';
// Convex imports로 교체
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
// 새로운 시각적 인디케이터 컴포넌트들
import {
  RealtimePulse,
  NewDataHighlight,
  ConnectionStatus,
  NotificationBadge,
  StatusTransition,
} from '@/components/ui/realtime-indicator';
// 성능 모니터링 훅들
import {
  usePerformanceMonitor,
  usePerformanceThresholds,
  usePerformanceRecommendations,
} from '@/hooks/usePerformanceMonitor';
import SalesChart from '../../components/sales-chart';
import StoreRankingTable from '../../components/store-ranking-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DialogTitle } from '@/components/ui/dialog';
import KolMobileMenu from '../components/layout/KolMobileMenu';

// 🚀 실시간 데이터를 사용하는 KOL 대시보드

interface ClientDashboardProps {
  initialData?: any; // 서버에서 전달받은 초기 데이터 (선택적)
}

// 숫자를 만 단위로 포맷팅하는 유틸리티 함수
const formatToManUnit = (value: number): string => {
  if (value === 0) return '0원';

  const man = Math.floor(value / 10000);
  const rest = value % 10000;

  if (man > 0) {
    if (rest > 0) {
      return `${man.toLocaleString()}만 ${rest}원`;
    }
    return `${man.toLocaleString()}만원`;
  } else {
    return `${value.toLocaleString()}원`;
  }
};

// 실시간 연결 상태 표시기 (개선된 ConnectionStatus 사용)
function RealtimeStatus({ lastUpdated }: { lastUpdated?: number }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="mb-2 flex items-center space-x-4 text-xs text-gray-500">
      <ConnectionStatus isConnected={isOnline} showText={true} />
      {lastUpdated && <span>마지막 업데이트: {new Date(lastUpdated).toLocaleTimeString()}</span>}
    </div>
  );
}

export default function ClientDashboard({ initialData }: ClientDashboardProps) {
  const [isKol, setIsKol] = useState<boolean | null>(true); // 임시로 KOL로 설정
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🚀 Convex 실시간 쿼리로 교체 - KOL 대시보드 데이터
  const dashboardStats = useQuery(api.realtime.getKolDashboardStats);
  const recentOrders = useQuery(api.realtime.getRecentOrderUpdates, { limit: 5 });
  const unreadNotifications = useQuery(api.realtime.getUnreadNotificationCount);

  // 🚀 성능 모니터링
  const dashboardMetrics = usePerformanceMonitor('getKolDashboardStats', dashboardStats, {
    enabled: true,
    trackMemory: true,
  });
  const ordersMetrics = usePerformanceMonitor('getRecentOrderUpdates', recentOrders);
  const notificationsMetrics = usePerformanceMonitor(
    'getUnreadNotificationCount',
    unreadNotifications
  );

  // 성능 경고 및 권장사항
  const dashboardWarnings = usePerformanceThresholds(dashboardMetrics);
  const ordersWarnings = usePerformanceThresholds(ordersMetrics);
  const notificationsWarnings = usePerformanceThresholds(notificationsMetrics);
  const allWarnings = [...dashboardWarnings, ...ordersWarnings, ...notificationsWarnings];
  const kolPerformanceRecommendations = usePerformanceRecommendations(allWarnings);

  // 실시간 업데이트 상태 감지
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastData, setLastData] = useState<any>(null);
  const prevStatsRef = useRef<any>(null);

  // 대시보드 데이터 업데이트 감지
  useEffect(() => {
    if (dashboardStats && prevStatsRef.current) {
      if (JSON.stringify(dashboardStats) !== JSON.stringify(prevStatsRef.current)) {
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000); // 2초간 펄스 효과
      }
    }
    prevStatsRef.current = dashboardStats;
  }, [dashboardStats]);

  // 새로운 주문 감지
  useEffect(() => {
    if (recentOrders && lastData?.orders) {
      const newOrders = recentOrders.filter(
        order => !lastData.orders.find((prev: any) => prev._id === order._id)
      );
      if (newOrders.length > 0) {
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000);
      }
    }
    setLastData(prev => ({ ...prev, orders: recentOrders }));
  }, [recentOrders]);

  // TODO: Supabase 인증 로직 구현
  useEffect(() => {
    setIsKol(true); // 임시로 KOL로 설정
  }, []);

  // TODO: Supabase 로그아웃 함수 구현
  const handleSignOut = async () => {
    try {
      // TODO: Supabase 로그아웃 로직 구현
      console.log('로그아웃 시도');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (isKol === null) {
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

  // 🚀 실시간 데이터 상태 처리
  const loading = dashboardStats === undefined;

  // 데이터 로딩 중인 경우
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">데이터 로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              실시간 대시보드 정보를 불러오는 중입니다.
            </p>
            <div className="mt-4 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
          {dashboardStats?.kol?.shopName || '...'} - {dashboardStats?.kol?.name || '...'} KOL
        </h1>
        <RealtimeStatus lastUpdated={dashboardStats?.lastUpdated} />
      </div>

      {/* 상단 메트릭 카드 영역 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 카드 1: 매출 & 수당 (실시간 펄스 효과 추가) */}
        <RealtimePulse isUpdating={isUpdating} pulseColor="green">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex w-full flex-col overflow-hidden md:flex-row md:items-baseline md:gap-2">
                  <span className="whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                    당월 매출:
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                    {dashboardStats?.sales?.currentMonth !== undefined
                      ? formatToManUnit(dashboardStats.sales.currentMonth)
                      : '0원'}
                  </span>
                </div>
                <div className="flex-shrink-0 rounded-full bg-yellow-100 p-1 text-yellow-700 sm:p-1.5">
                  <CoinsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>

              <div className="mt-1 flex items-center text-[10px] sm:text-xs">
                <span
                  className={`flex items-center ${
                    (dashboardStats?.sales?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(dashboardStats?.sales?.growth || 0) >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(dashboardStats?.sales?.growth || 0).toFixed(1)}% vs 지난 달
                </span>
              </div>

              <div className="my-3 h-[1px] bg-gray-200 sm:my-4" />

              <div className="flex items-center justify-between">
                <div className="flex w-full flex-col overflow-hidden md:flex-row md:items-baseline md:gap-2">
                  <span className="whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                    당월 수당:
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold sm:text-lg md:text-xl">
                    {dashboardStats?.commission?.currentMonth !== undefined
                      ? formatToManUnit(dashboardStats.commission.currentMonth)
                      : '0원'}
                  </span>
                </div>
                <div className="flex-shrink-0 rounded-full bg-green-100 p-1 text-green-700 sm:p-1.5">
                  <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                상태: {dashboardStats?.commission?.status === 'paid' ? '지급완료' : '계산완료'}
              </div>
            </CardContent>
          </Card>
        </RealtimePulse>

        {/* 카드 2: 전문점 현황 (실시간 펄스 효과 추가) */}
        <RealtimePulse isUpdating={isUpdating} pulseColor="blue">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold sm:text-lg md:text-xl">전문점 현황:</span>
                  <span className="text-sm font-bold sm:text-lg md:text-xl">
                    {dashboardStats?.shops?.total || 0}곳
                  </span>
                </div>
                <div className="rounded-full bg-blue-100 p-1 text-blue-700 sm:p-1.5">
                  <Store className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-1 text-[10px] text-blue-600 sm:text-xs">🚀 실시간 업데이트됨</div>

              <div className="my-3 h-[1px] bg-gray-200 sm:my-4" />

              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold sm:text-lg md:text-xl">당월 주문 전문점:</span>
                  <span className="text-sm font-bold sm:text-lg md:text-xl">
                    {dashboardStats?.shops?.ordering || 0}곳
                  </span>
                </div>
                <div className="rounded-full bg-green-100 p-1 text-green-700 sm:p-1.5">
                  <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="mt-1 text-[10px] text-red-500 sm:text-xs">
                {dashboardStats?.shops?.notOrdering || 0}곳이 아직 주문하지 않았습니다.
              </div>
            </CardContent>
          </Card>
        </RealtimePulse>
      </div>

      {/* 🚀 실시간 최근 주문 현황 */}
      {recentOrders && recentOrders.length > 0 && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                최근 주문 현황
                <span className="text-sm font-normal text-gray-500">(실시간)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOrders.slice(0, 3).map((order: any, index: number) => (
                  <div
                    key={`${order._id}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        주문 #{order.order_number || order._id.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()} • ₩
                        {order.total_amount?.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`rounded px-2 py-1 text-xs ${
                        order.order_status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.order_status === 'completed' ? '완료' : '처리중'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 🚀 실시간 알림 상태 */}
      {unreadNotifications && unreadNotifications.count > 0 && (
        <div className="mb-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-900">읽지 않은 알림</span>
                  <NotificationBadge
                    count={unreadNotifications.count}
                    animate={true}
                    className="ml-1"
                  />
                </div>
                <Link href="/kol-new/notifications">
                  <Button variant="outline" size="sm" className="border-orange-300 text-orange-700">
                    확인하기
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 전문점 매출 순위 영역 */}
      <div className="mb-6 space-y-4">
        <h2 className="text-lg font-bold">전문점 매출 순위</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 매출 차트 */}
          <div className="order-2 lg:order-1">
            <SalesChart />
          </div>

          {/* 전문점 순위 테이블 */}
          <div className="order-1 lg:order-2">
            <StoreRankingTable
              shops={[
                {
                  name: dashboardStats?.kol?.shopName || '내 매장',
                  sales: dashboardStats?.sales?.currentMonth || 0,
                  isOwn: true,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* 하단 네비게이션 카드들 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/kol-new/sales-journal" className="block">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-4 text-center">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <h3 className="font-medium">영업 일지</h3>
              <p className="mt-1 text-sm text-gray-600">활동 기록 관리</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/kol-new/stores" className="block">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-4 text-center">
              <Store className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <h3 className="font-medium">전문점 관리</h3>
              <p className="mt-1 text-sm text-gray-600">매장 현황 확인</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/kol-new/customer-manager" className="block">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="p-4 text-center">
              <CoinsIcon className="mx-auto mb-2 h-8 w-8 text-purple-600" />
              <h3 className="font-medium">고객 관리</h3>
              <p className="mt-1 text-sm text-gray-600">고객 정보 관리</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/kol-new/notifications" className="block">
          <Card className="cursor-pointer transition-all hover:shadow-md">
            <CardContent className="relative p-4 text-center">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-orange-600" />
              <h3 className="font-medium">알림</h3>
              <p className="mt-1 text-sm text-gray-600">시스템 알림</p>
              {unreadNotifications && unreadNotifications.count > 0 && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {unreadNotifications.count > 9 ? '9+' : unreadNotifications.count}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 모바일 메뉴 */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
          <KolMobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
