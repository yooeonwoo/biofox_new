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

// 고객 정보 관련 타입
export interface CustomerInfo {
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  treatmentType?: string;
  products: string[];
  skinTypes: string[];
  memo?: string;
}

// 회차별 고객 정보 타입
export interface RoundCustomerInfo {
  age?: number;
  gender?: 'male' | 'female' | 'other';
  treatmentType?: string;
  products: string[];
  skinTypes: string[];
  memo?: string;
  date?: string; // 회차별 날짜
}

// 케이스 상태 타입
export type CaseStatus =
  | 'active'
  | 'completed'
  | 'archived'
  | 'cancelled'
  | 'in_progress'
  | 'paused';

// 사진 슬롯 타입
export interface PhotoSlot {
  id: string;
  roundDay: number;
  angle: 'front' | 'left' | 'right';
  imageUrl?: string;
  url?: string | null; // null 가능성 명시 (일부 컴포넌트에서 사용)
  session_number?: number; // 세션 번호 (일부 컴포넌트에서 사용)
  uploaded: boolean;
  photoId?: string; // Convex photo ID
}

// 케이스 데이터 타입
export interface ClinicalCase {
  id: string;
  _id?: string; // Convex ID 추가
  name?: string; // Convex 케이스에서 사용하는 name 필드 추가
  customerName: string;
  status: CaseStatus;
  createdAt: string;
  created_at?: number; // Convex timestamp
  updated_at?: number; // Convex timestamp
  consentReceived: boolean;
  consent_status?: 'no_consent' | 'consented' | 'pending'; // Convex consent 상태
  consentImageUrl?: string;
  photos: PhotoSlot[];
  customerInfo: CustomerInfo;
  roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo };

  // Convex 스키마 필드들
  shop_id?: string;
  case_title?: string;
  caseTitle?: string; // camelCase 버전 추가
  age?: number;
  gender?: 'male' | 'female' | 'other';
  marketing_consent?: boolean;
  consent_date?: number;
  subject_type?: 'self' | 'customer';
  treatment_item?: string;
  concern_area?: string;
  concernArea?: string; // camelCase 버전 추가
  treatment_plan?: string;
  treatmentPlan?: string; // camelCase 버전 추가
  notes?: string;
  tags?: string[];
  photo_count?: number;
  latest_session?: number;
  start_date?: number;

  // 메타데이터 속성 추가 (일부 컴포넌트에서 필요)
  metadata?: {
    rounded?: boolean;
    tags?: string[];
    [key: string]: any; // 확장 가능한 메타데이터
  };

  // 제품 사용 체크박스
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;

  // 피부 타입 체크박스
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
  is_personal?: boolean;
  total_sessions?: number;
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
