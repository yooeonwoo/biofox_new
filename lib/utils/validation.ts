import { z } from 'zod';
import type { ClinicalCase, RoundCustomerInfo } from '@/types/clinical';

// 고객 정보 검증 스키마
export const CustomerInfoSchema = z.object({
  name: z.string().max(50, '이름은 50자 이내로 입력해주세요').optional(),
  age: z
    .number()
    .min(0, '나이는 0 이상이어야 합니다')
    .max(150, '올바른 나이를 입력해주세요')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  products: z.array(z.string()).optional(),
  skinTypes: z.array(z.string()).optional(),
  memo: z.string().max(500, '메모는 500자 이내로 입력해주세요').optional(),
});

// 회차별 고객 정보 검증 스키마
export const RoundCustomerInfoSchema = z.object({
  treatmentType: z.string().max(100, '치료 유형은 100자 이내로 입력해주세요').optional(),
  products: z.array(z.string()).optional(),
  skinTypes: z.array(z.string()).optional(),
  memo: z.string().max(500, '메모는 500자 이내로 입력해주세요').optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다')
    .optional(),
});

// 케이스 이름 검증
export const CaseNameSchema = z
  .string()
  .min(1, '케이스 이름을 입력해주세요')
  .max(100, '케이스 이름은 100자 이내로 입력해주세요');

// 고객 이름 검증
export const CustomerNameSchema = z
  .string()
  .min(1, '고객 이름을 입력해주세요')
  .max(50, '고객 이름은 50자 이내로 입력해주세요')
  .refine(name => name.trim().length > 0, '공백만으로는 이름을 입력할 수 없습니다');

// 검증 헬퍼 함수들
export function validateCustomerInfo(data: unknown): { isValid: boolean; errors?: string[] } {
  try {
    CustomerInfoSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => e.message),
      };
    }
    return { isValid: false, errors: ['알 수 없는 오류가 발생했습니다'] };
  }
}

export function validateRoundCustomerInfo(data: unknown): { isValid: boolean; errors?: string[] } {
  try {
    RoundCustomerInfoSchema.parse(data);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => e.message),
      };
    }
    return { isValid: false, errors: ['알 수 없는 오류가 발생했습니다'] };
  }
}

// 필드별 검증 함수
export function validateField(fieldName: string, value: unknown): string | null {
  try {
    switch (fieldName) {
      case 'customerName':
        CustomerNameSchema.parse(value);
        break;
      case 'caseName':
        CaseNameSchema.parse(value);
        break;
      case 'age':
        if (value !== undefined && value !== '') {
          z.number().min(0).max(150).parse(Number(value));
        }
        break;
      case 'memo':
        z.string()
          .max(500)
          .parse(value as string);
        break;
      default:
        // 기타 필드는 기본 검증 통과
        break;
    }
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || '유효하지 않은 입력입니다';
    }
    return '검증 중 오류가 발생했습니다';
  }
}

// 케이스 데이터 완전성 검사
export function isCaseDataComplete(caseData: Partial<ClinicalCase>): {
  isComplete: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (!caseData.customerName?.trim()) {
    missingFields.push('고객 이름');
  }

  // 추가 필수 필드 검사
  if (!caseData.consentReceived) {
    missingFields.push('동의서 확인');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

// 동시 수정 감지를 위한 버전 체크
export function checkConcurrentModification(localVersion: number, serverVersion: number): boolean {
  return localVersion < serverVersion;
}
