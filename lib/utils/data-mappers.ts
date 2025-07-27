/**
 * 데이터 매핑 유틸리티
 * Convex 데이터 구조를 UI 컴포넌트 요구사항에 맞게 변환
 */

import { Id } from '@/convex/_generated/dataModel';

// ================================
// 타입 정의
// ================================

// Convex에서 가져온 매장 데이터 (관계형 데이터 포함)
export interface ConvexShopDetail {
  // profiles 테이블 기본 필드
  _id: Id<'profiles'>;
  userId: Id<'users'>;
  email: string;
  name: string; // 대표자명
  role: 'shop_owner';
  status: 'pending' | 'approved' | 'rejected';
  shop_name: string;
  region?: string;
  naver_place_link?: string;
  commission_rate?: number;
  approved_at?: number;
  approved_by?: Id<'profiles'>;
  created_at: number;
  updated_at: number;

  // 관계형 데이터 (조인된 데이터)
  kolName?: string; // 상위 KOL/OL 이름
  kolId?: Id<'profiles'>; // 상위 KOL/OL ID
  deviceCount?: number; // 총 디바이스 판매 수량
  contractDate?: string; // 관계 시작일을 계약일로 사용
  lastAllocation?: number; // 최근 디바이스 판매일

  // 추가 통계 데이터
  totalSales?: number;
  totalCommission?: number;
  activeRelationships?: number;
}

// Allocation (디바이스 판매) 데이터
export interface ConvexAllocation {
  _id: Id<'device_sales'>;
  shop_id: Id<'profiles'>;
  sale_date: number;
  device_name?: string;
  quantity: number;
  tier_at_sale: 'tier_1_4' | 'tier_5_plus';
  standard_commission: number;
  actual_commission: number;
  commission_status?: 'calculated' | 'adjusted' | 'paid' | 'cancelled';
  notes?: string;
  created_at: number;
}

// UI에서 기대하는 매장 상세 데이터 구조
export interface UIShopDetail {
  // 기본 정보
  id: number; // 호환성을 위한 number ID
  shop_name: string;
  status: string;
  kol_name: string | null;
  owner_name: string | null;
  region: string | null;
  contract_date: string | null; // ISO date string
  device_cnt: number;
  smart_place_link?: string;

  // 추가 메타데이터
  _convexId?: Id<'profiles'>; // 실제 Convex ID 보관
  totalSales?: number;
  totalCommission?: number;
}

// UI에서 기대하는 할당 데이터 구조
export interface UIAllocationRow {
  id: number; // 호환성을 위한 number ID
  allocated_at: string; // ISO date string
  tier_fixed_amount: number;
  user_input_deduct: number;
  pay_to_kol: number;
  note: string | null;

  // 추가 메타데이터
  _convexId?: Id<'device_sales'>; // 실제 Convex ID 보관
  device_name?: string;
  quantity?: number;
  tier?: 'tier_1_4' | 'tier_5_plus';
}

// ================================
// ID 변환 유틸리티
// ================================

/**
 * Convex 문자열 ID를 호환성을 위한 숫자 ID로 변환
 */
export const convexIdToNumber = (convexId: string): number => {
  // 문자열 해시를 이용한 일관된 숫자 변환
  let hash = 0;
  for (let i = 0; i < convexId.length; i++) {
    const char = convexId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash);
};

/**
 * 숫자 ID를 다시 Convex ID 포맷으로 변환 (역변환은 불가능하므로 매핑 테이블 필요)
 */
export const numberToConvexId = (numberId: number, convexId: Id<any>): Id<any> => {
  // 실제로는 원본 Convex ID를 보관해야 함
  return convexId;
};

// ================================
// 데이터 매핑 함수들
// ================================

/**
 * Convex 매장 데이터를 UI 호환 형식으로 변환
 */
export const mapShopDetailData = (shopData: ConvexShopDetail): UIShopDetail => {
  // 안전한 기본값 처리
  const shopName = shopData.shop_name || '매장명 없음';
  const ownerName = shopData.name || null;
  const region = shopData.region || null;
  const kolName = shopData.kolName || null;
  const deviceCount = shopData.deviceCount || 0;

  // 계약일 처리 (관계 시작일을 계약일로 사용)
  let contractDate: string | null = null;
  if (shopData.contractDate) {
    try {
      contractDate = shopData.contractDate;
    } catch (error) {
      console.warn('Invalid contract date:', shopData.contractDate);
      contractDate = null;
    }
  }

  // 상태 매핑
  const statusMap: Record<string, string> = {
    pending: 'pending',
    approved: 'active',
    rejected: 'inactive',
  };
  const status = statusMap[shopData.status] || shopData.status;

  return {
    id: convexIdToNumber(shopData._id),
    shop_name: shopName,
    status: status,
    kol_name: kolName,
    owner_name: ownerName,
    region: region,
    contract_date: contractDate,
    device_cnt: deviceCount,
    smart_place_link: shopData.naver_place_link,

    // 메타데이터 보관
    _convexId: shopData._id,
    totalSales: shopData.totalSales || 0,
    totalCommission: shopData.totalCommission || 0,
  };
};

