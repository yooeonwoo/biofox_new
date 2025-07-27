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
import KolHeader from '../../../components/layout/KolHeader';
import KolFooter from '../../../components/layout/KolFooter';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DialogTitle } from '@/components/ui/dialog';
import KolMobileMenu from '../../../components/layout/KolMobileMenu';
import { useAuth } from '@/hooks/useAuth';

interface FormDataState {
  customerName: string;
  caseName: string;
  consentReceived: boolean;
  consentDate: string;
}

export default function ClinicalPhotosUploadPage() {
  const { user, profile, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [existingCases, setExistingCases] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormDataState>({
    customerName: '',
    caseName: '',
    consentReceived: false,
    consentDate: '',
  });

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      redirect('/signin');
    }
  }, [isAuthLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchExistingCases = async () => {
        try {
          const dummyCases = [
            {
              id: 1,
              customerName: '김미영 고객님',
              caseName: '보톡스 이마',
              status: 'active',
              createdAt: '2024-01-10T09:00:00.000Z',
            },
            {
              id: 2,
              customerName: '이정희 고객님',
              caseName: '필러 팔자주름',
              status: 'completed',
              createdAt: '2024-01-05T14:30:00.000Z',
            },
            {
              id: 3,
              customerName: '박소연 고객님',
              caseName: '리프팅 시술',
              status: 'active',
              createdAt: '2024-01-03T11:00:00.000Z',
            },
          ];
          setExistingCases(dummyCases);
        } catch (error) {
          console.error('기존 케이스 로드 실패:', error);
        }
      };
      fetchExistingCases();
    }
  }, [isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
    let newConsentReceived: boolean;
    let newConsentDate: string;

    if (checked === 'indeterminate') {
      // indeterminate 상태는 동의하지 않은 것으로 간주하고 초기화합니다.
      newConsentReceived = false;
      newConsentDate = '';
    } else {
      // boolean 상태 처리 (undefined 방지를 위해 ?? 사용)
      newConsentReceived = checked;
      newConsentDate = checked ? (new Date().toISOString().split('T')[0] ?? '') : '';
    }

    setFormData(prev => ({
      ...prev,
      consentReceived: newConsentReceived,
      consentDate: newConsentDate,
    }));
  };

  const handleCreateCase = async () => {
    try {
      console.log('케이스 생성 (더미):', formData);
      alert('케이스가 성공적으로 생성되었습니다! (더미)');
      setFormData({ customerName: '', caseName: '', consentReceived: false, consentDate: '' });
      router.push('/kol-new/clinical-photos/upload/customer');
    } catch (error) {
      console.error('케이스 생성 실패:', error);
      alert('케이스 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleSaveDraft = () => {
    if (typeof window !== 'undefined') {
      const draftData = { ...formData, savedAt: new Date().toISOString() };
      localStorage.setItem('clinical_case_draft', JSON.stringify(draftData));
      alert('임시저장되었습니다.');
    }
  };

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
            consentDate: draftData.consentDate || '',
          });
        } catch (error) {
          console.error('임시저장 데이터 로드 실패:', error);
        }
      }
    }
  }, []);

  if (isAuthLoading) {
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
    <div className="flex h-screen flex-col">
      <KolHeader onMenuClick={() => {}} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto bg-muted/10 p-4 md:p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/kol-new/clinical-photos">
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
            <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="h-5 w-5" />새 케이스 등록
                </CardTitle>
                <CardDescription>고객 정보를 입력하고 시술 사진을 업로드하세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        value={formData.consentDate}
                        onChange={handleInputChange}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">시술 사진 업로드</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="block text-center text-xs font-medium">Before</Label>
                      <div className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100">
                        <div className="text-center">
                          <Camera className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                          <span className="text-xs text-gray-500">정면</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-center text-xs font-medium">7일차</Label>
                      <div className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100">
                        <div className="text-center">
                          <Camera className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                          <span className="text-xs text-gray-500">정면</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="block text-center text-xs font-medium">14일차</Label>
                      <div className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100">
                        <div className="text-center">
                          <Camera className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                          <span className="text-xs text-gray-500">정면</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                            className={`rounded-full px-2 py-1 text-xs ${case_.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                          >
                            {case_.status === 'completed' ? '완료' : '진행중'}
                          </span>
                          <Button size="sm" variant="outline" asChild>
                            <Link href="/kol-new/clinical-photos/upload/customer">사진 업로드</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                    {existingCases.length >= 5 && (
                      <div className="pt-3 text-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/kol-new/clinical-photos">전체 케이스 보기</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Camera className="mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      등록된 케이스가 없습니다
                    </h3>
                    <p className="mb-4 text-gray-500">
                      위 폼을 사용해서 첫 번째 케이스를 등록해보세요
                    </p>
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
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger className="block sm:hidden">
          <div className="flex items-center justify-center p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
            </svg>
          </div>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] sm:w-[300px]">
          <DialogTitle className="sr-only">모바일 메뉴</DialogTitle>
          <KolMobileMenu
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            userName={profile?.name || user?.email || 'KOL'}
            shopName={'임상사진 업로드'}
            userImage={user?.user_metadata?.avatar_url}
            onSignOut={() => router.push('/api/auth/signout')}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
