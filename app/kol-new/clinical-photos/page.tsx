'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useClinicalCases,
  useEnsurePersonalCase,
  useCustomerCases,
  ClinicalCase,
} from '@/lib/clinical-photos-convex';

interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

// 체크 아이템 컴포넌트
interface CheckItemProps {
  label: string;
  checked?: boolean;
}

const CheckItem: React.FC<CheckItemProps> = ({ label, checked }) => {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${checked ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}
    >
      {checked && <Check size={12} className="text-blue-600" />}
      <span>{label}</span>
    </div>
  );
};

// 플레이어 제품 체크박스 컴포넌트
interface PlayerProductsProps {
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;
}

const PlayerProducts: React.FC<PlayerProductsProps> = ({
  cureBooster,
  cureMask,
  premiumMask,
  allInOneSerum,
}) => {
  return (
    <div className="mt-2">
      <div className="mb-1 text-xs font-medium text-gray-500">플레이어 제품</div>
      <div className="flex flex-wrap gap-1">
        <CheckItem label="큐어 부스터" checked={cureBooster} />
        <CheckItem label="큐어 마스크" checked={cureMask} />
        <CheckItem label="프리미엄 마스크" checked={premiumMask} />
        <CheckItem label="올인원 세럼" checked={allInOneSerum} />
      </div>
    </div>
  );
};

// 고객 피부타입 체크박스 컴포넌트
interface SkinTypesProps {
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
}

const SkinTypes: React.FC<SkinTypesProps> = ({
  skinRedSensitive,
  skinPigment,
  skinPore,
  skinTrouble,
  skinWrinkle,
  skinEtc,
}) => {
  return (
    <div className="mt-2">
      <div className="mb-1 text-xs font-medium text-gray-500">고객 피부타입</div>
      <div className="flex flex-wrap gap-1">
        <CheckItem label="붉고 예민함" checked={skinRedSensitive} />
        <CheckItem label="색소/피멘" checked={skinPigment} />
        <CheckItem label="모공 늘어짐" checked={skinPore} />
        <CheckItem label="트러블/여드름" checked={skinTrouble} />
        <CheckItem label="주름/탄력" checked={skinWrinkle} />
        <CheckItem label="기타" checked={skinEtc} />
      </div>
    </div>
  );
};

export default function ClinicalPhotosPage() {
  // 임시 사용자 정보 (로컬 개발용)
  const tempUser = {
    isLoaded: true,
    isSignedIn: true,
    role: 'kol',
    publicMetadata: { role: 'kol' },
  };

  const [isKol, setIsKol] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Convex 훅 사용
  const { data: allCases = [], isLoading: casesLoading } = useClinicalCases();
  const { personalCase, ensurePersonalCaseExists } = useEnsurePersonalCase();
  const { data: customerCases = [] } = useCustomerCases();

  // 사용자 역할 확인
  useEffect(() => {
    if (tempUser.isLoaded && tempUser.isSignedIn) {
      const userRole = (tempUser.publicMetadata?.role as string) || 'kol';
      setIsKol(userRole === 'kol' || userRole === 'test');
      setLoading(false);
    }
  }, []);

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

  if (!tempUser.isLoaded || isKol === null || loading) {
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

  if (!isKol) {
    return redirect('/');
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
                  업로드하기
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
