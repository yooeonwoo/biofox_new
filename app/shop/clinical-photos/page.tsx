'use client';

import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
// import { fetchCases, ClinicalCase } from "@/lib/clinical-photos"; // 임시로 주석 처리

// 임시 타입 정의
interface ClinicalCase {
  id: string;
  customerName: string;
  caseName: string;
  status: string;
  createdAt: string;
}

interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

// 임시 모킹 데이터
const mockCases: ClinicalCase[] = [
  {
    id: '1',
    customerName: '본인',
    caseName: '보톡스 이마',
    status: 'completed',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    customerName: '본인',
    caseName: '필러 팔자주름',
    status: 'in_progress',
    createdAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '3',
    customerName: '김고객',
    caseName: '리프팅',
    status: 'completed',
    createdAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '4',
    customerName: '이고객',
    caseName: '스킨부스터',
    status: 'in_progress',
    createdAt: '2024-01-25T00:00:00Z',
  },
];

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
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/signin');
    }
  }, [authUser, authLoading, router]);

  // 케이스 목록 조회 (모킹)
  useEffect(() => {
    const loadCases = async () => {
      if (!profile) return;
      setCasesLoading(true);
      try {
        // 실제 API 호출 대신 모킹 데이터 사용
        // const casesData = await fetchCases();
        // setCases(casesData);

        // 로딩 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCases(mockCases);
        console.log('Shop 임상사진: 모킹 데이터 로드 완료');
      } catch (error) {
        console.error('임상사진: 케이스 로드 실패:', error);
        // 에러 발생시에도 빈 배열로 설정하여 UI는 정상 작동
        setCases([]);
      } finally {
        setCasesLoading(false);
      }
    };
    loadCases();
  }, [profile]);

  const personalCases = cases.filter(c => c.customerName === '본인');
  const customerCases = cases.filter(c => c.customerName !== '본인');

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

  if (authLoading || !profile) {
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
                <Link href="/shop/clinical-photos/upload/personal">
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
                <Link href="/shop/clinical-photos/upload/customer">
                  <Plus className="mr-2 h-4 w-4" />
                  업로드하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 케이스 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">최근 케이스</CardTitle>
          <CardDescription>최근에 등록된 임상사진 케이스들</CardDescription>
        </CardHeader>
        <CardContent>
          {casesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-gray-500">로딩 중...</div>
            </div>
          ) : cases.length > 0 ? (
            <div className="space-y-3">
              {cases.map(case_ => (
                <div
                  key={case_.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{case_.customerName}</h4>
                    <p className="text-sm text-gray-500">{case_.caseName}</p>
                    <p className="text-xs text-gray-400">
                      생성일: {new Date(case_.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={case_.status === 'completed' ? 'default' : 'secondary'}>
                      {case_.status === 'completed' ? '완료' : '진행중'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Plus className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">등록된 케이스가 없습니다</h3>
              <p className="mb-4 text-gray-500">첫 번째 임상사진 케이스를 등록해보세요</p>
              <Button asChild>
                <Link href="/shop/clinical-photos/upload">케이스 등록하기</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
