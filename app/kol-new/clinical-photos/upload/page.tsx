'use client';

import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';

interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}
import Link from 'next/link';
import { ArrowLeft, Camera, Plus, Calendar, User, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import KolHeader from "../../../components/layout/KolHeader";
import KolSidebar from "../../../components/layout/KolSidebar";
import KolFooter from "../../../components/layout/KolFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import KolMobileMenu from "../../../components/layout/KolMobileMenu";

export default function ClinicalPhotosUploadPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ kol?: KolInfo } | null>(null);
  const [existingCases, setExistingCases] = useState<any[]>([]);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    customerName: '',
    caseName: '',
    consentReceived: false,
    consentDate: ''
  });

  // 사용자 인증 확인
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsSignedIn(true);
          const userRole = userData.role || "kol";
          console.log('사용자 역할:', userRole);
          // test 역할과 kol 역할 모두 임상사진 페이지 접근 허용
          setIsKol(userRole === "kol" || userRole === "test");
        } else {
          setIsSignedIn(false);
          setIsKol(false);
        }
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setIsSignedIn(false);
        setIsKol(false);
      } finally {
        setIsLoaded(true);
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  // 대시보드 데이터 로드
  useEffect(() => {
    if (isLoaded && isSignedIn && isKol !== null) {
      const fetchDashboardData = async () => {
        try {
          console.log('임상사진 업로드 - 대시보드 데이터 로드 시작...');
          const dashboardResponse = await fetch('/api/kol-new/dashboard');
          
          if (!dashboardResponse.ok) {
            console.error('대시보드 API 에러');
            return;
          }
          
          const dashboardResult = await dashboardResponse.json();
          console.log('임상사진 업로드 - 대시보드 데이터 로드 완료');
          setDashboardData(dashboardResult);
        } catch (err) {
          console.error('대시보드 데이터 로드 중 오류:', err);
        }
      };
      
      fetchDashboardData();
      
      // 기존 케이스 로드
      const fetchExistingCases = async () => {
        try {
          const { fetchCases } = await import('@/lib/clinical-photos');
          const cases = await fetchCases();
          setExistingCases(cases.slice(0, 5)); // 최초 5개만 표시
        } catch (error) {
          console.error('기존 케이스 로드 실패:', error);
        }
      };
      
      fetchExistingCases();
    }
  }, [isLoaded, isSignedIn, isKol]);

  // 로그아웃 함수
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다:', error);
    }
  };

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 체크박스 핸들러
  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      consentReceived: checked,
      consentDate: checked ? new Date().toISOString().split('T')[0] : ''
    }));
  };

  // 케이스 생성 핸들러
  const handleCreateCase = async () => {
    try {
      const { createCase } = await import('@/lib/clinical-photos-api');
      const caseData = {
        customerName: formData.customerName,
        caseName: formData.caseName,
        consentReceived: formData.consentReceived,
        consentDate: formData.consentDate || undefined,
        treatmentPlan: '',
        concernArea: ''
      };
      
      const createdCase = await createCase(caseData);
      
      if (createdCase) {
        alert('케이스가 성공적으로 생성되었습니다!');
        // 폼 초기화
        setFormData({
          customerName: '',
          caseName: '',
          consentReceived: false,
          consentDate: ''
        });
        // 상세 페이지로 이동
        router.push('/kol-new/clinical-photos/upload/customer');
      }
    } catch (error) {
      console.error('케이스 생성 실패:', error);
      alert('케이스 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 임시저장 핸들러
  const handleSaveDraft = () => {
    if (typeof window !== 'undefined') {
      const draftData = {
        ...formData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('clinical_case_draft', JSON.stringify(draftData));
      alert('임시저장되었습니다.');
    }
  };

  // 임시저장 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('clinical_case_draft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData({
            customerName: draftData.customerName || '',
            caseName: draftData.caseName || '',
            consentReceived: draftData.consentReceived || false,
            consentDate: draftData.consentDate || ''
          });
        } catch (error) {
          console.error('임시저장 데이터 로드 실패:', error);
        }
      }
    }
  }, []);

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (!isLoaded || isKol === null || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">업로드 페이지를 준비하는 중입니다.</p>
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
        userName={user?.firstName || "KOL"}
        shopName={dashboardData?.kol?.shopName || "로딩 중..."}
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
          <div className="mx-auto max-w-4xl">
            {/* 뒤로가기 헤더 */}
            <div className="mb-6 flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/kol-new/clinical-photos">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  뒤로
                </Link>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold">임상사진 업로드</h1>
                <p className="text-sm text-muted-foreground mt-1">새로운 케이스를 등록하고 사진을 업로드하세요</p>
              </div>
            </div>

            {/* 새 업로드 폼 (상단 고정) */}
            <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  새 케이스 등록
                </CardTitle>
                <CardDescription>고객 정보를 입력하고 시술 사진을 업로드하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 기본 정보 입력 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      고객명
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      placeholder="고객명을 입력하세요 (본인인 경우 '본인')"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caseName" className="flex items-center gap-2">
                      <Scissors className="h-4 w-4" />
                      시술명
                    </Label>
                    <Input
                      id="caseName"
                      name="caseName"
                      placeholder="예: 보톡스 이마, 필러 팔자주름"
                      value={formData.caseName}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* 동의서 체크 */}
                <div className="space-y-3 p-4 bg-white rounded-lg border">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="consent"
                      checked={formData.consentReceived}
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="consent" className="text-sm font-medium">
                      고객 동의서를 받았습니다
                    </Label>
                  </div>
                  {formData.consentReceived && (
                    <div className="space-y-2">
                      <Label htmlFor="consentDate" className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        동의서 받은 날짜
                      </Label>
                      <Input
                        id="consentDate"
                        name="consentDate"
                        type="date"
                        value={formData.consentDate}
                        onChange={handleInputChange}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  )}
                </div>

                {/* 사진 업로드 그리드 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">시술 사진 업로드</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Before */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-center block">Before</Label>
                      <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-xs text-gray-500">정면</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 7일차 */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-center block">7일차</Label>
                      <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-xs text-gray-500">정면</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 14일차 */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-center block">14일차</Label>
                      <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="text-center">
                          <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <span className="text-xs text-gray-500">정면</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    disabled={!formData.customerName || !formData.caseName}
                    onClick={handleSaveDraft}
                  >
                    임시저장
                  </Button>
                  <Button 
                    className="flex-1"
                    disabled={!formData.customerName || !formData.caseName}
                    onClick={handleCreateCase}
                  >
                    케이스 생성
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 이전 케이스들 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">이전 케이스</CardTitle>
                <CardDescription>기존에 등록된 케이스들을 확인하고 추가 사진을 업로드할 수 있습니다</CardDescription>
              </CardHeader>
              <CardContent>
                {existingCases.length > 0 ? (
                  <div className="space-y-3">
                    {existingCases.map((case_) => (
                      <div key={case_.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <h4 className="font-medium">{case_.customerName}</h4>
                          <p className="text-sm text-gray-500">{case_.caseName || '시술명 없음'}</p>
                          <p className="text-xs text-gray-400">생성일: {new Date(case_.createdAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            case_.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {case_.status === 'completed' ? '완료' : '진행중'}
                          </span>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/kol-new/clinical-photos/upload/customer">
                              사진 업로드
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {existingCases.length >= 5 && (
                      <div className="text-center pt-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/kol-new/clinical-photos">
                            전체 케이스 보기
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Camera className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 케이스가 없습니다</h3>
                    <p className="text-gray-500 mb-4">위 폼을 사용해서 첫 번째 케이스를 등록해보세요</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
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
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
          <KolMobileMenu 
            userName={user?.firstName || "KOL"}
            shopName={"임상사진 업로드"}
            userImage={user?.imageUrl} 
            setMobileMenuOpen={setMobileMenuOpen} 
            onSignOut={handleSignOut}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}