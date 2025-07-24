/**
 * ID 타입 변환 유틸리티 테스트
 */

import {
  isNumberId,
  isStringId,
  isConvexId,
  isValidId,
  convertToStringId,
  convertToNumberId,
  convexIdToNumberHash,
  numberToConvexStyleId,
  convertIdsToString,
  convertIdsToNumber,
  convertArrayToStringIds,
  convertArrayToNumberIds,
  IdMappingRegistry,
  safeConvertToString,
  safeConvertToNumber,
  legacyNumberToConvexId,
  legacyConvexIdToNumber,
  type NumberId,
  type StringId,
  type ConvexId,
  type AnyId,
} from '@/lib/utils/id-conversion';

describe('ID 타입 변환 유틸리티', () => {
  // 타입 가드 함수 테스트
  describe('타입 가드 함수들', () => {
    describe('isNumberId', () => {
      it('유효한 숫자를 올바르게 식별한다', () => {
        expect(isNumberId(123)).toBe(true);
        expect(isNumberId(0)).toBe(true);
        expect(isNumberId(-45)).toBe(true);
        expect(isNumberId(3.14)).toBe(true);
      });

      it('유효하지 않은 값들을 거부한다', () => {
        expect(isNumberId('123')).toBe(false);
        expect(isNumberId(NaN)).toBe(false);
        expect(isNumberId(Infinity)).toBe(false);
        expect(isNumberId(null)).toBe(false);
        expect(isNumberId(undefined)).toBe(false);
        expect(isNumberId({})).toBe(false);
      });
    });

    describe('isStringId', () => {
      it('유효한 문자열을 올바르게 식별한다', () => {
        expect(isStringId('abc123')).toBe(true);
        expect(isStringId('user_123')).toBe(true);
        expect(isStringId('k456')).toBe(true);
      });

      it('유효하지 않은 값들을 거부한다', () => {
        expect(isStringId('')).toBe(false);
        expect(isStringId(123)).toBe(false);
        expect(isStringId(null)).toBe(false);
        expect(isStringId(undefined)).toBe(false);
      });
    });

    describe('isConvexId', () => {
      it('Convex ID 패턴을 올바르게 식별한다', () => {
        expect(isConvexId('abcdef1234567890abcd')).toBe(true);
        expect(isConvexId('1234567890abcdef1234')).toBe(true);
        expect(isConvexId('a1b2c3d4e5f6789012345')).toBe(true);
      });

      it('잘못된 패턴을 거부한다', () => {
        expect(isConvexId('short')).toBe(false);
        expect(isConvexId('k123')).toBe(false);
        expect(isConvexId('user_123')).toBe(false);
        expect(isConvexId('')).toBe(false);
        expect(isConvexId(123)).toBe(false);
      });
    });

    describe('isValidId', () => {
      it('유효한 ID들을 식별한다', () => {
        expect(isValidId(123)).toBe(true);
        expect(isValidId('abc123')).toBe(true);
        expect(isValidId('k456')).toBe(true);
      });

      it('유효하지 않은 값들을 거부한다', () => {
        expect(isValidId(null)).toBe(false);
        expect(isValidId(undefined)).toBe(false);
        expect(isValidId('')).toBe(false);
        expect(isValidId(NaN)).toBe(false);
      });
    });
  });

  // 기본 변환 함수 테스트
  describe('기본 변환 함수들', () => {
    describe('convertToStringId', () => {
      it('숫자를 문자열로 변환한다', () => {
        expect(convertToStringId(123)).toBe('123');
        expect(convertToStringId(0)).toBe('0');
        expect(convertToStringId(-45)).toBe('-45');
      });

      it('문자열을 그대로 반환한다', () => {
        expect(convertToStringId('abc123')).toBe('abc123');
        expect(convertToStringId('k456')).toBe('k456');
      });

      it('null/undefined에 대해 null을 반환한다', () => {
        expect(convertToStringId(null)).toBe(null);
        expect(convertToStringId(undefined)).toBe(null);
      });
    });

    describe('convertToNumberId', () => {
      it('숫자를 그대로 반환한다', () => {
        expect(convertToNumberId(123)).toBe(123);
        expect(convertToNumberId(0)).toBe(0);
        expect(convertToNumberId(-45)).toBe(-45);
      });

      it('숫자 문자열을 숫자로 변환한다', () => {
        expect(convertToNumberId('123')).toBe(123);
        expect(convertToNumberId('0')).toBe(0);
        expect(convertToNumberId('-45')).toBe(-45);
      });

      it('변환할 수 없는 문자열에 대해 null을 반환한다', () => {
        expect(convertToNumberId('abc')).toBe(null);
        expect(convertToNumberId('k123abc')).toBe(null);
      });

      it('null/undefined에 대해 null을 반환한다', () => {
        expect(convertToNumberId(null)).toBe(null);
        expect(convertToNumberId(undefined)).toBe(null);
      });
    });
  });

  // 해시 및 스타일 변환 함수 테스트
  describe('해시 및 스타일 변환 함수들', () => {
    describe('convexIdToNumberHash', () => {
      it('일관된 해시값을 생성한다', () => {
        const convexId = 'abcdef1234567890' as ConvexId;
        const hash1 = convexIdToNumberHash(convexId);
        const hash2 = convexIdToNumberHash(convexId);

        expect(hash1).toBe(hash2);
        expect(typeof hash1).toBe('number');
        expect(hash1).toBeGreaterThan(0);
      });

      it('다른 ID에 대해 다른 해시를 생성한다 (일반적으로)', () => {
        const id1 = 'abcdef1234567890' as ConvexId;
        const id2 = 'fedcba0987654321' as ConvexId;

        const hash1 = convexIdToNumberHash(id1);
        const hash2 = convexIdToNumberHash(id2);

        expect(hash1).not.toBe(hash2);
      });
    });

    describe('numberToConvexStyleId', () => {
      it('기본 prefix로 변환한다', () => {
        expect(numberToConvexStyleId(123)).toBe('k123');
        expect(numberToConvexStyleId(0)).toBe('k0');
      });

      it('커스텀 prefix로 변환한다', () => {
        expect(numberToConvexStyleId(123, 'u')).toBe('u123');
        expect(numberToConvexStyleId(456, 'shop')).toBe('shop456');
      });

      it('음수를 절댓값으로 변환한다', () => {
        expect(numberToConvexStyleId(-123)).toBe('k123');
        expect(numberToConvexStyleId(-456, 'u')).toBe('u456');
      });
    });
  });

  // 배열 변환 함수 테스트
  describe('배열 변환 함수들', () => {
    describe('convertArrayToStringIds', () => {
      it('객체 배열의 ID를 문자열로 변환한다', () => {
        const input = [
          { id: 123, name: 'Test 1' },
          { id: 456, name: 'Test 2' },
        ];

        const result = convertArrayToStringIds(input);

        expect(result).toEqual([
          { id: '123', name: 'Test 1' },
          { id: '456', name: 'Test 2' },
        ]);
      });

      it('커스텀 ID 필드를 변환한다', () => {
        const input = [{ userId: 123, kolId: 456, name: 'Test' }];

        const result = convertArrayToStringIds(input, ['userId', 'kolId']);

        expect(result).toEqual([{ userId: '123', kolId: '456', name: 'Test' }]);
      });
    });

    describe('convertArrayToNumberIds', () => {
      it('객체 배열의 ID를 숫자로 변환한다', () => {
        const input = [
          { id: '123', name: 'Test 1' },
          { id: '456', name: 'Test 2' },
        ];

        const result = convertArrayToNumberIds(input);

        expect(result).toEqual([
          { id: 123, name: 'Test 1' },
          { id: 456, name: 'Test 2' },
        ]);
      });
    });
  });

  // ID 매핑 레지스트리 테스트
  describe('IdMappingRegistry', () => {
    beforeEach(() => {
      IdMappingRegistry.clear();
    });

    it('ID 매핑을 등록하고 조회한다', () => {
      const convexId = 'abcdef1234567890' as ConvexId;
      const numberId = 123;

      IdMappingRegistry.register(convexId, numberId);

      expect(IdMappingRegistry.getConvexId(numberId)).toBe(convexId);
      expect(IdMappingRegistry.getNumberId(convexId)).toBe(numberId);
      expect(IdMappingRegistry.size()).toBe(1);
    });

    it('존재하지 않는 매핑에 대해 null을 반환한다', () => {
      expect(IdMappingRegistry.getConvexId(999)).toBe(null);
      expect(IdMappingRegistry.getNumberId('nonexistent' as ConvexId)).toBe(null);
    });

    it('매핑을 클리어한다', () => {
      const convexId = 'abcdef1234567890' as ConvexId;
      const numberId = 123;

      IdMappingRegistry.register(convexId, numberId);
      expect(IdMappingRegistry.size()).toBe(1);

      IdMappingRegistry.clear();
      expect(IdMappingRegistry.size()).toBe(0);
      expect(IdMappingRegistry.getConvexId(numberId)).toBe(null);
    });
  });

  // 안전 변환 함수 테스트
  describe('안전 변환 함수들', () => {
    describe('safeConvertToString', () => {
      it('유효한 값을 변환한다', () => {
        expect(safeConvertToString(123)).toBe('123');
        expect(safeConvertToString('abc')).toBe('abc');
      });

      it('유효하지 않은 값에 대해 기본값을 반환한다', () => {
        expect(safeConvertToString(null)).toBe('');
        expect(safeConvertToString(undefined)).toBe('');
        expect(safeConvertToString(null, 'default')).toBe('default');
      });
    });

    describe('safeConvertToNumber', () => {
      it('유효한 값을 변환한다', () => {
        expect(safeConvertToNumber(123)).toBe(123);
        expect(safeConvertToNumber('456')).toBe(456);
      });

      it('유효하지 않은 값에 대해 기본값을 반환한다', () => {
        expect(safeConvertToNumber(null)).toBe(0);
        expect(safeConvertToNumber('abc')).toBe(0);
        expect(safeConvertToNumber(null, -1)).toBe(-1);
      });
    });
  });

  // 레거시 호환성 테스트
  describe('레거시 호환성', () => {
    it('legacyNumberToConvexId가 numberToConvexStyleId와 동일하다', () => {
      expect(legacyNumberToConvexId(123)).toBe(numberToConvexStyleId(123));
      expect(legacyNumberToConvexId(456, 'u')).toBe(numberToConvexStyleId(456, 'u'));
    });

    it('legacyConvexIdToNumber가 convexIdToNumberHash와 동일하다', () => {
      const convexId = 'abcdef1234567890' as ConvexId;
      expect(legacyConvexIdToNumber(convexId)).toBe(convexIdToNumberHash(convexId));
    });
  });

  // 에지 케이스 테스트
  describe('에지 케이스', () => {
    it('빈 배열을 처리한다', () => {
      expect(convertArrayToStringIds([])).toEqual([]);
      expect(convertArrayToNumberIds([])).toEqual([]);
    });

    it('ID 필드가 없는 객체를 처리한다', () => {
      const input = { name: 'Test', value: 42 };
      expect(convertIdsToString(input)).toEqual(input);
      expect(convertIdsToNumber(input)).toEqual(input);
    });

    it('null 값이 있는 ID 필드를 처리한다', () => {
      const input = { id: null, name: 'Test' };
      const result = convertIdsToString(input);
      expect(result).toEqual({ id: null, name: 'Test' });
    });
  });
});
