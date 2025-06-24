'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Users, Store, PieChart, Bell } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";

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
    <div className="bg-white rounded-lg shadow p-6 transition-all hover:shadow-md">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-3 rounded-full mr-4 text-blue-600">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link 
        href={linkHref}
        className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
      >
        {linkText}
        <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
        </svg>
      </Link>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

// KOL 타입 정의
interface KolUser {
  id: number;
  clerk_id: string;
  email: string;
  name: string;
  role: string;
  kol?: {
    id: number;
    name: string;
    shop_name: string;
  };
}

// API 함수
const fetchKolUsers = async (): Promise<KolUser[]> => {
  const response = await fetch('/api/admin/users?role=kol', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('KOL 목록을 불러오는데 실패했습니다.');
  }
  
  return response.json();
};

// 메인 페이지 컴포넌트
export default function AdminDashboardMainPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [stats, setStats] = useState({
    kolsCount: 0,
    shopsCount: 0,
    productsCount: 0,
    isLoading: true
  });
  
  // 알림 보내기 다이얼로그 상태
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'individual'>('all');
  const [selectedKols, setSelectedKols] = useState<number[]>([]);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationContent, setNotificationContent] = useState('');
  
  // KOL 목록 가져오기
  const { data: kolUsers = [], isLoading: isLoadingKols } = useQuery({
    queryKey: ['kolUsers'],
    queryFn: fetchKolUsers,
    enabled: isNotificationOpen && targetType === 'individual',
  });

  useEffect(() => {
    // Clerk 로딩 및 인증 확인
    if (!isLoaded || !isSignedIn) return;

    async function fetchStats() {
      try {
        // Supabase 클라이언트 생성
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // KOL 수 조회
        const { data: kols, error: kolsError } = await supabase
          .from('kols')
          .select('id', { count: 'exact' });

        // 전문점 수 조회
        const { data: shops, error: shopsError } = await supabase
          .from('shops')
          .select('id', { count: 'exact' });

        // 제품 수 조회
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id', { count: 'exact' });

        if (kolsError || shopsError || productsError) {
          console.error('데이터 조회 중 오류 발생:', { kolsError, shopsError, productsError });
        }

        setStats({
          kolsCount: kols?.length || 0,
          shopsCount: shops?.length || 0,
          productsCount: products?.length || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('통계 데이터 조회 오류:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchStats();
  }, [isLoaded, isSignedIn]);

  // 폼 검증
  const validateForm = () => {
    if (!notificationTitle.trim() || notificationTitle.length > 255) {
      toast({
        title: "오류",
        description: "제목은 1-255자 사이여야 합니다.",
        variant: "destructive",
      });
      return false;
    }
    
    if (!notificationContent.trim() || notificationContent.length > 1000) {
      toast({
        title: "오류",
        description: "내용은 1-1000자 사이여야 합니다.",
        variant: "destructive",
      });
      return false;
    }
    
    if (targetType === 'individual' && selectedKols.length === 0) {
      toast({
        title: "오류",
        description: "최소 1명 이상의 KOL을 선택해주세요.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // 알림 전송
  const handleSendNotification = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          targetType,
          selectedKols: targetType === 'individual' ? selectedKols : undefined,
          title: notificationTitle.trim(),
          content: notificationContent.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '알림 전송에 실패했습니다.');
      }

      // 성공 메시지
      toast({
        title: "알림 전송 완료",
        description: `${data.count}명의 KOL에게 알림을 전송했습니다.`,
      });
      
      // 다이얼로그 닫기
      setIsNotificationOpen(false);
      resetForm();
    } catch (error) {
      console.error('알림 전송 오류:', error);
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "알림 전송에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setTargetType('all');
    setSelectedKols([]);
    setNotificationTitle('');
    setNotificationContent('');
  };

  // KOL 선택 토글
  const toggleKolSelection = (kolId: number) => {
    setSelectedKols(prev => {
      if (prev.includes(kolId)) {
        return prev.filter(id => id !== kolId);
      } else {
        return [...prev, kolId];
      }
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedKols.length === kolUsers.length) {
      setSelectedKols([]);
    } else {
      setSelectedKols(kolUsers.map(user => user.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <Button onClick={() => setIsNotificationOpen(true)} className="gap-2">
          <Bell className="h-4 w-4" />
          알림 보내기
        </Button>
      </div>
      
      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.isLoading ? (
          // 로딩 표시
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-2 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
            </div>
          ))
        ) : (
          <>
            <StatCard title="전체 KOL 수" value={stats.kolsCount} />
            <StatCard title="전체 전문점 수" value={stats.shopsCount} />
            <StatCard title="전체 제품 수" value={stats.productsCount} />
          </>
        )}
      </div>
      
      {/* 관리 섹션 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard
          title="KOL 및 전문점 관리"
          description="KOL과 전문점 정보를 추가, 수정, 조회합니다."
          icon={<Users size={24} />}
          linkText="관리하기"
          linkHref="/admin-dashboard/entities"
        />
        
        <DashboardCard
          title="KOL 월별 지표 관리"
          description="KOL의 월별 실적 및 통계 데이터를 관리합니다."
          icon={<BarChart3 size={24} />}
          linkText="관리하기"
          linkHref="/admin-dashboard/kol-metrics"
        />
        
        <DashboardCard
          title="전문점 매출 관리"
          description="전문점별 매출 데이터를 관리합니다."
          icon={<Store size={24} />}
          linkText="관리하기"
          linkHref="/admin-dashboard/shop-sales"
        />
        
        <DashboardCard
          title="제품 매출 비율 관리"
          description="제품별 매출 비율 및 수량을 관리합니다."
          icon={<PieChart size={24} />}
          linkText="관리하기"
          linkHref="/admin-dashboard/product-sales"
        />
      </div>

      {/* 알림 보내기 다이얼로그 */}
      <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>알림 보내기</DialogTitle>
            <DialogDescription>
              KOL에게 알림을 보냅니다. 대상을 선택하고 내용을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 대상 선택 */}
            <div className="space-y-2">
              <Label htmlFor="target">대상 선택</Label>
              <Select value={targetType} onValueChange={(value: 'all' | 'individual') => {
                setTargetType(value);
                setSelectedKols([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="대상을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 KOL</SelectItem>
                  <SelectItem value="individual">개별 KOL 선택</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 개별 KOL 선택 */}
            {targetType === 'individual' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>KOL 선택 ({selectedKols.length}명 선택됨)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedKols.length === kolUsers.length ? '전체 해제' : '전체 선택'}
                  </Button>
                </div>
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  {isLoadingKols ? (
                    <p className="text-sm text-muted-foreground text-center">KOL 목록을 불러오는 중...</p>
                  ) : kolUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">KOL이 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {kolUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`kol-${user.id}`}
                            checked={selectedKols.includes(user.id)}
                            onCheckedChange={() => toggleKolSelection(user.id)}
                          />
                          <label
                            htmlFor={`kol-${user.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {user.kol?.name || user.name || '이름 없음'} 
                            {user.kol?.shop_name && <span className="text-muted-foreground ml-1">({user.kol.shop_name})</span>}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* 제목 입력 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                placeholder="알림 제목을 입력하세요"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                maxLength={255}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notificationTitle.length}/255
              </p>
            </div>

            {/* 내용 입력 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                placeholder="알림 내용을 입력하세요"
                value={notificationContent}
                onChange={(e) => setNotificationContent(e.target.value)}
                maxLength={1000}
                rows={5}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notificationContent.length}/1000
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsNotificationOpen(false);
              resetForm();
            }}>
              취소
            </Button>
            <Button onClick={handleSendNotification}>
              알림 보내기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 