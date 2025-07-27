/**
 * Clinical Photos 데이터 매핑 유틸리티
 * Supabase/UI 타입과 Convex 타입 간의 변환을 담당
 */

import { Id } from '@/convex/_generated/dataModel';
import { ClinicalCase, UIClinicalCase as UICase, PhotoSlot } from '@/types/clinical';

// ===================================
// 타입 정의
// ===================================

/**
 * UI/프론트엔드에서 사용하는 Clinical Case 타입
 */
export interface UIClinicalCase {
  id: string | number; // 레거시 호환성을 위해 둘 다 허용
  kolId: number;
  customerId?: string;
  customerName: string;
  caseName: string;
  concernArea?: string;
  treatmentPlan?: string;
  consentReceived: boolean;
  consentDate?: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  totalPhotos?: number;
  completedRounds?: number;
  consentImageUrl?: string;

  // 제품 선택
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;

  // 피부타입
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
}

/**
 * Convex DB에 저장되는 Clinical Case 타입
 */
export interface ConvexClinicalCase {
  _id: Id<'clinical_cases'>;
  _creationTime: number;
  shop_id: Id<'profiles'>;
  subject_type: 'self' | 'customer';
  name: string;
  case_title?: string;
  concern_area?: string;
  treatment_plan?: string;
  gender?: 'male' | 'female' | 'other';
  age?: number;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  treatment_item?: string;
  start_date?: number;
  end_date?: number;
  total_sessions?: number;
  consent_status: 'no_consent' | 'consented' | 'pending';
  consent_date?: number;
  marketing_consent?: boolean;
  notes?: string;
  tags?: string[];
  metadata?: {
    cureBooster?: boolean;
    cureMask?: boolean;
    premiumMask?: boolean;
    allInOneSerum?: boolean;
    skinRedSensitive?: boolean;
    skinPigment?: boolean;
    skinPore?: boolean;
    skinTrouble?: boolean;
    skinWrinkle?: boolean;
    skinEtc?: boolean;
    customerInfo?: {
      name?: string;
      age?: number;
      gender?: 'male' | 'female' | 'other';
      treatmentType?: string;
      products?: string[];
      skinTypes?: string[];
      memo?: string;
    };
    roundCustomerInfo?: any; // 동적 키를 위해 any 사용
  };
  custom_fields?: any;
  photo_count?: number;
  latest_session?: number;
  created_at: number;
  updated_at: number;
  created_by?: Id<'profiles'>;
}

// ===================================
// 상태 매핑
// ===================================

/**
 * UI 상태를 Convex 상태로 변환
 */
export const mapUIStatusToConvex = (
  uiStatus: 'active' | 'completed' | 'archived'
): 'in_progress' | 'completed' | 'paused' | 'cancelled' => {
  const statusMap: Record<string, 'in_progress' | 'completed' | 'paused' | 'cancelled'> = {
    active: 'in_progress',
    completed: 'completed',
    archived: 'cancelled',
  };
  return statusMap[uiStatus] || 'in_progress';
};

/**
 * Convex 상태를 UI 상태로 변환
 */
export const mapConvexStatusToUI = (
  convexStatus: 'in_progress' | 'completed' | 'paused' | 'cancelled'
): 'active' | 'completed' | 'archived' => {
  const statusMap: Record<string, 'active' | 'completed' | 'archived'> = {
    in_progress: 'active',
    completed: 'completed',
    paused: 'active',
    cancelled: 'archived',
  };
  return statusMap[convexStatus] || 'active';
};

// ===================================
// 데이터 변환 함수
// ===================================

/**
 * Convex Clinical Case를 UI 형식으로 변환
 * 이제 완전한 ClinicalCase 타입을 반환합니다
 */
