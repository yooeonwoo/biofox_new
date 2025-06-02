'use client';

import { useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Search, 
  Calendar,
  Store,
  Plus,
  Filter,
  FileText,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import KolHeader from "../../components/layout/KolHeader";
import KolSidebar from "../../components/layout/KolSidebar";
import KolFooter from "../../components/layout/KolFooter";
import KolMobileMenu from "../../components/layout/KolMobileMenu";

// 영업 일지 데이터 타입 정의
interface ActivityData {
  id: number;
  shop_id?: number;
  shop_name?: string;
  activity_date: string;
  content: string;
  created_at: string;
}

// 전문점 타입 정의
interface Shop {
  id: number;
  name: string;
}

export default function ActivitiesPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    shop_id: '',
    activity_date: format(new Date(), 'yyyy-MM-dd'),
    content: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    shopId: 'all',
    dateRange: 'all',
    searchTerm: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const activitiesPerPage = 10;

  // 사용자 역할 확인
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user.publicMetadata?.role as string || "kol";
      setIsKol(userRole === "kol");
    }
  }, [isLoaded, isSignedIn, user]);

  // 영업 일지 데이터 로드
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol) {
      const fetchData = async () => {
        try {
          setLoading(true);
          
          // 영업 일지 데이터 로드
          const activitiesResponse = await fetch('/api/kol-new/activities');
          if (!activitiesResponse.ok) {
            const errorData = await activitiesResponse.json();
            throw new Error(errorData.error || '영업 일지 데이터를 불러오는데 실패했습니다.');
          }
          const activitiesData = await activitiesResponse.json();
          setActivities(activitiesData);

          // 전문점 데이터 로드 (영업 일지 생성 시 선택을 위해)
          const shopsResponse = await fetch('/api/kol-new/shops');
          if (!shopsResponse.ok) {
            const errorData = await shopsResponse.json();
            throw new Error(errorData.error || '전문점 데이터를 불러오는데 실패했습니다.');
          }
          
          const shopsData = await shopsResponse.json();
          const formattedShops = (shopsData.shops || []).map((shop: any) => ({
            id: shop.id,
            name: shop.shop_name || shop.ownerName
          }));
          
          setShops(formattedShops);
          setTotalPages(Math.ceil(activitiesData.length / activitiesPerPage) || 1);
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

  // 영업 일지 추가 폼 제출 핸들러
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/kol-new/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_id: activityForm.shop_id === '' ? null : parseInt(activityForm.shop_id),
          activity_date: activityForm.activity_date,
          content: activityForm.content
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '영업 일지 등록에 실패했습니다.');
      }

      // 영업 일지 데이터 새로 로드
      const refreshResponse = await fetch('/api/kol-new/activities');
      if (!refreshResponse.ok) {
        throw new Error('영업 일지 데이터 새로고침에 실패했습니다.');
      }
      
      const refreshedActivities = await refreshResponse.json();
      setActivities(refreshedActivities);
      
      // 폼 초기화 및 다이얼로그 닫기
      setActivityForm({
        shop_id: '',
        activity_date: format(new Date(), 'yyyy-MM-dd'),
        content: ''
      });
      setIsAddDialogOpen(false);
      
      // 성공 메시지 표시 (선택적)
      alert('영업 일지가 성공적으로 등록되었습니다.');
    } catch (err) {
      console.error('영업 일지 등록 에러:', err);
      alert(err instanceof Error ? err.message : '영업 일지 등록에 실패했습니다.');
    }
  };

  // 필터링된 영업 일지 목록 구하기
  const getFilteredActivities = (): ActivityData[] => {
    return activities.filter(activity => {
      // 전문점 필터
      if (filterOptions.shopId !== 'all' && activity.shop_id !== parseInt(filterOptions.shopId)) {
        return false;
      }

      // 날짜 범위 필터
      if (filterOptions.dateRange !== 'all') {
        const activityDate = new Date(activity.activity_date);
        const today = new Date();
        
        if (filterOptions.dateRange === 'week') {
          // 1주일 이내
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          if (activityDate < weekAgo) return false;
        } else if (filterOptions.dateRange === 'month') {
          // 1개월 이내
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          if (activityDate < monthAgo) return false;
        }
      }

      // 검색어 필터
      if (filterOptions.searchTerm) {
        const searchLower = filterOptions.searchTerm.toLowerCase();
        const contentLower = activity.content.toLowerCase();
        const shopNameLower = activity.shop_name?.toLowerCase() || '';
        
        return contentLower.includes(searchLower) || shopNameLower.includes(searchLower);
      }

      return true;
    });
  };

  // 페이지네이션 처리된 영업 일지 목록
  const getPaginatedActivities = (): ActivityData[] => {
    const filtered = getFilteredActivities();
    const startIndex = (page - 1) * activitiesPerPage;
    const endIndex = startIndex + activitiesPerPage;
    
    return filtered.slice(startIndex, endIndex);
  };

  // 필터 변경 시 페이지를 1로 초기화
  const handleFilterChange = (key: string, value: string) => {
    setFilterOptions({
      ...filterOptions,
      [key]: value
    });
    setPage(1);
  };

  // 필터링된 활동 목록이 변경될 때 totalPages 업데이트를 위한 useEffect
  useEffect(() => {
    const filtered = getFilteredActivities();
    setTotalPages(Math.ceil(filtered.length / activitiesPerPage) || 1); // 0으로 나누는 것 방지
  }, [activities, filterOptions, activitiesPerPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // KOL이 아닌 경우 홈으로 리다이렉트
  if (isLoaded && isSignedIn && isKol === false) {
    return redirect('/');
  }

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!isLoaded || isKol === null || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">영업 일지 데이터를 불러오는 중입니다.</p>
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

  const paginatedActivities = getPaginatedActivities();

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <KolHeader 
        userName={user?.publicMetadata?.kolName as string}
        shopName={user?.publicMetadata?.shopName as string}
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
            {/* 페이지 헤더 */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">영업 일지</h1>
                <p className="text-muted-foreground text-sm">전문점 방문 및 영업 활동을 기록하세요</p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-1 h-4 w-4" /> 
                      영업 일지 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white">
                    <DialogHeader>
                      <DialogTitle>새 영업 일지 작성</DialogTitle>
                      <DialogDescription>
                        전문점 방문 또는 영업 활동 내용을 작성하세요.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddActivity}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="shop" className="text-right text-sm">전문점</label>
                          <Select
                            value={activityForm.shop_id}
                            onValueChange={(value) => setActivityForm({...activityForm, shop_id: value})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="전문점 선택 (선택사항)" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="">일반 활동</SelectItem>
                              {shops.map((shop) => (
                                <SelectItem key={shop.id} value={shop.id.toString()}>
                                  {shop.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <label htmlFor="date" className="text-right text-sm">날짜</label>
                          <Input
                            id="date"
                            type="date"
                            value={activityForm.activity_date}
                            onChange={(e) => setActivityForm({...activityForm, activity_date: e.target.value})}
                            className="col-span-3"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <label htmlFor="content" className="text-right text-sm">내용</label>
                          <Textarea
                            id="content"
                            value={activityForm.content}
                            onChange={(e) => setActivityForm({...activityForm, content: e.target.value})}
                            className="col-span-3"
                            rows={5}
                            placeholder="영업 활동 내용을 작성하세요"
                            required
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">저장</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* 필터 영역 */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="shopFilter" className="text-sm font-medium block mb-1">전문점 필터</label>
                    <Select
                      value={filterOptions.shopId}
                      onValueChange={(value) => handleFilterChange('shopId', value)}
                    >
                      <SelectTrigger id="shopFilter" className="w-full">
                        <SelectValue placeholder="전문점 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">모든 전문점</SelectItem>
                        <SelectItem value="no-shop">일반 활동</SelectItem>
                        {shops.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id.toString()}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="dateFilter" className="text-sm font-medium block mb-1">기간 필터</label>
                    <Select
                      value={filterOptions.dateRange}
                      onValueChange={(value) => handleFilterChange('dateRange', value)}
                    >
                      <SelectTrigger id="dateFilter" className="w-full">
                        <SelectValue placeholder="기간 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">전체 기간</SelectItem>
                        <SelectItem value="week">최근 1주일</SelectItem>
                        <SelectItem value="month">최근 1개월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="searchFilter" className="text-sm font-medium block mb-1">검색</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="searchFilter"
                        placeholder="내용 또는 전문점 검색..."
                        className="pl-8"
                        value={filterOptions.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 영업 일지 테이블 */}
            <Card>
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">영업 일지가 없습니다</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      아직 등록된 영업 일지가 없습니다. 새로운 영업 일지를 추가해보세요.
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-1 h-4 w-4" /> 영업 일지 추가
                    </Button>
                  </div>
                ) : paginatedActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">검색 결과가 없습니다</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      현재 필터 조건에 맞는 영업 일지가 없습니다. 다른 필터 조건을 시도해보세요.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setFilterOptions({
                        shopId: 'all',
                        dateRange: 'all',
                        searchTerm: ''
                      });
                    }}>
                      필터 초기화
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">날짜</TableHead>
                        <TableHead className="w-[150px]">전문점</TableHead>
                        <TableHead>활동 내용</TableHead>
                        <TableHead className="w-[100px] text-right">작성일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">
                            {new Date(activity.activity_date).toLocaleDateString('ko-KR')}
                          </TableCell>
                          <TableCell>
                            {activity.shop_name ? (
                              <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-blue-500" />
                                <span>{activity.shop_name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <ClipboardList className="h-4 w-4 text-purple-500" />
                                <span className="text-muted-foreground">일반 활동</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="line-clamp-2">{activity.content}</p>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            {new Date(activity.created_at).toLocaleDateString('ko-KR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>

              {/* 페이지네이션 - 검색 결과가 있을 때만 표시 */}
              {totalPages > 1 && paginatedActivities.length > 0 && (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm">
                    페이지 {page} / {totalPages}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>

            {/* Footer */}
            <div className="mt-10">
              <KolFooter />
            </div>
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
            userName={user?.publicMetadata?.kolName as string}
            shopName={user?.publicMetadata?.shopName as string}
            userImage={user?.imageUrl}
            setMobileMenuOpen={setMobileMenuOpen}
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
} 