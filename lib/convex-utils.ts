/**
 * Convex 전환을 위한 유틸리티 함수들
 *
 * 기존 시스템에서 Convex로 전환하면서 발생하는
 * 타입 변환 및 데이터 구조 변환을 돕는 헬퍼 함수들
 */

import { Id } from '@/convex/_generated/dataModel';

/**
 * Legacy number ID를 Convex string ID로 변환
 * 주로 컴포넌트 Props에서 사용
 */
export function numberToConvexId(id: number | null): string | null {
  if (id === null) return null;
  return id.toString();
}

/**
 * Convex string ID를 Legacy number ID로 변환
 * 기존 컴포넌트와의 호환성을 위해 사용
 */
export function convexIdToNumber(id: string | null): number | null {
  if (id === null) return null;
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Convex ID 배열을 number 배열로 변환
 */
export function convexIdsToNumbers(ids: string[]): number[] {
  return ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
}

/**
 * snake_case 객체를 camelCase 객체로 변환
 * API 응답을 Convex 스타일로 변환할 때 사용
 */
export function snakeToCamel<T extends Record<string, any>>(obj: T): any {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[camelKey] = snakeToCamel(value);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map(item =>
        typeof item === 'object' && item !== null ? snakeToCamel(item) : item
      );
    } else {
      result[camelKey] = value;
    }
  }

  return result;
}

/**
 * camelCase 객체를 snake_case 객체로 변환
 * Convex에서 Legacy API로 데이터를 보낼 때 사용
 */
export function camelToSnake<T extends Record<string, any>>(obj: T): any {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = camelToSnake(value);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map(item =>
        typeof item === 'object' && item !== null ? camelToSnake(item) : item
      );
    } else {
      result[snakeKey] = value;
    }
  }

  return result;
}

/**
 * Convex 에러를 사용자 친화적인 메시지로 변환
 */
export function formatConvexError(error: any): string {
  if (typeof error === 'string') return error;

  if (error?.message) {
    // Convex 특정 에러 메시지 변환
    const message = error.message;

    if (message.includes('Document not found')) {
      return '요청한 데이터를 찾을 수 없습니다.';
    }

    if (message.includes('Permission denied')) {
      return '이 작업을 수행할 권한이 없습니다.';
    }

    if (message.includes('Invalid argument')) {
      return '입력 데이터가 올바르지 않습니다.';
    }

    if (message.includes('Rate limit exceeded')) {
      return '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
    }

    return message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 페이지네이션 파라미터 변환
 * Legacy API 스타일을 Convex 스타일로 변환
 */
export interface LegacyPaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface ConvexPaginationParams {
  paginationOpts?: {
    numItems: number;
    cursor?: string;
  };
}

export function legacyToConvexPagination(params: LegacyPaginationParams): ConvexPaginationParams {
  const limit = params.limit || 20;

  return {
    paginationOpts: {
      numItems: limit,
      // cursor는 실제 Convex 페이지네이션에서 관리
    },
  };
}

/**
 * 날짜 형식 변환 유틸리티
 */
export function convexTimestampToDate(timestamp: number): Date {
  return new Date(timestamp);
}

export function dateToConvexTimestamp(date: Date): number {
  return date.getTime();
}

/**
 * Convex Document ID 유효성 검사
 */
export function isValidConvexId(id: string, tableName: string): id is Id<typeof tableName> {
  // Convex ID는 보통 특정 패턴을 따름
  const convexIdPattern = /^[a-zA-Z0-9]{16,}$/;
  return convexIdPattern.test(id);
}

/**
 * 안전한 Convex ID 변환
 * 유효하지 않은 ID에 대해 null 반환
 */
export function safeConvexId<T extends string>(
  id: string | null | undefined,
  tableName: T
): Id<T> | null {
  if (!id || !isValidConvexId(id, tableName)) {
    return null;
  }
  return id as Id<T>;
}

/**
 * 디버깅용 Convex 데이터 로거
 */
export function logConvexData(label: string, data: any) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔥 Convex Data: ${label}`);
    console.log('Data:', data);
    console.log('Type:', typeof data);
    if (data && typeof data === 'object') {
      console.log('Keys:', Object.keys(data));
    }
    console.groupEnd();
  }
}
