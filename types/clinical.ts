// 시스템 상수 정의
export const SYSTEM_OPTIONS = {
  genders: [
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
    { value: 'other', label: '기타' },
  ] as const,

  treatmentTypes: [
    { value: '10GF', label: '10GF 마이크로젯 케어' },
    { value: 'realafter', label: '리얼에프터 케어' },
  ] as const,

  products: [
    { value: 'cure_booster', label: '큐어 부스터' },
    { value: 'cure_mask', label: '큐어 마스크' },
    { value: 'premium_mask', label: '프리미엄 마스크' },
    { value: 'all_in_one_serum', label: '올인원 세럼' },
  ] as const,

  skinTypes: [
    { value: 'red_sensitive', label: '붉고 예민함' },
    { value: 'pigment', label: '색소 / 미백' },
    { value: 'pore', label: '모공 늘어짐' },
    { value: 'acne_trouble', label: '트러블 / 여드름' },
    { value: 'wrinkle', label: '주름 / 탄력' },
    { value: 'other', label: '기타' },
  ] as const,
} as const;

// ✅ 백엔드와 완전히 일치하는 케이스 상태 타입
export type CaseStatus =
  | 'active' // 프론트엔드에서 주로 사용 (백엔드 'in_progress'와 매핑)
  | 'in_progress' // 백엔드 원래 상태
  | 'completed'
  | 'paused'
  | 'cancelled'
  | 'archived'; // 프론트엔드에서 사용

// 🔧 angle 타입을 백엔드와 통일
export type PhotoAngle = 'front' | 'left_side' | 'right_side'; // 백엔드 기준
export type PhotoAngleSimple = 'front' | 'left' | 'right'; // 프론트엔드 편의용

// 사진 슬롯 타입 (백엔드 clinical_photos 테이블과 매핑)
export interface PhotoSlot {
  id: string;
  roundDay?: number; // ✅ optional로 변경 - 실제 데이터에서 undefined일 수 있음
  angle: PhotoAngle; // 백엔드 기준 타입 사용
  imageUrl?: string;
  url?: string | null;
  session_number?: number;
  uploaded: boolean;
  photoId?: string;
}

// 🔧 고객 정보 타입 정의
export interface CustomerInfo {
  name?: string; // ✅ optional로 변경 - 실제 사용에서 항상 필요하지 않음
  age?: number;
  gender?: 'male' | 'female' | 'other';
  treatmentType?: string;
  products?: string[]; // ✅ optional로 변경 - 코드에서 기본값 사용
  skinTypes?: string[]; // ✅ optional로 변경 - 코드에서 기본값 사용
  memo?: string;
  date?: string; // ✅ 추가: 날짜 필드 (Input type="date"와 맞춤, optional로)
}

// 새로 정의: 회차별 info 전용 인터페이스
export interface RoundInfo {
  products?: string[]; // optional 배열
  skinTypes?: string[]; // optional 배열
  memo?: string;
  date?: string; // treatmentDate 등
  treatmentType?: string; // 회차별 치료 타입
  name?: string; // 회차별 고객명 (필요시)
  age?: number; // 회차별 나이 (필요시)
  gender?: 'male' | 'female' | 'other'; // 회차별 성별 (필요시)
}

// RoundCustomerInfo 재정의: number 키로 제한
export interface RoundCustomerInfo {
  [key: number]: RoundInfo; // number 키 + RoundInfo 값
}

// ✅ Convex 백엔드와 완전 호환되는 케이스 데이터 타입
export interface ClinicalCase {
  // 🔴 Convex 필수 필드들
  _id?: string; // Convex ID
  id: string; // ✅ 필수 필드로 변경 - 대부분 코드에서 필수로 사용
  shop_id?: string; // Convex profiles 참조
  subject_type?: 'self' | 'customer'; // Convex 정의와 일치
  name?: string; // Convex name 필드
  status: CaseStatus; // 확장된 상태 타입
  consent_status?: 'no_consent' | 'consented' | 'pending';

