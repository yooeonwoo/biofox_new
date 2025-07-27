/**
 * Convex API 공통 유틸리티 함수들
 * 에러 핸들링, 검증, 권한 확인 등을 위한 공통 함수들
 */

import { Auth } from 'convex/server';
import { GenericQueryCtx, GenericMutationCtx } from 'convex/server';
import { DataModel } from './_generated/dataModel';

// Convex 컨텍스트 타입 정의
type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * 표준화된 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 에러 코드 상수
 */
export const ERROR_CODES = {
  // 인증/권한 관련
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // 검증 관련
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',

  // 리소스 관련
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // 비즈니스 로직 관련
  ALREADY_APPROVED: 'ALREADY_APPROVED',
  ALREADY_REJECTED: 'ALREADY_REJECTED',
  CANNOT_DELETE_PAID_ORDER: 'CANNOT_DELETE_PAID_ORDER',
  CIRCULAR_RELATIONSHIP: 'CIRCULAR_RELATIONSHIP',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // 시스템 관련
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * 현재 사용자 조회 및 인증 확인
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null; // 인증 정보가 없으면 null 반환
  }

  // 먼저 Convex Auth userId로 조회 시도
  const userByConvexId = await ctx.db
    .query('profiles')
    .withIndex('by_userId', q => q.eq('userId', identity.subject as any))
    .unique();

  if (userByConvexId) {
    return userByConvexId;
  }

  // Convex Auth로 찾지 못하면 Supabase UUID로 조회 시도 (하위 호환성)
  const userBySupabaseId = await ctx.db
    .query('profiles')
    .withIndex('by_supabaseUserId', q => q.eq('supabaseUserId', identity.subject))
    .unique();

  if (!userBySupabaseId) {
    // 프로필이 없어도 에러를 던지지 않고 null 반환
    console.warn(`Profile not found for identity.subject: ${identity.subject}`);
    return null;
  }

  return userBySupabaseId;
}

/**
 * 관리자 권한 확인
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);

  if (!user || user.role !== 'admin') {
    throw new ApiError(ERROR_CODES.FORBIDDEN, '관리자 권한이 필요합니다.', 403);
  }

  return user;
}

/**
 * 특정 역할 권한 확인
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<'admin' | 'kol' | 'ol' | 'shop_owner' | 'sales'>
) {
  const user = await getCurrentUser(ctx);

  if (!user || !allowedRoles.includes(user.role)) {
    throw new ApiError(
      ERROR_CODES.FORBIDDEN,
      `이 작업은 ${allowedRoles.join(', ')} 권한이 필요합니다.`,
      403
    );
  }

  return user;
}

/**
 * 이메일 형식 검증
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 전화번호 형식 검증 (한국 전화번호)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^01[0-9]{1}-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/[-\s]/g, ''));
}

/**
 * 날짜 범위 검증
 */
export function validateDateRange(fromDate?: string, toDate?: string): void {
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new ApiError(ERROR_CODES.VALIDATION_ERROR, '올바르지 않은 날짜 형식입니다.', 400);
    }

    if (from > to) {
      throw new ApiError(
        ERROR_CODES.INVALID_DATE_RANGE,
        '시작 날짜는 종료 날짜보다 이전이어야 합니다.',
        400
      );
    }
  }
}

/**
 * 숫자 범위 검증
 */
export function validateNumberRange(
  value: number,
  min?: number,
  max?: number,
  fieldName: string = '값'
): void {
  if (min !== undefined && value < min) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      `${fieldName}은(는) ${min} 이상이어야 합니다.`,
      400
    );
  }

  if (max !== undefined && value > max) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      `${fieldName}은(는) ${max} 이하여야 합니다.`,
      400
    );
  }
}

/**
 * 수수료율 검증 (0-100%)
 */
export function validateCommissionRate(rate: number): void {
  validateNumberRange(rate, 0, 1, '수수료율');
}

/**
 * 금액 검증 (양수)
 */
export function validateAmount(amount: number, fieldName: string = '금액'): void {
  if (amount < 0) {
    throw new ApiError(ERROR_CODES.INVALID_AMOUNT, `${fieldName}은(는) 0 이상이어야 합니다.`, 400);
  }
}

/**
 * 페이지네이션 옵션 검증
 */
export function validatePaginationOpts(paginationOpts: any): void {
  if (paginationOpts.numItems && paginationOpts.numItems > 100) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      '한 번에 최대 100개 항목까지만 조회할 수 있습니다.',
      400
    );
  }
}

/**
 * 문자열 길이 검증
 */
export function validateStringLength(
  value: string,
  min?: number,
  max?: number,
  fieldName: string = '값'
): void {
  if (min !== undefined && value.length < min) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      `${fieldName}은(는) 최소 ${min}자 이상이어야 합니다.`,
      400
    );
  }

  if (max !== undefined && value.length > max) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      `${fieldName}은(는) 최대 ${max}자까지 입력할 수 있습니다.`,
      400
    );
  }
}

/**
 * 안전한 에러 반환 (스택 트레이스 제거)
 */
export function formatError(error: any): {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
} {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  // 예상하지 못한 에러의 경우
  console.error('Unexpected error:', error);
  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: '내부 서버 오류가 발생했습니다.',
    statusCode: 500,
  };
}

/**
 * 감사 로그 생성 헬퍼
 */
export async function createAuditLog(
  ctx: MutationCtx,
  data: {
    tableName: string;
    recordId: any;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    userId: any;
    userRole: string;
    oldValues?: any;
    newValues?: any;
    changedFields?: string[];
    metadata?: any;
  }
) {
  await ctx.db.insert('audit_logs', {
    table_name: data.tableName,
    record_id: data.recordId,
    action: data.action,
    user_id: data.userId,
    user_role: data.userRole,
    old_values: data.oldValues,
    new_values: data.newValues,
    changed_fields: data.changedFields || [],
    metadata: data.metadata,
    created_at: Date.now(),
  });
}

/**
 * 알림 생성 헬퍼
 */
export async function createNotification(
  ctx: MutationCtx,
  data: {
    userId: any;
    type:
      | 'system'
      | 'crm_update'
      | 'order_created'
      | 'commission_paid'
      | 'clinical_progress'
      | 'approval_required'
      | 'status_changed'
      | 'reminder';
    title: string;
    message: string;
    relatedType?: string;
    relatedId?: any;
    priority?: 'low' | 'normal' | 'high';
  }
) {
  await ctx.db.insert('notifications', {
    user_id: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    related_type: data.relatedType,
    related_id: data.relatedId,
    is_read: false,
    priority: data.priority || 'normal',
    created_at: Date.now(),
  });
}

/**
 * 고유 주문번호 생성
 */
export function generateOrderNumber(prefix: string = 'ORD'): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * 중복 확인 헬퍼
 */
export async function checkDuplicate(
  ctx: QueryCtx | MutationCtx,
  table: string,
  field: string,
  value: any,
  excludeId?: any
): Promise<boolean> {
  const existing = await (ctx.db.query as any)(table)
    .filter((q: any) => q.eq(q.field(field), value))
    .first();

  if (!existing) return false;
  if (excludeId && existing._id === excludeId) return false;

  return true;
}
