'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useClinicalCasesConvex,
  useCustomerCasesConvex,
  useCreateClinicalCaseConvex,
} from '@/lib/clinical-photos-hooks';
import { useAuth } from '@/hooks/useAuth';
import type { ClinicalCase } from '@/types/clinical';

interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

export default function ClinicalPhotosPage() {
  const router = useRouter();

  // 실제 인증 정보 사용
  const { isAuthenticated, isLoading: authLoading, profile, role } = useAuth();
  const [isKol, setIsKol] = useState<boolean | null>(null);

  // Convex 훅 사용 - profile이 없으면 빈 결과 반환
  const { data: allCases = [], isLoading: casesLoading } = useClinicalCasesConvex(
    profile?._id,
    undefined
  );
  const createCase = useCreateClinicalCaseConvex();
  const { data: customerCases = [] } = useCustomerCasesConvex(profile?._id);

  // profile이 없을 때를 위한 early return 처리
  const isProfileLoading = authLoading || !profile;
  // 본인 케이스를 allCases에서 직접 찾기 (별도 state 사용하지 않음)
  const personalCase = allCases.find(c => c.customerName?.trim() === '본인');

  // 사용자 역할 확인
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      const userRole = profile.role || role;
      setIsKol(userRole === 'kol' || userRole === 'admin' || userRole === 'test');
    }
  }, [authLoading, isAuthenticated, profile, role]);

  // 개인 케이스 배열 형태로 변환 (기존 로직 호환성)
  const personalCases = personalCase ? [personalCase] : [];

  const personalProgress =
    personalCases.length > 0
      ? Math.round(
          (personalCases.filter(c => c.status === 'completed').length / personalCases.length) * 100
        )
      : 0;

  const customerProgress =
    customerCases.length > 0
      ? Math.round(
          (customerCases.filter(c => c.status === 'completed').length / customerCases.length) * 100
        )
      : 0;

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  // KOL이 아닌 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!authLoading && isKol === false) {
      router.push('/');
    }
  }, [authLoading, isKol, router]);

  if (isProfileLoading || isKol === null || casesLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              임상사진 페이지를 준비하는 중입니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">임상사진 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">관리 전후 사진을 체계적으로 관리하세요</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 본인 임상 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">본인 임상</CardTitle>
            <CardDescription>내 관리 기록</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span className="font-medium">{casesLoading ? '-' : `${personalProgress}%`}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${personalProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {casesLoading ? '로딩 중...' : `${personalCases.length}개 케이스`}
                </p>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/kol-new/clinical-photos/upload/personal">
                  <Plus className="mr-2 h-4 w-4" />
                  {personalCase ? '업로드하기' : '케이스 생성하기'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 고객 임상 카드 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">고객 임상</CardTitle>
            <CardDescription>고객 관리 기록</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span className="font-medium">{casesLoading ? '-' : `${customerProgress}%`}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: `${customerProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {casesLoading ? '로딩 중...' : `${customerCases.length}개 케이스`}
                </p>
              </div>
              <Button asChild size="sm" className="w-full">
                <Link href="/kol-new/clinical-photos/upload/customer">
                  <Plus className="mr-2 h-4 w-4" />
                  업로드하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
