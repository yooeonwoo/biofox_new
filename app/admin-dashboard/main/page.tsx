'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Store,
  PieChart,
  Bell,
  TrendingUp,
  Activity,
  Clock,
  Calendar,
} from 'lucide-react';
// Convex imports로 교체
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
// 새로운 시각적 인디케이터 컴포넌트들
import {
  RealtimePulse,
  NewDataHighlight,
  ConnectionStatus,
  ActivityIcon,
  StatusTransition,
} from '@/components/ui/realtime-indicator';
// 성능 모니터링 훅들
import {
  usePerformanceMonitor,
  usePerformanceThresholds,
  usePerformanceRecommendations,
} from '@/hooks/usePerformanceMonitor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// 대시보드 카드 컴포넌트
function DashboardCard({
  title,
  description,
  icon,
  linkText,
  linkHref,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkText: string;
  linkHref: string;
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow transition-all hover:shadow-md">
      <div className="mb-4 flex items-center">
        <div className="mr-4 rounded-full bg-blue-100 p-3 text-blue-600">{icon}</div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="mb-4 text-gray-600">{description}</p>
      <Link
        href={linkHref}
        className="flex items-center font-medium text-blue-600 hover:text-blue-800"
      >
        {linkText}
        <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </Link>
    </div>
  );
}

