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

// ✅ 백엔드와 완전히 일치하는 케이스 상태 타입
export type CaseStatus =
  | 'active' // 프론트엔드에서 주로 사용 (백엔드 'in_progress'와 매핑)
  | 'in_progress' // 백엔드 원래 상태
  | 'completed'
  | 'paused'
  | 'cancelled'
  | 'archived'; // 프론트엔드에서 사용

// 사진 슬롯 타입 (백엔드 clinical_photos 테이블과 매핑)
export interface PhotoSlot {
  id: string;
  roundDay: number;
  angle: 'front' | 'left_side' | 'right_side'; // 백엔드 photo_type과 일치
  imageUrl?: string;
  url?: string | null;
  session_number?: number;
  uploaded: boolean;
  photoId?: string;
}

// ✅ Convex 백엔드와 완전 호환되는 케이스 데이터 타입
export interface ClinicalCase {
  // 🔴 Convex 필수 필드들
  _id?: string; // Convex ID
  shop_id?: string; // Convex profiles 참조
  subject_type?: 'self' | 'customer'; // Convex 정의와 일치
  name?: string; // Convex name 필드
  status: CaseStatus; // 확장된 상태 타입
  consent_status?: 'no_consent' | 'consented' | 'pending'; // Convex 정의와 일치
  created_at?: number; // Convex 타임스탬프 (number)
  updated_at?: number; // Convex 타임스탬프 (number)

  // 🔵 Convex 선택적 필드들
  case_title?: string;
  concern_area?: string;
  treatment_plan?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  treatment_item?: string;
  start_date?: number;
  end_date?: number;
  total_sessions?: number;
  consent_date?: number;
  marketing_consent?: boolean;
  notes?: string;
  tags?: string[];
  custom_fields?: any;
  photo_count?: number;
  latest_session?: number;
  created_by?: string;

  // 🟢 프론트엔드 호환성 필드들 (Convex 스키마에 추가됨)
  customerName?: string; // name과 동일, 프론트엔드에서 주로 사용
  consentReceived?: boolean; // consent_status 기반 boolean 변환
  is_personal?: boolean; // subject_type === 'self' 또는 name === '본인'
  createdAt?: string; // created_at의 ISO string 버전
  updatedAt?: string; // updated_at의 ISO string 버전

  // 🟡 제품 사용 체크박스 필드들 (Convex 스키마에 추가됨)
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;

  // 🟡 피부 타입 체크박스 필드들 (Convex 스키마에 추가됨)
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;

  // 🔵 메타데이터 (Convex 스키마 구조와 일치)
  metadata?: {
    rounds?: Record<string, RoundCustomerInfo>;
    customFields?: any;
    roundInfo?: any; // 하위 호환성
    roundCustomerInfo?: any; // 하위 호환성
  };

  // 🔴 하위 호환성을 위한 레거시 필드들 (점진적 제거 예정)
  id?: string; // _id의 별칭
  customerInfo?: CustomerInfo; // 레거시 구조
  roundCustomerInfo?: { [roundDay: number]: RoundCustomerInfo }; // 레거시 구조
  photos?: PhotoSlot[]; // 실제로는 별도 쿼리로 조회
  consentImageUrl?: string; // 동의서 파일 URL (별도 테이블)
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
