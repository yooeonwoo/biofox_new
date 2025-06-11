'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { 
  Search, 
  Store,
  FilterIcon,
  ChevronDown,
  Trash2,
  Plus,
  Download,
  TrendingUp,
  Minus,
  CrownIcon
} from "lucide-react";

// 레이아웃 컴포넌트
import KolHeader from "../../components/layout/KolHeader";
import KolSidebar from "../../components/layout/KolSidebar";
import KolFooter from "../../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle, Dialog, DialogContent, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import KolMobileMenu from "../../components/layout/KolMobileMenu";

// UI 컴포넌트
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 타입 정의
interface ShopData {
  id: number;
  ownerName: string;
  shop_name: string;
  region: string;
  status: string;
  createdAt: string;
  is_owner_kol?: boolean;
  is_self_shop?: boolean;
  relationship_type?: 'owner' | 'manager';
  owner_kol_id?: number | null;
  sales: {
    total: number;
    product: number;
    device: number;
    hasOrdered: boolean;
    avg_monthly?: number;
    accumulated?: number;
    commission?: number;
  };
}


// 숫자를 만 단위로 포맷팅하는 유틸리티 함수
const formatToManUnit = (value: number): string => {
  if (value === 0) return "0원";
  
  // 만 단위 계산
  const man = Math.floor(value / 10000);
  const rest = value % 10000;
  
  if (man > 0) {
    // 만 단위가 있는 경우
    if (rest > 0) {
      // 나머지가 있는 경우 (예: 510만 4740원)
      return `${man.toLocaleString()}만 ${rest}원`;
    }
    // 나머지가 없는 경우 (예: 500만원)
    return `${man.toLocaleString()}만원`;
  } else {
    // 만 단위가 없는 경우 (예: 9800원)
    return `${value.toLocaleString()}원`;
  }
};

