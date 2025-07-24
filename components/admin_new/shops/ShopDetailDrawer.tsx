'use client';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import {
  useAdminShopDetail,
  useShopAllocations,
  useShopDeviceStats,
} from '@/lib/hooks/adminShopDetail-convex';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Fragment, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Calendar, Filter, TrendingUp, Package, DollarSign } from 'lucide-react';

interface Props {
  shopId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShopDetailDrawer({ shopId, open, onOpenChange }: Props) {
  // 새로운 Convex 기반 훅 사용
  const { shop, isLoading: isShopLoading, isError: isShopError } = useAdminShopDetail(shopId);

  // 실시간 연결 상태 추적
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionState, setConnectionState] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('connected');
  const [hasDataChanged, setHasDataChanged] = useState(false);
  const [previousShop, setPreviousShop] = useState<typeof shop>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 온라인 상태 감지 및 연결 상태 관리
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionState('connecting');
      setRetryCount(0);

      // 연결 복구 시 데이터 새로고침을 위한 짧은 지연
      setTimeout(() => {
        setConnectionState('connected');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionState('disconnected');
    };

    // 페이지 가시성 변화 감지 (탭 전환 시)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) {
        setConnectionState('connecting');
        setTimeout(() => setConnectionState('connected'), 500);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOnline]);

  // 데이터 변경 감지 및 플래시 효과
  useEffect(() => {
    if (shop && !isShopLoading) {
      // 이전 데이터와 비교하여 변경 감지
      if (previousShop && JSON.stringify(previousShop) !== JSON.stringify(shop)) {
        setHasDataChanged(true);

        // 플래시 효과 지속 시간 후 제거
        const flashTimer = setTimeout(() => {
          setHasDataChanged(false);
        }, 2000);

        return () => clearTimeout(flashTimer);
      }

      setPreviousShop(shop);
      setLastUpdated(new Date());
      setConnectionState('connected');
      setRetryCount(0);
    }
  }, [shop, isShopLoading, previousShop]);

  // 에러 발생 시 자동 재시도 메커니즘
  useEffect(() => {
    if (isShopError && retryCount < 3 && isOnline) {
      const retryTimer = setTimeout(
        () => {
          setRetryCount(prev => prev + 1);
          setConnectionState('connecting');
        },
        Math.pow(2, retryCount) * 1000
      ); // 지수적 백오프

      return () => clearTimeout(retryTimer);
    }
  }, [isShopError, retryCount, isOnline]);

  // 로딩 상태에 따른 애니메이션 컴포넌트
  const LoadingState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-center justify-center py-10 text-muted-foreground"
    >
      <div className="space-y-2 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        <p className="text-sm">실시간 데이터 로딩 중...</p>
        {!isOnline && (
          <div className="flex items-center justify-center gap-1 text-orange-600">
            <WifiOff className="h-3 w-3" />
            <span className="text-xs">오프라인 모드</span>
          </div>
        )}
      </div>
    </motion.div>
  );

  // 향상된 에러 상태 컴포넌트
  const ErrorState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-10 text-destructive"
    >
      <AlertCircle className="mb-3 h-8 w-8" />
      <h3 className="mb-2 font-medium">데이터 로드 실패</h3>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        실시간 매장 정보를 불러올 수 없습니다.
        <br />
        {!isOnline ? '네트워크 연결을 확인해주세요.' : '잠시 후 다시 시도해주세요.'}
      </p>

      {retryCount > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">재시도 {retryCount}/3 중...</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRetryCount(0);
            setConnectionState('connecting');
          }}
          disabled={connectionState === 'connecting'}
        >
          {connectionState === 'connecting' ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              재시도 중...
            </>
          ) : (
            '다시 시도'
          )}
        </Button>

        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          새로고침
        </Button>
      </div>
    </motion.div>
  );

  // 향상된 실시간 상태 인디케이터 (메모이제이션으로 성능 최적화)
  const RealtimeIndicator = useMemo(() => {
    const getStatusConfig = () => {
      if (!isOnline) {
        return {
          icon: WifiOff,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          text: '오프라인',
          pulse: false,
        };
      }

      switch (connectionState) {
        case 'connecting':
          return {
            icon: Wifi,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            text: '연결 중...',
            pulse: true,
          };
        case 'connected':
          return {
            icon: Wifi,
            color: hasDataChanged ? 'text-blue-600' : 'text-green-600',
            bgColor: hasDataChanged ? 'bg-blue-100' : 'bg-green-100',
            text: hasDataChanged ? '업데이트됨' : '실시간',
            pulse: hasDataChanged,
          };
        case 'disconnected':
          return {
            icon: WifiOff,
            color: 'text-red-600',
            bgColor: 'bg-red-100',
            text: '연결 끊김',
            pulse: false,
          };
        default:
          return {
            icon: Wifi,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
            text: '알 수 없음',
            pulse: false,
          };
      }
    };

    const config = getStatusConfig();

    return (
      <div className="flex items-center gap-2 text-xs">
        <div
          className={`flex items-center gap-1.5 rounded-full px-2 py-1 ${config.bgColor} transition-colors duration-300`}
        >
          <config.icon
            className={`h-3 w-3 ${config.color} ${config.pulse ? 'animate-pulse' : ''}`}
          />
          <span className={`font-medium ${config.color}`}>{config.text}</span>
          {retryCount > 0 && connectionState === 'connecting' && (
            <span className="text-xs text-muted-foreground">({retryCount}/3)</span>
          )}
        </div>

        {lastUpdated && connectionState === 'connected' && (
          <span className="text-muted-foreground">• {format(lastUpdated, 'HH:mm:ss')}</span>
        )}

        {hasDataChanged && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1 text-blue-600"
          >
            <div className="h-2 w-2 animate-ping rounded-full bg-blue-600" />
            <span className="font-medium">새로고침됨</span>
          </motion.div>
        )}
      </div>
    );
  }, [isOnline, connectionState, hasDataChanged, retryCount, lastUpdated]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] overflow-y-auto sm:w-[540px]">
        <AnimatePresence mode="wait">
          {isShopLoading ? (
            <LoadingState key="loading" />
          ) : isShopError || !shop ? (
            <ErrorState key="error" />
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                backgroundColor: hasDataChanged ? '#dbeafe' : 'transparent',
              }}
              transition={{
                duration: 0.3,
                ease: 'easeOut',
                backgroundColor: { duration: hasDataChanged ? 0.5 : 2, ease: 'easeInOut' },
              }}
              className={`space-y-4 rounded-lg p-2 transition-colors ${
                hasDataChanged ? 'ring-2 ring-blue-200 ring-opacity-50' : ''
              }`}
            >
              {/* 실시간 상태 헤더 */}
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-lg font-semibold">매장 상세 정보</h2>
                {RealtimeIndicator}
              </div>

              {/* 상단 카드 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: hasDataChanged ? 1.02 : 1,
                  boxShadow: hasDataChanged
                    ? '0 8px 25px -8px rgba(59, 130, 246, 0.25)'
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
                transition={{
                  delay: 0.1,
                  scale: { duration: 0.3, ease: 'easeInOut' },
                  boxShadow: { duration: 0.3, ease: 'easeInOut' },
                }}
                className={`space-y-2 rounded-md border bg-white p-4 shadow-sm transition-all ${
                  hasDataChanged ? 'border-blue-200 bg-gradient-to-r from-blue-50/50 to-white' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{shop.shop_name}</h3>
                  <Badge variant={shop.status === 'active' ? 'default' : 'secondary'}>
                    {shop.status}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">KOL</dt>
                  <dd className="font-medium">{shop.kol_name ?? '-'}</dd>
                  <dt className="text-muted-foreground">대표자</dt>
                  <dd>{shop.owner_name ?? '-'}</dd>
                  <dt className="text-muted-foreground">지역</dt>
                  <dd>{shop.region ?? '-'}</dd>
                  <dt className="text-muted-foreground">계약일</dt>
                  <dd>
                    {shop.contract_date ? format(new Date(shop.contract_date), 'yyyy-MM-dd') : '-'}
                  </dd>
                  <dt className="text-muted-foreground">총 보급 기기수</dt>
                  <dd className="font-semibold text-blue-600">{shop.device_cnt ?? 0}대</dd>
                  {shop.totalSales && shop.totalSales > 0 && (
                    <>
                      <dt className="text-muted-foreground">총 매출</dt>
                      <dd className="font-semibold text-green-600">
                        {shop.totalSales.toLocaleString()}원
                      </dd>
                    </>
                  )}
                </dl>
                {shop.smart_place_link && (
                  <Button asChild variant="link" size="sm" className="px-0">
                    <a href={shop.smart_place_link} target="_blank" rel="noreferrer">
                      스마트플레이스 링크 열기 ↗
                    </a>
                  </Button>
                )}
              </motion.div>

              {/* 탭 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Tabs defaultValue="allocations">
                  <TabsList>
                    <TabsTrigger value="allocations">기기 내역</TabsTrigger>
                    <TabsTrigger value="stats">통계</TabsTrigger>
                  </TabsList>

                  <TabsContent value="allocations">
                    <AllocationTabContent shopId={shopId} />
                  </TabsContent>

                  <TabsContent value="stats">
                    <StatsTabContent shopId={shopId} />
                  </TabsContent>
                </Tabs>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}

function AllocationTabContent({ shopId }: { shopId: number | null }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useShopAllocations(shopId);

  // 필터링 상태
  const [dateFilter, setDateFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-6 text-muted-foreground"
      >
        <div className="space-y-2 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          <p className="text-sm">기기 내역 로딩 중...</p>
        </div>
      </motion.div>
    );
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-6 text-destructive"
      >
        <AlertCircle className="mb-2 h-5 w-5" />
        <p className="text-center text-sm">
          기기 내역을 불러오지 못했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
      </motion.div>
    );
  }

  const allRows = data?.pages.flatMap((p: any) => p.rows) || [];

  // 필터링 로직
  const filteredRows = useMemo(() => {
    return allRows.filter((row: any) => {
      // 날짜 필터
      if (dateFilter !== 'all') {
        const rowDate = new Date(row.allocated_at);
        const now = new Date();

        switch (dateFilter) {
          case 'week':
            if (now.getTime() - rowDate.getTime() > 7 * 24 * 60 * 60 * 1000) return false;
            break;
          case 'month':
            if (now.getTime() - rowDate.getTime() > 30 * 24 * 60 * 60 * 1000) return false;
            break;
          case '3months':
            if (now.getTime() - rowDate.getTime() > 90 * 24 * 60 * 60 * 1000) return false;
            break;
        }
      }

      // 금액 필터
      if (amountFilter !== 'all') {
        const amount = row.pay_to_kol;
        switch (amountFilter) {
          case 'low':
            if (amount >= 100000) return false;
            break;
          case 'medium':
            if (amount < 100000 || amount >= 500000) return false;
            break;
          case 'high':
            if (amount < 500000) return false;
            break;
        }
      }

      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          row.id.toString().includes(searchLower) ||
          (row.note && row.note.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [allRows, dateFilter, amountFilter, searchTerm]);

  if (allRows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-8 text-center text-sm text-muted-foreground"
      >
        <div className="space-y-2">
          <p>아직 기기 내역이 없습니다.</p>
          <p className="text-xs">기기 보급 후 이곳에 내역이 표시됩니다.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <Fragment>
      {/* 필터 컨트롤 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>필터 및 검색</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">기간</label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 기간</SelectItem>
                <SelectItem value="week">최근 1주일</SelectItem>
                <SelectItem value="month">최근 1개월</SelectItem>
                <SelectItem value="3months">최근 3개월</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">지급액</label>
            <Select value={amountFilter} onValueChange={setAmountFilter}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 금액</SelectItem>
                <SelectItem value="low">10만원 미만</SelectItem>
                <SelectItem value="medium">10-50만원</SelectItem>
                <SelectItem value="high">50만원 이상</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">검색</label>
            <Input
              type="text"
              placeholder="ID 또는 비고 검색..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
        </div>

        {(dateFilter !== 'all' || amountFilter !== 'all' || searchTerm) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {filteredRows.length}개 항목 (전체 {allRows.length}개 중)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter('all');
                setAmountFilter('all');
                setSearchTerm('');
              }}
              className="h-6 px-2 text-xs"
            >
              필터 초기화
            </Button>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-md border bg-white"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>보급일</TableHead>
              <TableHead>고정급</TableHead>
              <TableHead>공제</TableHead>
              <TableHead>지급액</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredRows.map((row: any, index: number) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell>{format(new Date(row.allocated_at), 'yyyy-MM-dd')}</TableCell>
                  <TableCell className="text-right font-medium">
                    {row.tier_fixed_amount.toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {row.user_input_deduct > 0
                      ? `-${row.user_input_deduct.toLocaleString()}원`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {row.pay_to_kol.toLocaleString()}원
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{row.note ?? '-'}</span>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>

      {hasNextPage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-3"
        >
          <Button
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                불러오는 중...
              </>
            ) : (
              '더 보기'
            )}
          </Button>
        </motion.div>
      )}
    </Fragment>
  );
}

function StatsTabContent({ shopId }: { shopId: number | null }) {
  const { data: stats, isLoading, isError } = useShopDeviceStats(shopId);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-6 text-muted-foreground"
      >
        <div className="space-y-2 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          <p className="text-sm">통계 로딩 중...</p>
        </div>
      </motion.div>
    );
  }

  if (isError || !stats) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-6 text-destructive"
      >
        <AlertCircle className="mb-2 h-5 w-5" />
        <p className="text-center text-sm">
          통계 데이터를 불러오지 못했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
      </motion.div>
    );
  }

  // 차트 데이터 준비
  const deviceTierData = [
    { name: 'Tier 1-4', value: stats.tier1_4Count, color: '#8884d8' },
    { name: 'Tier 5+', value: stats.tier5PlusCount, color: '#82ca9d' },
  ];

  const summaryData = [
    { name: '총 기기수', value: stats.totalDevices, icon: Package, color: 'blue' },
    { name: '활성 기기', value: stats.activeDevices, icon: TrendingUp, color: 'green' },
    {
      name: '총 매출',
      value: `${stats.totalSales.toLocaleString()}원`,
      icon: DollarSign,
      color: 'emerald',
    },
    {
      name: '총 수수료',
      value: `${stats.totalCommission.toLocaleString()}원`,
      icon: DollarSign,
      color: 'purple',
    },
  ];

  const performanceData = [
    {
      metric: '기기 활용률',
      value:
        stats.totalDevices > 0 ? Math.round((stats.activeDevices / stats.totalDevices) * 100) : 0,
      unit: '%',
    },
    {
      metric: '평균 기기당 매출',
      value: stats.totalDevices > 0 ? Math.round(stats.totalSales / stats.totalDevices) : 0,
      unit: '원',
    },
    {
      metric: '수수료율',
      value:
        stats.totalSales > 0
          ? Math.round((stats.totalCommission / stats.totalSales) * 100 * 100) / 100
          : 0,
      unit: '%',
    },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 요약 카드들 */}
      <div className="grid grid-cols-2 gap-3">
        {summaryData.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs">{item.name}</CardDescription>
                  <item.icon className={`h-4 w-4 text-${item.color}-600`} />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-lg font-bold text-${item.color}-600`}>{item.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 디바이스 티어 분포 차트 */}
      {(stats.tier1_4Count > 0 || stats.tier5PlusCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">디바이스 티어 분포</CardTitle>
              <CardDescription className="text-xs">티어별 기기 보급 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceTierData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceTierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={value => [`${value}개`, '기기수']}
                      contentStyle={{
                        fontSize: '12px',
                        padding: '6px 8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 범례 */}
              <div className="mt-2 flex justify-center space-x-4">
                {deviceTierData.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-1 text-xs">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">
                      {item.name}: {item.value}개
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 성과 지표 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">성과 지표</CardTitle>
            <CardDescription className="text-xs">주요 운영 지표 현황</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceData.map((metric, index) => (
                <motion.div
                  key={metric.metric}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-muted-foreground">{metric.metric}</span>
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-20 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            metric.unit === '%'
                              ? metric.value
                              : (metric.value / Math.max(...performanceData.map(p => p.value))) *
                                  100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium">
                      {metric.value.toLocaleString()}
                      {metric.unit}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 최근 판매일 */}
      {stats.lastSaleDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">최근 판매일:</span>
                <span className="font-medium">
                  {format(new Date(stats.lastSaleDate), 'yyyy년 MM월 dd일')}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 데이터가 없는 경우 */}
      {stats.totalDevices === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 text-center text-sm text-muted-foreground"
        >
          <div className="space-y-2">
            <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p>아직 보급된 기기가 없습니다.</p>
            <p className="text-xs">기기 보급 후 통계가 표시됩니다.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