  // 🟡 기본 정보 필드들
  case_title?: string;
  concern_area?: string;
  treatment_plan?: string; // 백엔드와 일치
  gender?: 'male' | 'female' | 'other';
  age?: number;
  consent_date?: number;
  marketing_consent?: boolean;
  notes?: string;
  tags?: string[];
  metadata?: any;

  // ✅ 프론트엔드 호환성 필드들 (모두 선택적)
  customerName?: string; // name과 동일
  caseName?: string; // case_title과 동일
  caseTitle?: string; // ✅ 추가: lib/clinical-photos-hooks.ts:42에서 사용
  concernArea?: string; // camelCase 버전
  treatmentPlan?: string; // camelCase 버전 (이제 백엔드에서 지원)
  consentReceived?: boolean; // boolean 버전
  is_personal?: boolean; // subject_type 기반
  createdAt?: string; // created_at의 string 버전
  updatedAt?: string; // updated_at의 string 버전

  // 🟢 제품 체크박스 필드들
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;

  // 🟢 피부타입 체크박스 필드들 (기존)
  skinRedness?: boolean;
  skinDryness?: boolean;
  skinSensitivity?: boolean;
  skinAging?: boolean;
  skinAcne?: boolean;

  // 🟢 피부타입 체크박스 필드들 (추가) - hooks/useCustomerCaseHandlers.ts에서 사용
  skinRedSensitive?: boolean; // ✅ 추가
  skinPigment?: boolean; // ✅ 추가
  skinPore?: boolean; // ✅ 추가
  skinTrouble?: boolean; // ✅ 추가
  skinWrinkle?: boolean; // ✅ 추가
  skinEtc?: boolean; // ✅ 추가

  // 🔴 관계형 데이터 필드들
  photos?: PhotoSlot[];
  customerInfo?: CustomerInfo; // 고객 정보
  roundCustomerInfo?: RoundCustomerInfo; // 회차별 고객 정보
  roundInfo?: any; // 회차별 추가 정보

  // 🔴 통계 필드들
  photo_count?: number; // ✅ 추가: lib/clinical-photos-hooks.ts:158에서 사용
  total_sessions?: number; // ✅ 추가: lib/clinical-photos-hooks.ts:159에서 사용

  // 🟡 시간 필드들
  created_at?: number;
  updated_at?: number;

  // 🟡 기타 필드들
  consentImageUrl?: string;
  rounds?: Record<string, RoundCustomerInfo>;
  customFields?: any;
}

// UI용 Clinical Case 타입 (Convex 데이터 구조)
export interface UIClinicalCase {
  _id?: string; // Convex ID
  id?: string | number; // 기존 ID
  name: string;
  photos?: Array<{
    id: string;
    url?: string;
    session?: number;
  }>;
  rounded?: boolean;
  tags?: string[];
  round?: number;
  customer?: string;
  status?: string;
  createdAt?: string;
  consentReceived?: boolean;
  consentImageUrl?: string;
  customerName?: string;
  treatmentPlan?: string;
}

// KOL 정보 타입
export interface KolInfo {
  id: number;
  name: string;
  shopName: string;
  email: string;
  phone: string;
  imageUrl?: string;
  region?: string;
}

// 문자열 혹은 JSON 문자열/배열을 안전하게 string[]로 변환하는 유틸리티 함수
export function safeParseStringArray(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input as string[];
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // JSON.parse 실패 – fallback 처리
    }
    return input
      .split(/[;,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  return [];
}

// 🔧 angle 변환 유틸리티 함수들
export const convertAngleToBackend = (angle: PhotoAngleSimple): PhotoAngle => {
  const mapping: Record<PhotoAngleSimple, PhotoAngle> = {
    front: 'front',
    left: 'left_side',
    right: 'right_side',
  };
  return mapping[angle];
};

export const convertAngleToFrontend = (angle: PhotoAngle): PhotoAngleSimple => {
  const mapping: Record<PhotoAngle, PhotoAngleSimple> = {
    front: 'front',
    left_side: 'left',
    right_side: 'right',
  };
  return mapping[angle];
};
