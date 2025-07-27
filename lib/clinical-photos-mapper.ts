/**
 * Clinical Photos 데이터 매핑 유틸리티
 * Supabase/UI 타입과 Convex 타입 간의 변환을 담당
 */

import { Id } from '@/convex/_generated/dataModel';

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
 */
export const convexToUICase = (convexCase: ConvexClinicalCase): UIClinicalCase => {
  return {
    id: convexCase._id,
    kolId: 0, // TODO: 실제 매핑 필요
    customerId: undefined, // Convex에는 customer_id가 없음
    customerName: convexCase.name,
    caseName: convexCase.case_title || '케이스',
    concernArea: convexCase.concern_area,
    treatmentPlan: convexCase.treatment_plan || convexCase.treatment_item,
    consentReceived: convexCase.consent_status === 'consented',
    consentDate: convexCase.consent_date
      ? new Date(convexCase.consent_date).toISOString()
      : undefined,
    status: mapConvexStatusToUI(convexCase.status),
    createdAt: new Date(convexCase._creationTime || convexCase.created_at).toISOString(),
    updatedAt: new Date(convexCase.updated_at || convexCase._creationTime).toISOString(),
    totalPhotos: convexCase.photo_count || 0,
    consentImageUrl: undefined, // 별도로 조회 필요

    // 메타데이터에서 추출 (없으면 태그에서 추출)
    cureBooster:
      convexCase.metadata?.cureBooster || convexCase.tags?.includes('cure_booster') || false,
    cureMask: convexCase.metadata?.cureMask || convexCase.tags?.includes('cure_mask') || false,
    premiumMask:
      convexCase.metadata?.premiumMask || convexCase.tags?.includes('premium_mask') || false,
    allInOneSerum:
      convexCase.metadata?.allInOneSerum || convexCase.tags?.includes('all_in_one_serum') || false,
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

  return {
    subject_type: 'customer' as const,
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
// ID 변환 유틸리티
// ===================================

/**
 * 숫자 ID를 Convex ID 형식으로 변환 (임시)
 * TODO: 실제 ID 매핑 테이블 필요
 */
export const numberIdToConvexId = (numberId: number): Id<'clinical_cases'> => {
  return `clinical_cases_${numberId}` as Id<'clinical_cases'>;
};

/**
 * Convex ID를 숫자 ID로 변환 (임시)
 * TODO: 실제 ID 매핑 테이블 필요
 */
export const convexIdToNumberId = (convexId: Id<'clinical_cases'>): number => {
  const match = convexId.match(/clinical_cases_(\d+)/);
  return match && match[1] ? parseInt(match[1], 10) : 0;
};

/**
 * ID가 Convex 형식인지 확인
 */
export const isConvexId = (id: string | number): boolean => {
  return typeof id === 'string' && id.includes('_');
};

/**
 * 범용 ID 변환 (string | number → Convex ID)
 */
export const toConvexId = (id: string | number): Id<'clinical_cases'> => {
  if (typeof id === 'string' && isConvexId(id)) {
    return id as Id<'clinical_cases'>;
  }
  if (typeof id === 'number') {
    return numberIdToConvexId(id);
  }
  // 문자열이지만 Convex ID가 아닌 경우 (숫자 문자열)
  const numId = parseInt(id as string, 10);
  if (!isNaN(numId)) {
    return numberIdToConvexId(numId);
  }
  // 기본값
  return id as Id<'clinical_cases'>;
};