export const convexToUICase = (convexCase: ConvexClinicalCase): ClinicalCase => {
  // 제품 정보 추출
  const extractProducts = (): string[] => {
    const products: string[] = [];
    if (convexCase.metadata?.cureBooster || convexCase.tags?.includes('cure_booster')) {
      products.push('cure_booster');
    }
    if (convexCase.metadata?.cureMask || convexCase.tags?.includes('cure_mask')) {
      products.push('cure_mask');
    }
    if (convexCase.metadata?.premiumMask || convexCase.tags?.includes('premium_mask')) {
      products.push('premium_mask');
    }
    if (convexCase.metadata?.allInOneSerum || convexCase.tags?.includes('all_in_one_serum')) {
      products.push('all_in_one_serum');
    }
    return products;
  };

  // 피부타입 정보 추출
  const extractSkinTypes = (): string[] => {
    const skinTypes: string[] = [];
    if (convexCase.metadata?.skinRedSensitive || convexCase.tags?.includes('skin_red_sensitive')) {
      skinTypes.push('red_sensitive');
    }
    if (convexCase.metadata?.skinPigment || convexCase.tags?.includes('skin_pigment')) {
      skinTypes.push('pigment');
    }
    if (convexCase.metadata?.skinPore || convexCase.tags?.includes('skin_pore')) {
      skinTypes.push('pore');
    }
    if (convexCase.metadata?.skinTrouble || convexCase.tags?.includes('skin_trouble')) {
      skinTypes.push('acne_trouble');
    }
    if (convexCase.metadata?.skinWrinkle || convexCase.tags?.includes('skin_wrinkle')) {
      skinTypes.push('wrinkle');
    }
    if (convexCase.metadata?.skinEtc || convexCase.tags?.includes('skin_etc')) {
      skinTypes.push('other');
    }
    return skinTypes;
  };

  return {
    // 기본 정보 - Convex ID를 그대로 사용
    id: convexCase._id,
    customerName: convexCase.case_title || convexCase.name, // case_title을 우선 사용
    status: mapConvexStatusToUI(convexCase.status) as 'active' | 'completed' | 'archived',
    createdAt: new Date(convexCase._creationTime || convexCase.created_at).toISOString(),
    consentReceived: convexCase.consent_status === 'consented',
    consentImageUrl: undefined, // TODO: 별도 조회 필요

    // 필수 속성들 - 빈 배열/객체로 초기화
    photos: [], // TODO: 별도 조회 필요

    // 고객 정보
    customerInfo: {
      name: convexCase.metadata?.customerInfo?.name || convexCase.name,
      age: convexCase.metadata?.customerInfo?.age ?? convexCase.age,
      gender: convexCase.metadata?.customerInfo?.gender || convexCase.gender,
      treatmentType:
        convexCase.metadata?.customerInfo?.treatmentType ||
        convexCase.treatment_plan ||
        convexCase.treatment_item ||
        '',
      products: convexCase.metadata?.customerInfo?.products || extractProducts(),
      skinTypes: convexCase.metadata?.customerInfo?.skinTypes || extractSkinTypes(),
      memo: convexCase.metadata?.customerInfo?.memo || convexCase.notes || '',
    },

    // 회차별 정보 초기화
    roundCustomerInfo: convexCase.metadata?.roundCustomerInfo || {},

    // 메타데이터
    metadata: {
      rounded: false,
      tags: convexCase.tags || [],
      ...(convexCase.metadata || {}),
    },

    // 제품 boolean 필드들
    cureBooster:
      convexCase.metadata?.cureBooster || convexCase.tags?.includes('cure_booster') || false,
    cureMask: convexCase.metadata?.cureMask || convexCase.tags?.includes('cure_mask') || false,
    premiumMask:
      convexCase.metadata?.premiumMask || convexCase.tags?.includes('premium_mask') || false,
    allInOneSerum:
      convexCase.metadata?.allInOneSerum || convexCase.tags?.includes('all_in_one_serum') || false,

    // 피부타입 boolean 필드들
    skinRedSensitive:
      convexCase.metadata?.skinRedSensitive ||
      convexCase.tags?.includes('skin_red_sensitive') ||
      false,
    skinPigment:
      convexCase.metadata?.skinPigment || convexCase.tags?.includes('skin_pigment') || false,
    skinPore: convexCase.metadata?.skinPore || convexCase.tags?.includes('skin_pore') || false,
    skinTrouble:
      convexCase.metadata?.skinTrouble || convexCase.tags?.includes('skin_trouble') || false,
    skinWrinkle:
      convexCase.metadata?.skinWrinkle || convexCase.tags?.includes('skin_wrinkle') || false,
    skinEtc: convexCase.metadata?.skinEtc || convexCase.tags?.includes('skin_etc') || false,

    // Convex 스키마와 일치하는 추가 필드들
    treatmentPlan: convexCase.treatment_plan,
    concernArea: convexCase.concern_area,
    caseTitle: convexCase.case_title,
  };
};