// 통계 카드 컴포넌트 (실시간 업데이트 펄스 효과 추가)
function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  isUpdating = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  icon?: React.ReactNode;
  isUpdating?: boolean;
}) {
  return (
    <RealtimePulse isUpdating={isUpdating} pulseColor="blue">
      <div className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-500">{title}</h3>
            <p className="mb-1 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
          {icon && (
            <div className="rounded-full bg-blue-50 p-2">
              <div className="text-blue-600">{icon}</div>
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            <div
              className={`flex items-center text-sm ${
                trend.direction === 'up'
                  ? 'text-green-600'
                  : trend.direction === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              <TrendingUp
                size={16}
                className={`mr-1 ${trend.direction === 'down' ? 'rotate-180' : ''}`}
              />
              {Math.abs(trend.value)}%
            </div>
            <span className="ml-2 text-sm text-gray-500">vs 지난 달</span>
          </div>
        )}
      </div>
    </RealtimePulse>
  );
}

// 최근 활동 아이템 컴포넌트 (시각적 인디케이터 추가)
function ActivityItem({ activity, isNew = false }: { activity: any; isNew?: boolean }) {
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <NewDataHighlight isNew={isNew}>
      <div className="flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
        <div className="mt-1 flex-shrink-0">
          <ActivityIcon type={activity.type} isNew={isNew} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="truncate text-sm font-medium text-gray-900">{activity.title}</p>
            <span className="ml-2 flex-shrink-0 text-xs text-gray-500">
              {formatTimeAgo(activity.timestamp)}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{activity.description}</p>
        </div>
      </div>
    </NewDataHighlight>
  );
}

// 실시간 상태 표시기 컴포넌트 (개선된 ConnectionStatus 사용)
function RealtimeIndicator({ lastUpdated }: { lastUpdated?: number }) {
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
    <div className="flex items-center space-x-4 text-xs text-gray-500">
      <ConnectionStatus isConnected={isOnline} showText={true} />
      {lastUpdated && <span>마지막 업데이트: {new Date(lastUpdated).toLocaleTimeString()}</span>}
    </div>
  );
}

// KOL 목록 가져오기 (fallback용 - 기존 API 사용)
const fetchKolUsers = async () => {
  const response = await fetch('/api/admin/users/kols', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('KOL 목록을 불러오는데 실패했습니다.');
  }

  return response.json();
};

// 메인 페이지 컴포넌트
export default function AdminDashboardMainPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // 알림 보내기 다이얼로그 상태
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'individual'>('all');
  const [selectedKols, setSelectedKols] = useState<number[]>([]);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationContent, setNotificationContent] = useState('');

  // 🚀 Convex 실시간 쿼리로 교체
  const dashboardStats = useQuery(api.realtime.getDashboardStats);
  const recentActivities = useQuery(api.realtime.getRecentActivities, { limit: 10 });

  // 🚀 성능 모니터링
  const statsMetrics = usePerformanceMonitor('getDashboardStats', dashboardStats, {
    enabled: true,
    trackMemory: true,
    logInterval: 10000, // 10초마다 로그
  });
  const activitiesMetrics = usePerformanceMonitor('getRecentActivities', recentActivities, {
    enabled: true,
    trackMemory: false,
  });

  // 성능 경고 및 권장사항
  const statsWarnings = usePerformanceThresholds(statsMetrics);
  const activitiesWarnings = usePerformanceThresholds(activitiesMetrics);
  const performanceRecommendations = usePerformanceRecommendations([
    ...statsWarnings,
    ...activitiesWarnings,
  ]);

  // 실시간 업데이트 상태 감지
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastActivities, setLastActivities] = useState<any[]>([]);
  const prevStatsRef = useRef<any>(null);

  // 대시보드 통계 업데이트 감지
  useEffect(() => {
    if (dashboardStats && prevStatsRef.current) {
      if (JSON.stringify(dashboardStats) !== JSON.stringify(prevStatsRef.current)) {
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000); // 2초간 펄스 효과
      }
    }
    prevStatsRef.current = dashboardStats;
  }, [dashboardStats]);

  // 새로운 활동 감지
  useEffect(() => {
    if (recentActivities && lastActivities.length > 0) {
      const newActivities = recentActivities.filter(
        activity => !lastActivities.find(prev => prev.id === activity.id)
      );
      if (newActivities.length > 0) {
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000);
      }
    }
    setLastActivities(recentActivities || []);
  }, [recentActivities]);

  // KOL 목록 (알림 발송용 - 기존 API 사용)
  const [kolUsers, setKolUsers] = useState<any[]>([]);
  const [isLoadingKols, setIsLoadingKols] = useState(false);

  // KOL 목록 로드 (알림 다이얼로그 열릴 때만)
  useEffect(() => {
    if (isNotificationOpen && targetType === 'individual') {
      setIsLoadingKols(true);
      fetchKolUsers()
        .then(setKolUsers)
        .catch(console.error)
        .finally(() => setIsLoadingKols(false));
    }
  }, [isNotificationOpen, targetType]);

  // 사용자 인증 확인
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsSignedIn(true);
        } else {
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setIsSignedIn(false);
      } finally {
        setIsLoaded(true);
      }
    }
    checkAuth();
  }, []);

  // 알림 보내기 핸들러
  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationContent.trim()) {
      toast({
        title: '오류',
        description: '제목과 내용을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const requestData = {
        title: notificationTitle,
        content: notificationContent,
        targetType,
        ...(targetType === 'individual' && { targetIds: selectedKols }),
      };

      const response = await fetch('/api/admin/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '알림 전송에 실패했습니다.');
      }

      toast({
        title: '성공',
        description: '알림이 성공적으로 전송되었습니다.',
      });

      // 다이얼로그 초기화
      setIsNotificationOpen(false);
      setNotificationTitle('');
      setNotificationContent('');
      setSelectedKols([]);
      setTargetType('all');
    } catch (error) {
      console.error('알림 전송 오류:', error);
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '알림 전송 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 로딩 상태
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-gray-900">로그인이 필요합니다</h1>
            <p className="mb-6 text-gray-600">관리자 대시보드에 접근하려면 로그인해주세요.</p>
            <Link
              href="/signin"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🚀 실시간 데이터 상태 처리
  const statsLoading = dashboardStats === undefined;
  const activitiesLoading = recentActivities === undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <RealtimeIndicator lastUpdated={dashboardStats?.lastUpdated} />
        </div>
        <Button onClick={() => setIsNotificationOpen(true)} className="gap-2">
          <Bell className="h-4 w-4" />
          알림 보내기
        </Button>
      </div>

      {/* 🚀 성능 경고 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' &&
        (statsWarnings.length > 0 || activitiesWarnings.length > 0) && (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-medium text-yellow-800">
              <Clock size={16} />
              성능 경고
            </div>
            <div className="space-y-1">
              {[...statsWarnings, ...activitiesWarnings].map((warning, index) => (
                <div key={index} className="text-sm text-yellow-700">
                  {warning}
                </div>
              ))}
              {performanceRecommendations.length > 0 && (
                <div className="mt-3 border-t border-yellow-200 pt-3">
                  <div className="mb-2 text-sm font-medium text-yellow-800">개선 권장사항:</div>
                  {performanceRecommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-yellow-700">
                      • {rec}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      {/* 🚀 실시간 통계 요약 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {statsLoading ? (
          Array(4)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="animate-pulse rounded-lg bg-white p-6 shadow">
                <div className="mb-4 h-2 w-1/3 rounded bg-gray-200"></div>
                <div className="mb-2 h-6 w-1/2 rounded bg-gray-200"></div>
              </div>
            ))
        ) : (
          <>
            <StatCard
              title="전체 KOL/OL 수"
              value={dashboardStats?.kolsCount || 0}
              icon={<Users size={20} />}
              trend={{
                value: dashboardStats?.orderGrowthRate || 0,
                direction: (dashboardStats?.orderGrowthRate || 0) >= 0 ? 'up' : 'down',
              }}
              subtitle="활성 사용자"
              isUpdating={isUpdating}
            />
            <StatCard
              title="활성 매장 수"
              value={dashboardStats?.activeShops || 0}
              icon={<Store size={20} />}
              subtitle="활성 관계 매장"
              isUpdating={isUpdating}
            />
            <StatCard
              title="이번 달 주문 수"
              value={dashboardStats?.monthlyOrders || 0}
              icon={<BarChart3 size={20} />}
              trend={{
                value: dashboardStats?.orderGrowthRate || 0,
                direction: (dashboardStats?.orderGrowthRate || 0) >= 0 ? 'up' : 'down',
              }}
              subtitle="지난 30일 기준"
              isUpdating={isUpdating}
            />
            <StatCard
              title="이번 달 매출액"
              value={
                dashboardStats?.monthlyRevenue
                  ? `₩${(dashboardStats.monthlyRevenue / 1000000).toFixed(1)}M`
                  : '₩0'
              }
              icon={<TrendingUp size={20} />}
              subtitle="월간 총 매출"
              isUpdating={isUpdating}
            />
          </>
        )}
      </div>

      {/* 차트와 최근 활동 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 매출 차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              최근 7일 매출 추이
            </CardTitle>
            <CardDescription>일별 매출 변화</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-80 animate-pulse rounded bg-gray-100"></div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dashboardStats?.salesChart || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`₩${value?.toLocaleString()}`, '매출']} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 🚀 실시간 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} />
              최근 활동
            </CardTitle>
            <CardDescription>실시간 시스템 활동</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              <div className="p-4">
                {activitiesLoading ? (
                  <div className="space-y-3">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <div className="mt-1 h-4 w-4 animate-pulse rounded-full bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-2 animate-pulse rounded bg-gray-200" />
                            <div className="h-2 w-3/4 animate-pulse rounded bg-gray-200" />
                          </div>
                        </div>
                      ))}
                  </div>
                ) : recentActivities && recentActivities.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">최근 활동이 없습니다.</p>
                ) : (
                  recentActivities?.map((activity: any, index: number) => {
                    // 최근 5분 이내의 활동을 "새로운" 것으로 표시
                    const isNew = Date.now() - activity.timestamp < 5 * 60 * 1000;
                    return (
                      <ActivityItem
                        key={`${activity.id}-${index}`}
                        activity={activity}
                        isNew={isNew}
                      />
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 관리 섹션 카드 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="사용자 관리"
          description="KOL 및 OL 승인, 관리, 권한 설정"
          icon={<Users size={24} />}
          linkText="사용자 관리로 이동"
          linkHref="/admin-dashboard/user-management"
        />

        <DashboardCard
          title="KOL 대시보드"
          description="개별 KOL 성과 모니터링"
          icon={<BarChart3 size={24} />}
          linkText="KOL 대시보드"
          linkHref="/admin-dashboard/kol-dashboard"
        />

        <DashboardCard
          title="수동 실적 입력"
          description="매출 및 커미션 수동 입력"
          icon={<PieChart size={24} />}
          linkText="실적 입력"
          linkHref="/admin-dashboard/manual-metrics"
        />

        <DashboardCard
          title="KOL 데이터 입력"
          description="KOL 관련 데이터 관리"
          icon={<Store size={24} />}
          linkText="데이터 입력"
          linkHref="/admin-dashboard/kol-data-entry"
        />

        <DashboardCard
          title="KOL 실적 관리"
          description="KOL 실적 및 성과 관리"
          icon={<Activity size={24} />}
          linkText="실적 관리"
          linkHref="/admin-dashboard/kol-metrics-management"
        />

        <DashboardCard
          title="엔티티 관리"
          description="시스템 엔티티 및 설정 관리"
          icon={<Calendar size={24} />}
          linkText="엔티티 관리"
          linkHref="/admin-dashboard/entities"
        />
      </div>

      {/* 알림 보내기 다이얼로그 */}
      <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>알림 보내기</DialogTitle>
            <DialogDescription>KOL들에게 알림을 전송할 수 있습니다.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target-type">대상 선택</Label>
              <Select
                value={targetType}
                onValueChange={(value: 'all' | 'individual') => setTargetType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 KOL</SelectItem>
                  <SelectItem value="individual">개별 선택</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === 'individual' && (
              <div className="space-y-2">
                <Label>KOL 선택</Label>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  {isLoadingKols ? (
                    <div className="py-4 text-center">로딩 중...</div>
                  ) : (
                    <div className="space-y-2">
                      {kolUsers.map(kol => (
                        <div key={kol.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`kol-${kol.id}`}
                            checked={selectedKols.includes(kol.id)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedKols([...selectedKols, kol.id]);
                              } else {
                                setSelectedKols(selectedKols.filter(id => id !== kol.id));
                              }
                            }}
                          />
                          <Label htmlFor={`kol-${kol.id}`} className="text-sm">
                            {kol.name} ({kol.shop_name})
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notification-title">제목</Label>
              <Input
                id="notification-title"
                value={notificationTitle}
                onChange={e => setNotificationTitle(e.target.value)}
                placeholder="알림 제목을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-content">내용</Label>
              <Textarea
                id="notification-content"
                value={notificationContent}
                onChange={e => setNotificationContent(e.target.value)}
                placeholder="알림 내용을 입력하세요"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSendNotification}>알림 보내기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
