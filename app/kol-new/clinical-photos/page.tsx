'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  useClinicalCasesSupabase,
  useCreateClinicalCaseSupabase,
  useUpdateClinicalCaseSupabase,
  useDeleteClinicalCaseSupabase,
} from '@/lib/clinical-photos-supabase-hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CaseCard } from './components/CaseCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ✅ 클라이언트 컴포넌트 분리
function ClinicalPhotosContent() {
  const router = useRouter();

  // 인증 정보 사용 - 표준 패턴 적용
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isKol, setIsKol] = useState<boolean | null>(null);

  // 이메일 기반 프로필 조회 (표준 패턴)
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    user?.email ? { email: user.email } : 'skip'
  );

  // Supabase 쿼리 사용 - profile._id 기반
  const { data: allCases = [], isLoading: casesLoading } = useClinicalCasesSupabase(
    profile?._id, // Convex profile ID를 Supabase에 전달
    undefined
  );

  // Supabase 뮤테이션
  const createCase = useCreateClinicalCaseSupabase();
  const updateCase = useUpdateClinicalCaseSupabase();
  const deleteCase = useDeleteClinicalCaseSupabase();

  // 고객 케이스 필터링
  const customerCases = useMemo(
    () => allCases.filter((c: any) => c.subject_type === 'customer'),
    [allCases]
  );

  // 로딩 상태 세분화
  const isProfileLoading = profile === undefined && !authLoading;
  const isDataLoading = casesLoading || isProfileLoading || !profile?._id;

  // 본인 케이스를 allCases에서 찾기 - useMemo로 최적화
  const personalCase = useMemo(
    () => allCases.find((c: any) => c.name?.trim() === '본인'),
    [allCases]
  );

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
  const activeCases = customerCases.filter((c: any) => c.status === 'in_progress').length;

  // 케이스 업데이트 핸들러
  const handleCaseUpdate = (caseId: string, updates: any) => {
    if (!profile?._id) {
      toast.error('프로필을 찾을 수 없습니다.');
      return;
    }

    updateCase.mutate({ caseId, updates });
  };

  // 케이스 삭제 핸들러
  const handleCaseDelete = (caseId: string) => {
    if (!profile?._id) {
      toast.error('프로필을 찾을 수 없습니다.');
      return;
    }

    if (confirm('정말로 이 케이스를 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) {
      deleteCase.mutate({ caseId, profileId: profile._id });
    }
  };

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
              type="personal"
              case={personalCase as any} // ✅ 타입 호환성을 위한 assertion
              editableName={false}
              showDelete={false}
              onUpdate={handleCaseUpdate}
              profileId={profile?._id}
            />
          ) : (
            <EmptyState
              title="아직 내 케이스가 없습니다"
              description="첫 번째 임상 케이스를 등록해보세요"
              action={{
                label: createCase.isPending ? '생성 중...' : '내 케이스 등록하기',
                onClick: () => {
                  if (!profile?._id) {
                    toast.error('프로필을 찾을 수 없습니다.');
                    return;
                  }
                  createCase.mutate({
                    name: '본인',
                    profile_id: profile._id,
                    concern_area: '전체적인 피부 관리',
                    treatment_plan: '개인 맞춤 관리',
                    status: 'in_progress',
                    consent_status: 'pending',
                    subject_type: 'self',
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
              {customerCases.map((caseData: any) => (
                <CaseCard
                  key={caseData._id}
                  type="customer"
                  case={caseData as any} // ✅ 타입 호환성을 위한 assertion
                  editableName={true}
                  showDelete={true}
                  onUpdate={handleCaseUpdate}
                  onDelete={handleCaseDelete}
                  profileId={profile?._id}
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