/**
 * UI 데이터를 Convex 생성 인자로 변환
 */
export const uiToConvexCreateArgs = (uiData: Partial<UIClinicalCase>) => {
  const tags: string[] = [];
  const metadata: any = {};

  // 제품 태그
  if (uiData.cureBooster) {
    tags.push('cure_booster');
    metadata.cureBooster = true;
  }
  if (uiData.cureMask) {
    tags.push('cure_mask');
    metadata.cureMask = true;
  }
  if (uiData.premiumMask) {
    tags.push('premium_mask');
    metadata.premiumMask = true;
  }
  if (uiData.allInOneSerum) {
    tags.push('all_in_one_serum');
    metadata.allInOneSerum = true;
  }

  // 피부타입 태그
  if (uiData.skinRedSensitive) {
    tags.push('skin_red_sensitive');
    metadata.skinRedSensitive = true;
  }
  if (uiData.skinPigment) {
    tags.push('skin_pigment');
    metadata.skinPigment = true;
  }
  if (uiData.skinPore) {
    tags.push('skin_pore');
    metadata.skinPore = true;
  }
  if (uiData.skinTrouble) {
    tags.push('skin_trouble');
    metadata.skinTrouble = true;
  }
  if (uiData.skinWrinkle) {
    tags.push('skin_wrinkle');
    metadata.skinWrinkle = true;
  }
  if (uiData.skinEtc) {
    tags.push('skin_etc');
    metadata.skinEtc = true;
  }

  // '본인' 케이스인지 확인하여 subject_type 동적 설정
  const subjectType = (uiData.customerName || '').trim() === '본인' ? 'self' : 'customer';

  return {
    subject_type: subjectType as 'self' | 'customer',
    name: uiData.customerName || '',
    case_title: uiData.caseName,
    concern_area: uiData.concernArea,
    treatment_plan: uiData.treatmentPlan,
    treatment_item: uiData.treatmentPlan,
    consent_status: uiData.consentReceived ? ('consented' as const) : ('no_consent' as const),
    consent_date: uiData.consentDate ? new Date(uiData.consentDate).getTime() : undefined,
    tags,
    metadata,
  };
};

// ===================================
// ID 변환 유틸리티 (더 이상 필요하지 않음)
// ===================================

/**
 * Convex는 문자열 ID를 사용하므로 별도 변환 불필요
 */
export const isConvexId = (id: string | number): boolean => {
  return typeof id === 'string';
};

// ===================================
// 새로운 매퍼 함수 (가이드에서 요구하는 함수)
// ===================================

/**
 * 레거시 UI 데이터를 ClinicalCase로 변환하는 헬퍼 함수
 * 주로 마이그레이션이나 하위 호환성을 위해 사용
 */
export function ensureClinicalCaseFormat(data: any): ClinicalCase {
  // 이미 ClinicalCase 형식이면 그대로 반환
  if (data.photos && data.customerInfo && data.roundCustomerInfo) {
    return data as ClinicalCase;
  }

  // Convex 형식이면 convexToUICase 사용
  if (data._id && data._creationTime) {
    return convexToUICase(data as ConvexClinicalCase);
  }

  // 그 외의 경우 최선을 다해 변환
  return {
    id: data.id || data._id || '',
    customerName: data.customerName || data.name || '',
    status: data.status || 'active',
    createdAt: data.createdAt || new Date().toISOString(),
    consentReceived: data.consentReceived || false,
    consentImageUrl: data.consentImageUrl,
    photos: data.photos || [],
    customerInfo: data.customerInfo || {
      name: data.customerName || data.name || '',
      products: [],
      skinTypes: [],
    },
    roundCustomerInfo: data.roundCustomerInfo || {},
    metadata: data.metadata || {},
  };
}
