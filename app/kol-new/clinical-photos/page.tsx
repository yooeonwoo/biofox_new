'use client';

import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CaseCard } from '@/components/clinical/CaseCard'; // 표준 컴포넌트 사용
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useClinicalPhotosManager } from './hooks/useClinicalPhotosManager'; // 새로운 중앙 훅
import type { Id } from '@/convex/_generated/dataModel';

// ✅ 클라이언트 컴포넌트 분리
function ClinicalPhotosContent() {
  const router = useRouter();

  // 인증 정보 사용 - 표준 패턴 적용
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [currentRounds, setCurrentRounds] = useState<{ [caseId: string]: number }>({});
  const [saveStatus, setSaveStatus] = useState<{
    [caseId: string]: 'idle' | 'saving' | 'saved' | 'error';
  }>({});
  const [numberVisibleCards, setNumberVisibleCards] = useState<Set<string>>(new Set());

  // 이메일 기반 프로필 조회 (표준 패턴)
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  // 새로운 중앙 훅 사용
  const { data, actions } = useClinicalPhotosManager({
    profileId: profile?._id as Id<'profiles'> | undefined,
  });

  // 고객 케이스 필터링
  const customerCases = useMemo(
    () => data.cases.filter(c => c.subject_type === 'customer'),
    [data.cases]
  );

  // 로딩 상태 세분화
  const isProfileLoading = profile === undefined && !authLoading;
  const isDataLoading = data.isLoading || isProfileLoading || !profile?._id;

  // 본인 케이스를 allCases에서 찾기 - useMemo로 최적화
  const personalCase = useMemo(() => data.cases.find(c => c.name?.trim() === '본인'), [data.cases]);

  // ✅ 인증 체크 (다른 페이지와 동일한 패턴)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  // 사용자 역할 확인
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      const userRole = profile.role;
      setIsKol(userRole === 'kol' || userRole === 'admin');
    }
  }, [authLoading, isAuthenticated, profile]);

  // KOL이 아닌 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && isKol === false) {
      router.push('/');
    }
  }, [authLoading, isKol, router]);

  // 개인 케이스 배열 형태로 변환 (기존 로직 호환성)
  const personalCases = personalCase ? [personalCase] : [];

  const personalProgress =
    personalCases.length > 0
      ? Math.round(
          (personalCases.filter(c => c.status === 'completed').length / personalCases.length) * 100
        )
      : 0;

  const totalCases = customerCases.length;
  const activeCases = customerCases.filter(c => c.status === 'active').length;

  // 표준 CaseCard를 위한 handlers 객체 생성
  const createHandlers = (caseData: any) => ({
    handleConsentChange: async (caseId: string, received: boolean) => {
      await actions.updateCase({
        caseId: caseId as Id<'clinical_cases'>,
        updates: { consent_status: received ? 'consented' : 'no_consent' },
      });
    },
    handleCaseStatusChange: async (caseId: string, status: 'active' | 'completed') => {
      const mappedStatus = status === 'active' ? 'in_progress' : 'completed';
      await actions.updateCaseStatus({
        caseId: caseId as Id<'clinical_cases'>,
        status: mappedStatus as 'in_progress' | 'completed',
      });
    },
    handleDeleteCase: async (caseId: string) => {
      if (confirm('정말로 이 케이스를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
        await actions.deleteCase({ caseId: caseId as Id<'clinical_cases'> });
      }
    },
    refreshCases: () => {
      // Convex는 자동으로 리프레시되므로 아무 작업 필요 없음
    },
    handleSaveAll: async (caseId: string) => {
      setSaveStatus(prev => ({ ...prev, [caseId]: 'saving' }));
      try {
        // 저장 로직이 필요하면 여기에 추가
        setSaveStatus(prev => ({ ...prev, [caseId]: 'saved' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [caseId]: 'idle' }));
        }, 2000);
      } catch (error) {
        setSaveStatus(prev => ({ ...prev, [caseId]: 'error' }));
      }
    },
    handleBasicCustomerInfoUpdate: async (caseId: string, info: any) => {
      await actions.updateCase({
        caseId: caseId as Id<'clinical_cases'>,
        updates: {
          name: info.name,
          age: info.age,
          gender: info.gender,
        },
      });
    },
    handleRoundCustomerInfoUpdate: async (caseId: string, round: number, info: any) => {
      await actions.saveRoundCustomerInfo({
        caseId: caseId as Id<'clinical_cases'>,
        roundNumber: round,
        info: {
          treatmentDate: info.date,
          treatmentType: info.treatmentType,
          products: info.products,
          skinTypes: info.skinTypes,
          memo: info.memo,
        },
      });
    },
    handlePhotoUpload: async (caseId: string, roundDay: number, angle: string, file: File) => {
      await actions.uploadPhoto({
        caseId: caseId as Id<'clinical_cases'>,
        roundDay,
        angle,
        file,
      });
    },
    handlePhotoDelete: async (caseId: string, roundDay: number, angle: string) => {
      // TODO: 사진 삭제 로직 구현 필요
      toast.error('사진 삭제 기능은 준비 중입니다.');
    },
    setCurrentRounds,
  });

  // 로딩 상태 처리
  if (authLoading || isProfileLoading) {
    return <LoadingState title="프로필을 불러오는 중입니다..." />;
  }

  // 프로필을 찾을 수 없는 경우
  if (profile === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-red-500">프로필을 찾을 수 없습니다.</p>
          <p className="text-gray-500">관리자에게 문의하여 프로필을 생성해주세요.</p>
        </div>
      </div>
    );
  }

  // 데이터 로딩 중
  if (isDataLoading || isKol === null) {
    return <LoadingState title="임상 데이터를 불러오는 중입니다..." />;
  }

  // 새 고객 여부 확인
  const isNewCustomer = (caseId: string) => {
    const caseData = data.cases.find(c => c._id === caseId);
    return caseData
      ? !caseData.customerInfo?.name || caseData.customerInfo.name === '새 고객'
      : true;
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 개인 케이스 섹션 */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-blue-800">내 임상 진행상황</CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              진행률 {personalProgress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {personalCase ? (
            <CaseCard
              case_={personalCase}
              index={0}
              currentRounds={currentRounds}
              saveStatus={saveStatus}
              numberVisibleCards={numberVisibleCards}
              isNewCustomer={isNewCustomer}
              setIsComposing={setIsComposing}
              setCases={() => {}} // Convex는 자동으로 업데이트하므로 빈 함수
              handlers={createHandlers(personalCase)}
              totalCases={1}
              profileId={profile?._id?.toString()}
            />
          ) : (
            <EmptyState
              title="아직 내 케이스가 없습니다"
              description="첫 번째 임상 케이스를 등록해보세요"
              action={{
                label: '내 케이스 등록하기',
                onClick: async () => {
                  if (!profile?._id) {
                    toast.error('프로필을 찾을 수 없습니다.');
                    return;
                  }
                  await actions.createCase({
                    name: '본인',
                    subject_type: 'self',
                    consent_status: 'pending',
                  });
                },
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* 고객 케이스 섹션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">고객 임상 관리</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">전체 {totalCases}건</Badge>
              <Badge variant="default" className="bg-green-600">
                진행중 {activeCases}건
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {customerCases.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customerCases.map((caseData, index) => (
                <CaseCard
                  key={caseData._id}
                  case_={caseData}
                  index={index}
                  currentRounds={currentRounds}
                  saveStatus={saveStatus}
                  numberVisibleCards={numberVisibleCards}
                  isNewCustomer={isNewCustomer}
                  setIsComposing={setIsComposing}
                  setCases={() => {}} // Convex는 자동으로 업데이트하므로 빈 함수
                  handlers={createHandlers(caseData)}
                  totalCases={customerCases.length}
                  profileId={profile?._id?.toString()}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="등록된 고객 케이스가 없습니다"
              description="첫 번째 고객 케이스를 등록해보세요"
              action={{
                label: '고객 케이스 등록하기',
                onClick: () => router.push('/kol-new/clinical-photos/upload/customer'),
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ✅ 메인 컴포넌트 - SSR Hydration 문제 해결을 위해 CSR로 전환
export default function ClinicalPhotosPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingState title="페이지를 로드하는 중..." />;
  }

  return <ClinicalPhotosContent />;
}