export default function StoresPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [shopsData, setShopsData] = useState<ShopData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kolInfo, setKolInfo] = useState<{ name: string; shopName: string } | null>(null);
  // 전문점 통계 정보를 저장할 상태 추가
  const [shopStats, setShopStats] = useState<{ totalShopsCount: number; activeShopsCount: number }>({
    totalShopsCount: 0,
    activeShopsCount: 0
  });

  // 선택된 상점의 상세 정보를 저장할 상태 추가
  const [selectedShop, setSelectedShop] = useState<ShopData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingShopDetail, setIsLoadingShopDetail] = useState(false);

  // 필터링된 전문점 데이터 (API 응답 포맷에 맞춰 수정)
  const showAllShops = true; // true로 변경하여 모든 전문점 표시
  
  // 필터링 로직 개선
  // 모든 샵을 표시하도록 변경 (API에서 이미 필터링 제거)
  console.log(`필터링 전 전문점 수: ${shopsData.length}`);
  const filteredShops = shopsData; // 모든 샵 표시
  console.log(`필터링 후 전문점 수: ${filteredShops.length}`);


  // 당월 매출 기준 바 차트 데이터 (제한 없이 전체 데이터)
  const currentMonthBarData = filteredShops
    .sort((a, b) => b.sales.total - a.sales.total)
    .map(shop => ({
      name: shop.shop_name,
      매출: shop.sales.total
    }));

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user.publicMetadata?.role as string || "kol";
      setIsKol(userRole === "kol");
    }
  }, [isLoaded, isSignedIn, user]);

  // 데이터 로드
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // 대시보드 및 전문점 데이터를 병렬로 로드
          const [dashboardResult, shopsResult] = await Promise.all([
            fetch('/api/kol-new/dashboard').then(async (r) => {
              if (!r.ok) throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
              return r.json();
            }),
            fetch('/api/kol-new/shops').then(async (r) => {
              if (!r.ok) throw new Error('전문점 데이터를 불러오는데 실패했습니다.');
              return r.json();
            })
          ]);

          setKolInfo({
            name: dashboardResult.kol.name,
            shopName: dashboardResult.kol.shopName
          });

          // 전문점 데이터 로드
          // API 응답 구조 확인 및 로그
          console.log('API 응답 구조:', {
            hasShops: Boolean(shopsResult.shops),
            shopsCount: shopsResult.shops?.length || 0,
            hasMeta: Boolean(shopsResult.meta),
            meta: shopsResult.meta
          });
          
          // 변경된 API 구조 처리 (shops와 meta 객체)
          if (shopsResult.shops && Array.isArray(shopsResult.shops)) {
            const formattedShops = shopsResult.shops.map((shop: any) => ({
              ...shop,
              shop_name: shop.shop_name || shop.ownerName,
              sales: {
                ...shop.sales,
                total: shop.sales.total,
                product: shop.sales.product,
                device: shop.sales.device,
                commission: shop.sales.commission
              }
            }));
            
            setShopsData(formattedShops);
            
            // 메타 데이터가 있으면 사용 (새 API 구조)
            if (shopsResult.meta) {
              console.log('메타 데이터 상세:', {
                totalShopsCount: shopsResult.meta.totalShopsCount,
                activeShopsCount: shopsResult.meta.activeShopsCount,
                activeShopsFormatted: typeof shopsResult.meta.activeShopsCount
              });
              
              // 활성 전문점 상태 체크
              const activeShopsFromAPI = formattedShops.filter((shop: ShopData) => 
                shop.status === 'active' // 수정: 매출 여부는 고려하지 않음
              );
              console.log('활성 전문점 직접 계산:', activeShopsFromAPI.length);
              console.log('활성 전문점 목록:', activeShopsFromAPI.map((shop: ShopData) => ({
                name: shop.shop_name,
                hasOrdered: shop.sales.hasOrdered,
                total: shop.sales.total,
                status: shop.status
              })));
              
              setShopStats({
                totalShopsCount: shopsResult.meta.totalShopsCount || 0,
                activeShopsCount: shopsResult.meta.activeShopsCount || 0
              });
              
              // 상태 업데이트 후 확인
              setTimeout(() => {
                console.log('설정된 상태 값:', shopStats);
              }, 0);
            } else {
              // 메타 데이터가 없으면 직접 계산 (구 API 구조 호환성 유지)
              console.log('메타 데이터 없음, 직접 계산');
              setShopStats({
                totalShopsCount: formattedShops.length,
                activeShopsCount: formattedShops.filter((shop: ShopData) => 
                  shop.sales.hasOrdered
                ).length
              });
            }
          } else if (Array.isArray(shopsResult)) {
            // 이전 API 구조도 지원 (호환성 유지)
            console.log('이전 API 구조 사용');
            const formattedShops = shopsResult.map((shop: any) => ({
              ...shop,
              shop_name: shop.shop_name || shop.ownerName,
              sales: {
                ...shop.sales,
                total: shop.sales.total,
                product: shop.sales.product,
                device: shop.sales.device,
                commission: shop.sales.commission
              }
            }));
            
            setShopsData(formattedShops);
            
            // 이전 API 구조에서는 직접 계산
            setShopStats({
              totalShopsCount: formattedShops.length,
              activeShopsCount: formattedShops.filter((shop: ShopData) => 
                shop.sales.hasOrdered
              ).length
            });
          } else {
            console.log('API 응답에 샵 데이터 없음');
            setShopsData([]);
            setShopStats({
              totalShopsCount: 0,
              activeShopsCount: 0
            });
          }


          setLoading(false);
        } catch (err: unknown) {
          console.error('데이터 로드 에러:', err);
          setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isLoaded, isSignedIn, isKol]);

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

  // 데이터 로딩 중인 경우
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">데이터 로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">전문점 정보를 불러오는 중입니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러가 발생한 경우
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">에러 발생</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  // 테이블 행 배경색 결정 함수
  const getRowColorClass = (rank: number, sales: number, index: number) => {
    // 매출이 0원 초과인 행
    if (sales > 0) {
      // 짝수는 보라색 계열, 홀수는 하늘색 계열 배경색 적용 + 호버 효과
      return index % 2 === 0 
        ? "bg-purple-100 hover:bg-purple-200 cursor-pointer" 
        : "bg-sky-50 hover:bg-sky-100 cursor-pointer";
    } else {
      // 매출이 0원인 경우 배경색 없음 + 가벼운 회색 호버 효과
      return "hover:bg-gray-50 cursor-pointer";
    }
  };

  // 상점 행 클릭 핸들러
  const handleShopClick = async (shop: ShopData) => {
    setSelectedShop(shop);
    setIsDetailModalOpen(true);
  };

  // 상점 상세 정보 모달 컴포넌트
  const ShopDetailModal = () => {
    if (!selectedShop) return null;
    
    // 현재 날짜와 시간 포맷팅
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    

    return (
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border border-gray-200">
          <DialogHeader>
            <div className="flex items-center justify-between pb-2 border-b">
              <DialogTitle className="text-xl font-bold">{selectedShop.shop_name} 전문점</DialogTitle>
              <div className="text-sm text-gray-600">기준일: {formattedDate}</div>
            </div>
          </DialogHeader>
          
          {/* 상점 정보 요약 */}
          <div className="py-4">
            <div className="mb-4 grid grid-cols-1 gap-4">
              <div className="border rounded-md p-4 bg-blue-50">
                <h3 className="font-medium mb-4">당월 매출 및 수당</h3>
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-sm">매출</div>
                      <div className="font-bold">{formatToManUnit(selectedShop.sales.total)}</div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-sm">수당</div>
                      <div className="font-bold">{formatToManUnit(selectedShop.sales.commission || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsDetailModalOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <KolHeader 
        userName={kolInfo?.name}
        shopName={kolInfo?.shopName}
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
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">전문점 현황</h1>
            </div>

            {/* 차트 영역 */}
            <div className="mb-6 grid grid-cols-1 gap-4">
              {/* 전문점별 순위 */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-row items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-sm sm:text-base md:text-lg whitespace-normal">
                        <span className="hidden sm:inline">전문점별 순위</span>
                        <span className="sm:hidden">순위</span>
                      </CardTitle>
                      <CardDescription className="whitespace-normal text-xs sm:text-sm">
                        <span className="hidden sm:inline">당월 매출액 기준 전문점 순위</span>
                        <span className="sm:hidden">당월 매출액 기준</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] overflow-x-auto custom-scrollbar">
                    {currentMonthBarData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        전문점 매출 데이터가 없습니다.
                      </div>
                    ) : (
                      <div className="h-full pl-0">
                        <ResponsiveContainer width={Math.max(800, currentMonthBarData.length * 120)} height="100%">
                          <BarChart
                            data={currentMonthBarData}
                            margin={{ top: 30, right: 30, left: 0, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false}
                              height={50}
                              interval={0}
                              tick={(props) => {
                                const { x, y, payload } = props;
                                return (
                                  <g transform={`translate(${x},${y})`}>
                                    <text 
                                      x={0} 
                                      y={0} 
                                      dy={16} 
                                      textAnchor="end" 
                                      transform="rotate(-90)"
                                      fill="#555"
                                      fontSize={13}
                                      fontFamily="'SF Compact Text', system-ui, sans-serif"
                                      fontWeight="500"
                                    >
                                      {payload.value}
                                    </text>
                                  </g>
                                );
                              }}
                            />
                            <YAxis 
                              tickFormatter={(value) => formatToManUnit(value).replace('원', '')} 
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fill: "#555",
                                fontSize: 13,
                                fontFamily: "'SF Compact Text', system-ui, sans-serif",
                                fontWeight: "500"
                              }}
                            />
                            <Tooltip 
                              formatter={(value) => formatToManUnit(value as number)} 
                              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                              contentStyle={{
                                borderRadius: '8px',
                                fontFamily: "'SF Compact Text', system-ui, sans-serif",
                                fontSize: '13px'
                              }}
                            />
                            <Bar 
                              dataKey="매출" 
                              fill="#8884d8" 
                              radius={[4, 4, 0, 0]}
                              maxBarSize={70}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 전문점 통계 정보 */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-500 mb-1">전체 전문점</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold">{shopStats.totalShopsCount}</span>
                      <span className="ml-1 text-sm text-gray-500">개</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <div className="text-sm text-gray-500 mb-1">활성 전문점</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold">{shopStats.activeShopsCount}</span>
                      <span className="ml-1 text-sm text-gray-500">개</span>
                      <span className="ml-2 text-xs text-gray-400">(당월 매출 기준)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 전문점 목록 테이블 */}
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm sm:text-base md:text-lg">전문점 목록</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="rounded-lg p-0 overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto max-h-[500px] border border-gray-200">
                    <Table className="border-collapse w-full relative">
                      <TableHeader className="sticky top-0 z-20 bg-gray-50 shadow-sm">
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-[40px] sm:w-[60px] text-center border-b border-gray-200">순위</TableHead>
                          <TableHead className="w-[30px] border-b border-gray-200"></TableHead>
                          <TableHead className="w-[30%] border-b border-gray-200">전문점명</TableHead>
                          <TableHead className="w-[30%] text-center border-b border-gray-200">당월 매출</TableHead>
                          <TableHead className="w-[30%] text-center border-b border-gray-200">당월 수당</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredShops.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-16 text-center border-b border-gray-200">
                              전문점 데이터가 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredShops.map((shop, index) => (
                            <TableRow
                              key={shop.id}
                              className={getRowColorClass(index + 1, shop.sales.total, index)}
                              onClick={() => handleShopClick(shop)}
                            >
                              <TableCell className="text-center font-medium border-b border-gray-200">
                                <div className="flex items-center justify-center">
                                  {index < 3 && shop.sales.total > 0 ? (
                                    <div className={`
                                      flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold
                                      ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                        index === 1 ? 'bg-blue-100 text-blue-800' : 
                                        'bg-orange-100 text-orange-800'}
                                    `}>
                                      {index + 1}
                                    </div>
                                  ) : (
                                    <span className="font-bold text-gray-500">{index + 1}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="w-[30px] text-center border-b border-gray-200">
                                {shop.is_owner_kol && (
                                  <CrownIcon className="h-4 w-4 text-yellow-500" />
                                )}
                              </TableCell>
                              <TableCell className="border-b border-gray-200">
                                {shop.shop_name}
                              </TableCell>
                              <TableCell className="text-center border-b border-gray-200">
                                <span className="font-medium">{formatToManUnit(shop.sales.total)}</span>
                              </TableCell>
                              <TableCell className="text-center border-b border-gray-200">
                                {formatToManUnit(shop.sales.commission || 0)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-2 ml-1">
                  총 {filteredShops.length}개의 전문점
                </div>
              </CardContent>
            </Card>

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
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
          <KolMobileMenu 
            userName={kolInfo?.name} 
            shopName={kolInfo?.shopName} 
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>

      {/* 상점 상세 정보 모달 렌더링 */}
      <ShopDetailModal />
      
      {/* 커스텀 스크롤바 스타일 */}
      <style jsx global>{`
        .overflow-x-auto::-webkit-scrollbar,
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .overflow-x-auto::-webkit-scrollbar-track,
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb,
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #ddd;
          border-radius: 4px;
        }
        .overflow-x-auto::-webkit-scrollbar-thumb:hover,
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #bbb;
        }
      `}</style>

      {/* 차트 초기 위치 설정을 위한 스크립트 */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          const chartContainers = document.querySelectorAll('.custom-scrollbar');
          chartContainers.forEach(container => {
            container.scrollLeft = 0;
          });
        });
      `}} />
    </div>
  );
}