import { v } from 'convex/values';

/**
 * 데이터 검증 유틸리티 함수들
 * 기존 Supabase의 CHECK 제약조건들을 Convex 함수로 구현
 */

// 📧 이메일 형식 검증
export function validateEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

// 📝 이름 길이 검증 (2자 이상)
export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

// 🏪 매장명 길이 검증 (2자 이상)
export function validateShopName(shopName: string): boolean {
  return shopName.trim().length >= 2;
}

// 🎂 나이 범위 검증 (0-150)
export function validateAge(age: number): boolean {
  return age > 0 && age < 150;
}

// 💰 커미션율 범위 검증 (0-100%)
export function validateCommissionRate(rate: number): boolean {
  return rate >= 0 && rate <= 100;
}

// 💲 가격 양수 검증
export function validatePrice(price: number): boolean {
  return price >= 0;
}

// 📊 수량 0이 아닌 수 검증
export function validateQuantity(quantity: number): boolean {
  return quantity !== 0;
}

// 📞 연락처 형식 검증 (10-15자리 숫자와 하이픈)
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[0-9-]{10,15}$/;
  return phoneRegex.test(phone);
}

// 📅 세션 번호 범위 검증 (0-999)
export function validateSessionNumber(sessionNumber: number): boolean {
  return sessionNumber >= 0 && sessionNumber <= 999;
}

// 📁 파일 크기 양수 검증
export function validateFileSize(fileSize: number): boolean {
  return fileSize > 0;
}

// 💸 총액 범위 검증 (-999,999,999 ~ 999,999,999)
export function validateTotalAmount(amount: number): boolean {
  return amount >= -999999999 && amount <= 999999999;
}

// 🔗 자기 참조 관계 검증
export function validateNoSelfRelationship(
  shopOwnerId: string,
  parentId: string | undefined
): boolean {
  if (!parentId) return true;
  return shopOwnerId !== parentId;
}

// 📆 관계 기간 유효성 검증
export function validateRelationshipPeriod(
  startedAt: number,
  endedAt: number | undefined
): boolean {
  if (!endedAt) return true;
  return endedAt > startedAt;
}

// 🚫 종료된 관계 활성 상태 검증
export function validateEndedRelationshipNotActive(
  endedAt: number | undefined,
  isActive: boolean
): boolean {
  if (endedAt && isActive) return false;
  return true;
}

// 📊 디바이스 수수료 계산 검증
export function validateDeviceCommission(
  standardCommission: number,
  actualCommission: number
): boolean {
  // 실제 수수료가 표준 수수료와 합리적 범위 내에 있는지 검증
  const difference = Math.abs(actualCommission - standardCommission);
  const tolerance = standardCommission * 0.5; // 50% 허용 오차
  return difference <= tolerance;
}

// 📅 월초 날짜 검증 (수수료 계산용)
export function validateCalculationMonth(timestamp: number): boolean {
  const date = new Date(timestamp);
  return date.getDate() === 1; // 월초인지 확인
}

// 📋 필수 필드 검증
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields as string[],
  };
}

// 🎯 역할별 권한 검증
export function validateRolePermissions(
  userRole: 'admin' | 'kol' | 'ol' | 'shop_owner',
  targetRole: 'admin' | 'kol' | 'ol' | 'shop_owner',
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  // 관리자는 모든 권한 보유
  if (userRole === 'admin') return true;

  // KOL은 자신의 하위 shop_owner만 관리 가능
  if (userRole === 'kol') {
    if (targetRole === 'shop_owner') return true;
    if (targetRole === 'kol' && action === 'read') return true;
    return false;
  }

  // OL과 shop_owner는 자신의 데이터만 관리 가능
  if (userRole === 'ol' || userRole === 'shop_owner') {
    if (action === 'read') return true;
    return false;
  }

  return false;
}

// 📈 CRM 단계 유효성 검증
export function validateCrmStage(stageNumber: number): boolean {
  return stageNumber >= 1 && stageNumber <= 10;
}

// 🏥 임상 케이스 상태 전환 검증
export function validateClinicalStatusTransition(
  currentStatus: 'in_progress' | 'completed' | 'paused' | 'cancelled',
  newStatus: 'in_progress' | 'completed' | 'paused' | 'cancelled'
): boolean {
  // 완료된 케이스는 상태 변경 불가
  if (currentStatus === 'completed') return false;

  // 취소된 케이스는 상태 변경 불가
  if (currentStatus === 'cancelled') return false;

  // 유효한 상태 전환
  const validTransitions: Record<string, string[]> = {
    in_progress: ['completed', 'paused', 'cancelled'],
    paused: ['in_progress', 'cancelled'],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// 💊 알림 만료 시간 검증
export function validateNotificationExpiry(
  createdAt: number,
  expiresAt: number | undefined
): boolean {
  if (!expiresAt) return true;
  return expiresAt > createdAt;
}

// 🔄 감사 로그 변경 필드 검증
export function validateAuditLogFields(
  action: 'INSERT' | 'UPDATE' | 'DELETE',
  oldValues: any,
  newValues: any,
  changedFields: string[]
): boolean {
  if (action === 'INSERT') {
    return !oldValues && newValues && changedFields.length === 0;
  }

  if (action === 'DELETE') {
    return oldValues && !newValues && changedFields.length === 0;
  }

  if (action === 'UPDATE') {
    return oldValues && newValues && changedFields.length > 0;
  }

  return false;
}

/**
 * 종합 데이터 검증 함수들
 */

// 👤 프로필 생성 시 종합 검증
export function validateProfileCreation(data: {
  email: string;
  name: string;
  shop_name: string;
  commission_rate?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!validateName(data.name)) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!validateShopName(data.shop_name)) {
    errors.push('Shop name must be at least 2 characters long');
  }

  if (data.commission_rate !== undefined && !validateCommissionRate(data.commission_rate)) {
    errors.push('Commission rate must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 📦 주문 생성 시 종합 검증
export function validateOrderCreation(data: {
  total_amount: number;
  commission_rate?: number;
  order_date: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateTotalAmount(data.total_amount)) {
    errors.push('Total amount is out of valid range');
  }

  if (data.commission_rate !== undefined && !validateCommissionRate(data.commission_rate)) {
    errors.push('Commission rate must be between 0 and 100');
  }

  // 미래 날짜 검증
  if (data.order_date > Date.now()) {
    errors.push('Order date cannot be in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// 🏥 임상 케이스 생성 시 종합 검증
export function validateClinicalCaseCreation(data: {
  name: string;
  age?: number;
  total_sessions?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateName(data.name)) {
    errors.push('Patient name must be at least 2 characters long');
  }

  if (data.age !== undefined && !validateAge(data.age)) {
    errors.push('Age must be between 0 and 150');
  }

  if (data.total_sessions !== undefined && data.total_sessions < 0) {
    errors.push('Total sessions must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
