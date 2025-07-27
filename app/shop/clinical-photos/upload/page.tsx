'use client';

import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Plus, Calendar, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface ShopInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

interface FormData {
  customerName: string;
  caseName: string;
  consentReceived: boolean;
  consentDate: string | undefined;
}

// 임시 모킹 데이터
const mockExistingCases = [
  {
    id: '1',
    customerName: '김고객',
    caseName: '보톡스 이마',
    status: 'in_progress',
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '2',
    customerName: '이고객',
    caseName: '필러 팔자주름',
    status: 'completed',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    customerName: '박고객',
    caseName: '리프팅',
    status: 'in_progress',
    createdAt: '2024-01-20T00:00:00Z',
  },
];

export default function ClinicalPhotosUploadPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  const [dashboardData, setDashboardData] = useState<{ shop?: ShopInfo } | null>(null);
  const [existingCases, setExistingCases] = useState<any[]>([]);

  // 폼 상태
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    caseName: '',
    consentReceived: false,
    consentDate: '',
  });

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/signin');
    }
  }, [authUser, authLoading, router]);

  // 대시보드 데이터 로드 (모킹)
  useEffect(() => {
    if (profile) {
      const fetchData = async () => {
        try {
          // 실제 API 호출 대신 모킹 데이터 사용
          console.log('Shop 업로드: 대시보드 데이터 로드 시작 (모킹)');

          await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮬레이션

          setDashboardData({
            shop: {
              id: 1,
              name: profile.name || '전문점',
              shopName: profile.shop_name || '바이오폭스 전문점',
              email: authUser?.email || 'shop@example.com',
              phone: '010-0000-0000', // profile에 phone 필드가 없으므로 기본값 사용
            },
          });

          // 기존 케이스 로드 (모킹)
          setExistingCases(mockExistingCases.slice(0, 5));
          console.log('Shop 업로드: 모킹 데이터 로드 완료');
        } catch (err) {
          console.error('데이터 로드 중 오류:', err);
          setExistingCases([]);
        }
      };

      fetchData();
    }
  }, [profile, authUser]);

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 체크박스 핸들러
  const handleCheckboxChange = (checked: boolean) => {
    const newConsentDate = checked ? new Date().toISOString().split('T')[0] : '';
    setFormData(prev => ({
      ...prev,
      consentReceived: checked,
      consentDate: newConsentDate,
    }));
  };

  // 케이스 생성 핸들러 (모킹)
  const handleCreateCase = async () => {
    try {
      console.log('케이스 생성 요청 (모킹):', formData);

      // 실제 API 호출 대신 성공 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('케이스가 성공적으로 생성되었습니다! (개발 모드)');
      // 폼 초기화
      setFormData({
        customerName: '',
        caseName: '',
        consentReceived: false,
        consentDate: '',
      });
      // 상세 페이지로 이동하지 않고 현재 페이지에 머물기
      console.log('케이스 생성 완료 (모킹)');
    } catch (error) {
      console.error('케이스 생성 실패:', error);
      alert('케이스 생성에 실패했습니다. (개발 모드)');
    }
  };

  // 임시저장 핸들러
  const handleSaveDraft = () => {
    if (typeof window !== 'undefined') {
      const draftData = {
        ...formData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('shop_clinical_case_draft', JSON.stringify(draftData));
      alert('임시저장되었습니다.');
    }
  };

  // 임시저장 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('shop_clinical_case_draft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setFormData({
            customerName: draftData.customerName || '',
            caseName: draftData.caseName || '',
            consentReceived: draftData.consentReceived || false,
            consentDate: draftData.consentDate || '',
          });
        } catch (error) {
          console.error('임시저장 데이터 로드 실패:', error);
        }
      }
    }
  }, []);

  // 로딩 중이거나 사용자 정보 확인 중인 경우
  if (authLoading || !profile) {
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

  return (
    <div className="mx-auto max-w-4xl">
      {/* 뒤로가기 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/shop/clinical-photos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-bold sm:text-xl md:text-2xl">임상사진 업로드</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            새로운 케이스를 등록하고 사진을 업로드하세요
          </p>
        </div>
      </div>

      {/* 개발 모드 알림 */}
      <Card className="mb-6 border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-orange-800">
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
            <span className="text-sm font-medium">
              개발 모드: 실제 데이터베이스 연결 없이 UI만 확인 가능합니다.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 새 업로드 폼 (상단 고정) */}
      <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />새 케이스 등록
          </CardTitle>
          <CardDescription>고객 정보를 입력하고 시술 사진을 업로드하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 기본 정보 입력 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="space-y-3 rounded-lg border bg-white p-4">
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
                  value={formData.consentDate || ''}
                  onChange={handleInputChange}
                  className="w-full sm:w-auto"
                />
              </div>
            )}
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
          <CardDescription>
            기존에 등록된 케이스들을 확인하고 추가 사진을 업로드할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingCases.length > 0 ? (
            <div className="space-y-3">
              {existingCases.map(case_ => (
                <div
                  key={case_.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{case_.customerName}</h4>
                    <p className="text-sm text-gray-500">{case_.caseName || '시술명 없음'}</p>
                    <p className="text-xs text-gray-400">
                      생성일: {new Date(case_.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        case_.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {case_.status === 'completed' ? '완료' : '진행중'}
                    </span>
                    <Button size="sm" variant="outline" disabled>
                      사진 업로드 (개발 모드)
                    </Button>
                  </div>
                </div>
              ))}

              {existingCases.length >= 5 && (
                <div className="pt-3 text-center">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/shop/clinical-photos">전체 케이스 보기</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Camera className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">등록된 케이스가 없습니다</h3>
              <p className="mb-4 text-gray-500">위 폼을 사용해서 첫 번째 케이스를 등록해보세요</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
