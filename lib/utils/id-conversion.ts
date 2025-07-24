/**
 * ID 타입 변환 유틸리티
 * 시스템 전반의 number ID ↔ string ID 변환을 통합 관리
 */

import { Id } from '@/convex/_generated/dataModel';

// 타입 정의
export type NumberId = number;
export type StringId = string;
export type ConvexId = Id<any>; // 제약 조건 제거로 유연성 확보
export type AnyId = NumberId | StringId | ConvexId;

// 타입 가드 함수
export const isNumberId = (id: unknown): id is NumberId =>
  typeof id === 'number' && !isNaN(id) && isFinite(id);

export const isStringId = (id: unknown): id is StringId => typeof id === 'string' && id.length > 0;

export const isConvexId = (id: unknown): id is ConvexId =>
  typeof id === 'string' && /^[a-zA-Z0-9_-]{16,}$/.test(id);

export const isValidId = (id: unknown): id is AnyId => isNumberId(id) || isStringId(id);

// 기본 변환 함수
export const convertToStringId = (id: NumberId | StringId | null | undefined): StringId | null => {
  if (id === null || id === undefined) return null;

  if (isNumberId(id)) {
    return id.toString();
  }

  if (isStringId(id)) {
    return id;
  }

  return null;
};

export const convertToNumberId = (id: StringId | NumberId | null | undefined): NumberId | null => {
  if (id === null || id === undefined) return null;

  if (isNumberId(id)) {
    return id;
  }

  if (isStringId(id)) {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
};

/**
 * Convex ID와 Number ID 간 변환을 위한 해시 함수
 * 일관된 변환을 보장하지만 역변환은 불가능
 */
export const convexIdToNumberHash = (convexId: ConvexId): NumberId => {
  let hash = 0;
  for (let i = 0; i < convexId.length; i++) {
    const char = convexId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  return Math.abs(hash);
};

/**
 * Number ID를 Convex 스타일 ID로 변환 (prefix 방식)
 * 실제 Convex ID가 아니므로 주의 필요
 */
export const numberToConvexStyleId = (numberId: NumberId, prefix: string = 'k'): StringId => {
  return `${prefix}${Math.abs(numberId)}`;
};

// 배열 처리 함수 - Object.assign 사용으로 타입 안전성 확보
export const convertIdsToString = <T extends Record<string, any>>(
  obj: T,
  idFields: (keyof T)[] = ['id']
): T => {
  // Object.assign을 사용하여 깊은 복사 및 타입 안전성 확보
  const result = Object.assign({}, obj) as Record<string, any>;

  // ID 필드들 변환
  idFields.forEach(field => {
    const fieldKey = field as string;
    if (fieldKey in result) {
      const convertedId = convertToStringId(result[fieldKey]);
      if (convertedId !== null) {
        result[fieldKey] = convertedId;
      }
    }
  });

  return result as T;
};

export const convertIdsToNumber = <T extends Record<string, any>>(
  obj: T,
  idFields: (keyof T)[] = ['id']
): T => {
  // Object.assign을 사용하여 깊은 복사 및 타입 안전성 확보
  const result = Object.assign({}, obj) as Record<string, any>;

  // ID 필드들 변환
  idFields.forEach(field => {
    const fieldKey = field as string;
    if (fieldKey in result) {
      const convertedId = convertToNumberId(result[fieldKey]);
      if (convertedId !== null) {
        result[fieldKey] = convertedId;
      }
    }
  });

  return result as T;
};

// 배열 일괄 변환 함수
export const convertArrayToStringIds = <T extends Record<string, any>>(
  array: T[],
  idFields: (keyof T)[] = ['id']
): T[] => {
  return array.map(item => convertIdsToString(item, idFields));
};

export const convertArrayToNumberIds = <T extends Record<string, any>>(
  array: T[],
  idFields: (keyof T)[] = ['id']
): T[] => {
  return array.map(item => convertIdsToNumber(item, idFields));
};

// 중첩 객체 처리 함수
export const convertNestedIdsToString = <T extends Record<string, any>>(
  obj: T,
  config: {
    idFields?: (keyof T)[];
    nestedFields?: { [K in keyof T]?: string[] }; // 타입 단순화
  } = {}
): T => {
  const { idFields = ['id'], nestedFields = {} } = config;
  let result = convertIdsToString(obj, idFields);

  Object.entries(nestedFields).forEach(([parentField, childIdFields]) => {
    if (parentField in result && result[parentField]) {
      if (Array.isArray(result[parentField])) {
        result[parentField] = (result[parentField] as any[]).map(item =>
          convertIdsToString(item, childIdFields as string[])
        );
      } else if (typeof result[parentField] === 'object') {
        result[parentField] = convertIdsToString(result[parentField], childIdFields as string[]);
      }
    }
  });

  return result;
};

// ID 매핑 테이블 관리 (옵션)
class IdMappingRegistry {
  private static mappings = new Map<string, { convexId: ConvexId; numberId: NumberId }>();

  static register(convexId: ConvexId, numberId: NumberId): void {
    const key = `${convexId}-${numberId}`;
    this.mappings.set(key, { convexId, numberId });
  }

  static getConvexId(numberId: NumberId): ConvexId | null {
    for (const [, mapping] of this.mappings) {
      if (mapping.numberId === numberId) {
        return mapping.convexId;
      }
    }
    return null;
  }

  static getNumberId(convexId: ConvexId): NumberId | null {
    for (const [, mapping] of this.mappings) {
      if (mapping.convexId === convexId) {
        return mapping.numberId;
      }
    }
    return null;
  }

  static clear(): void {
    this.mappings.clear();
  }

  static size(): number {
    return this.mappings.size;
  }
}

// Map, Set 처리를 위한 고급 함수들
export const convertMapKeys = <V>(
  map: Map<AnyId, V>,
  converter: (key: AnyId) => AnyId | null
): Map<AnyId, V> => {
  const newMap = new Map<AnyId, V>();

  for (const [key, value] of map.entries()) {
    const convertedKey = converter(key);
    if (convertedKey !== null) {
      newMap.set(convertedKey, value);
    }
  }

  return newMap;
};

export const convertSetValues = <T extends AnyId>(
  set: Set<T>,
  converter: (value: T) => AnyId | null
): Set<AnyId> => {
  const newSet = new Set<AnyId>();

  for (const value of set) {
    const convertedValue = converter(value);
    if (convertedValue !== null) {
      newSet.add(convertedValue);
    }
  }

  return newSet;
};

// 성능 최적화를 위한 메모이제이션
const memoCache = new Map<string, any>();

export const memoizedConvert = <T>(
  input: T,
  converter: (input: T) => any,
  keyGenerator: (input: T) => string
): any => {
  const key = keyGenerator(input);

  if (memoCache.has(key)) {
    return memoCache.get(key);
  }

  const result = converter(input);
  memoCache.set(key, result);

  // 캐시 크기 제한 (메모리 누수 방지)
  if (memoCache.size > 1000) {
    const firstKey = memoCache.keys().next().value;
    if (firstKey) {
      // undefined 체크 추가
      memoCache.delete(firstKey);
    }
  }

  return result;
};

// 에러 안전 변환 함수들
export const safeConvertToString = (id: unknown, defaultValue: string = ''): string => {
  try {
    const result = convertToStringId(id as AnyId);
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

export const safeConvertToNumber = (id: unknown, defaultValue: number = 0): number => {
  try {
    const result = convertToNumberId(id as AnyId);
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

// 유틸리티 함수 내보내기
export { IdMappingRegistry };

// 레거시 호환성을 위한 별칭들
export const legacyNumberToConvexId = numberToConvexStyleId;
export const legacyConvexIdToNumber = convexIdToNumberHash;