/**
 * Convex 할당(디바이스 판매) 데이터를 UI 호환 형식으로 변환
 */
export const mapAllocationData = (allocationData: ConvexAllocation): UIAllocationRow => {
  // 날짜 변환
  const allocatedAt = new Date(allocationData.sale_date).toISOString();

  // 수수료 계산
  const tierFixedAmount = allocationData.standard_commission;
  const userInputDeduct = Math.max(
    0,
    allocationData.standard_commission - allocationData.actual_commission
  );
  const payToKol = allocationData.actual_commission;

  return {
    id: convexIdToNumber(allocationData._id),
    allocated_at: allocatedAt,
    tier_fixed_amount: tierFixedAmount,
    user_input_deduct: userInputDeduct,
    pay_to_kol: payToKol,
    note: allocationData.notes || null,

    // 메타데이터 보관
    _convexId: allocationData._id,
    device_name: allocationData.device_name,
    quantity: allocationData.quantity,
    tier: allocationData.tier_at_sale,
  };
};

/**
 * 배치 매핑: 여러 할당 데이터를 한 번에 변환
 */
export const mapAllocationsBatch = (allocations: ConvexAllocation[]): UIAllocationRow[] => {
  return allocations.map(mapAllocationData);
};

/**
 * 역방향 매핑: UI 데이터를 Convex 형식으로 변환 (업데이트 시 사용)
 */
export const mapUIToConvexShop = (uiData: Partial<UIShopDetail>): Partial<ConvexShopDetail> => {
  const result: Partial<ConvexShopDetail> = {};

  if (uiData.shop_name !== undefined) result.shop_name = uiData.shop_name;
  if (uiData.owner_name !== undefined) result.name = uiData.owner_name || undefined;
  if (uiData.region !== undefined) result.region = uiData.region || undefined;
  if (uiData.smart_place_link !== undefined)
    result.naver_place_link = uiData.smart_place_link || undefined;

  // 상태 역매핑
  if (uiData.status !== undefined) {
    const reverseStatusMap: Record<string, 'pending' | 'approved' | 'rejected'> = {
      pending: 'pending',
      active: 'approved',
      inactive: 'rejected',
    };
    result.status = reverseStatusMap[uiData.status] || 'pending';
  }

  return result;
};

// ================================
// 데이터 검증 함수들
// ================================

/**
 * 매장 데이터 완정성 검증
 */
export const validateShopData = (
  shopData: ConvexShopDetail
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!shopData.shop_name || shopData.shop_name.trim().length === 0) {
    errors.push('매장명이 필요합니다');
  }

  if (!shopData.name || shopData.name.trim().length === 0) {
    errors.push('대표자명이 필요합니다');
  }

  if (!shopData.email || !shopData.email.includes('@')) {
    errors.push('유효한 이메일이 필요합니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 할당 데이터 검증
 */
export const validateAllocationData = (
  allocationData: ConvexAllocation
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!allocationData.sale_date || allocationData.sale_date <= 0) {
    errors.push('유효한 판매일이 필요합니다');
  }

  if (!allocationData.quantity || allocationData.quantity <= 0) {
    errors.push('수량은 0보다 커야 합니다');
  }

  if (allocationData.actual_commission < 0) {
    errors.push('실제 수수료는 음수일 수 없습니다');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ================================
// 에러 처리 유틸리티
// ================================

/**
 * 안전한 데이터 매핑 (에러 발생 시 기본값 반환)
 */
export const safeMapShopDetailData = (shopData: any): UIShopDetail | null => {
  try {
    // 필수 필드 확인
    if (!shopData || !shopData._id) {
      console.error('Invalid shop data: missing _id');
      return null;
    }

    return mapShopDetailData(shopData as ConvexShopDetail);
  } catch (error) {
    console.error('Error mapping shop detail data:', error);
    return null;
  }
};

/**
 * 안전한 할당 데이터 배치 매핑
 */
export const safeMapAllocationsBatch = (allocations: any[]): UIAllocationRow[] => {
  if (!Array.isArray(allocations)) {
    console.error('Invalid allocations data: not an array');
    return [];
  }

  return allocations
    .map((allocation, index) => {
      try {
        return mapAllocationData(allocation as ConvexAllocation);
      } catch (error) {
        console.error(`Error mapping allocation at index ${index}:`, error);
        return null;
      }
    })
    .filter((item): item is UIAllocationRow => item !== null);
};
