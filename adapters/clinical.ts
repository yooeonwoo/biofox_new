import { z } from 'zod';
import type {
  ClinicalCase as DomainClinicalCase,
  PhotoSlot as DomainPhotoSlot,
  CustomerInfo,
  RoundCustomerInfo,
} from '@/types/clinical';
// Legacy import 제거 - 직접 타입 정의 사용
import { safeParseStringArray } from '@/types/clinical';

// API 응답 스키마 정의
const apiPhotoSlotSchema = z.object({
  id: z.string(),
  roundDay: z.number(),
  angle: z.enum(['front', 'left', 'right']),
  imageUrl: z.string().optional(),
  uploaded: z.boolean(),
  photoId: z.number().optional(),
});

const apiClinicalCaseSchema = z.object({
  id: z.string(),
  kolId: z.string(),
  customerId: z.string().optional(),
  customerName: z.string(),
  caseName: z.string(),
  concernArea: z.string().optional(),
  treatmentPlan: z.string().optional(),
  consentReceived: z.boolean(),
  consentDate: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
  totalPhotos: z.number().optional(),
  completedRounds: z.number().optional(),
  consentImageUrl: z.string().optional(),
  // 플레이어 제품 관련 필드
  cureBooster: z.boolean().optional(),
  cureMask: z.boolean().optional(),
  premiumMask: z.boolean().optional(),
  allInOneSerum: z.boolean().optional(),
  // 고객 피부 타입 관련 필드
  skinRedSensitive: z.boolean().optional(),
  skinPigment: z.boolean().optional(),
  skinPore: z.boolean().optional(),
  skinTrouble: z.boolean().optional(),
  skinWrinkle: z.boolean().optional(),
  skinEtc: z.boolean().optional(),
});

// Domain 타입 스키마 정의
const domainPhotoSlotSchema = z.object({
  id: z.string(),
  roundDay: z.number(),
  angle: z.enum(['front', 'left', 'right']),
  imageUrl: z.string().optional(),
  uploaded: z.boolean(),
});

const customerInfoSchema = z.object({
  name: z.string(),
  age: z.number().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  treatmentType: z.string().optional(),
  products: z.array(z.string()),
  skinTypes: z.array(z.string()),
  memo: z.string().optional(),
});

const roundCustomerInfoSchema = z.object({
  age: z.number().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  treatmentType: z.string().optional(),
  products: z.array(z.string()),
  skinTypes: z.array(z.string()),
  memo: z.string().optional(),
  date: z.string().optional(),
});

const domainClinicalCaseSchema = z.object({
  id: z.string(),
  customerName: z.string(),
  status: z.enum(['active', 'completed', 'archived', 'cancelled']),
  createdAt: z.string(),
  consentReceived: z.boolean(),
  consentImageUrl: z.string().optional(),
  photos: z.array(domainPhotoSlotSchema),
  customerInfo: customerInfoSchema,
  roundCustomerInfo: z.record(z.string(), roundCustomerInfoSchema),
  // 플레이어 제품 관련 필드
  cureBooster: z.boolean().optional(),
  cureMask: z.boolean().optional(),
  premiumMask: z.boolean().optional(),
  allInOneSerum: z.boolean().optional(),
  // 고객 피부 타입 관련 필드
  skinRedSensitive: z.boolean().optional(),
  skinPigment: z.boolean().optional(),
  skinPore: z.boolean().optional(),
  skinTrouble: z.boolean().optional(),
  skinWrinkle: z.boolean().optional(),
  skinEtc: z.boolean().optional(),
});

// 타입 추출
export type APIClinicalCase = z.infer<typeof apiClinicalCaseSchema>;
export type APIPhotoSlot = z.infer<typeof apiPhotoSlotSchema>;
export type APIClinicalCaseValidated = z.infer<typeof apiClinicalCaseSchema>;
export type DomainClinicalCaseValidated = z.infer<typeof domainClinicalCaseSchema>;

/**
 * API 응답을 Domain 타입으로 변환
 */
export async function toDomainCase(
  apiCase: APIClinicalCase,
  photos: APIPhotoSlot[] = [],
  roundInfos: any[] = []
): Promise<DomainClinicalCase> {
  // API 데이터 검증
  const validatedApiCase = apiClinicalCaseSchema.parse(apiCase);

  // 제품 정보 배열 생성
  const products: string[] = [];
  if (validatedApiCase.cureBooster) products.push('cure_booster');
  if (validatedApiCase.cureMask) products.push('cure_mask');
  if (validatedApiCase.premiumMask) products.push('premium_mask');
  if (validatedApiCase.allInOneSerum) products.push('all_in_one_serum');

  // 피부 타입 배열 생성
  const skinTypes: string[] = [];
  if (validatedApiCase.skinRedSensitive) skinTypes.push('red_sensitive');
  if (validatedApiCase.skinPigment) skinTypes.push('pigment');
  if (validatedApiCase.skinPore) skinTypes.push('pore');
  if (validatedApiCase.skinTrouble) skinTypes.push('acne_trouble');
  if (validatedApiCase.skinWrinkle) skinTypes.push('wrinkle');
  if (validatedApiCase.skinEtc) skinTypes.push('other');

  // 사진 데이터 변환
  const domainPhotos: DomainPhotoSlot[] = photos.map(photo => ({
    id: photo.id,
    roundDay: photo.roundDay,
    angle: photo.angle,
    imageUrl: photo.imageUrl,
    uploaded: photo.uploaded,
  }));

  // 회차별 고객 정보 변환
  const roundCustomerInfo: { [roundDay: number]: RoundCustomerInfo } = {};
  roundInfos.forEach(round => {
    roundCustomerInfo[round.round_number] = {
      age: round.age,
      gender: round.gender,
      treatmentType: round.treatment_type || '',
      products: safeParseStringArray(round.products),
      skinTypes: safeParseStringArray(round.skin_types),
      memo: round.memo || '',
      date: round.treatment_date || validatedApiCase.createdAt.split('T')[0],
    };
  });

  // 기본 회차 정보가 없으면 생성
  if (!roundCustomerInfo[1]) {
    roundCustomerInfo[1] = {
      age: undefined,
      gender: undefined,
      treatmentType: validatedApiCase.treatmentPlan || '',
      products: products,
      skinTypes: skinTypes,
      memo: validatedApiCase.treatmentPlan || '',
      date: validatedApiCase.createdAt.split('T')[0],
    };
  }

  // Domain 케이스 객체 생성
  const domainCase: DomainClinicalCase = {
    id: validatedApiCase.id,
    customerName: validatedApiCase.customerName,
    status: validatedApiCase.status as 'active' | 'completed' | 'archived',
    createdAt: (validatedApiCase.createdAt?.split('T')[0] ||
      new Date().toISOString().split('T')[0]) as string,
    consentReceived: validatedApiCase.consentReceived,
    consentImageUrl: validatedApiCase.consentImageUrl,
    photos: domainPhotos,
    customerInfo: {
      name: validatedApiCase.customerName,
      age: roundCustomerInfo[1]?.age,
      gender: roundCustomerInfo[1]?.gender,
      treatmentType: roundCustomerInfo[1]?.treatmentType,
      products: products,
      skinTypes: skinTypes,
      memo: validatedApiCase.treatmentPlan || '',
    },
    roundCustomerInfo: roundCustomerInfo,
    // boolean 필드 그대로 전달
    cureBooster: validatedApiCase.cureBooster || false,
    cureMask: validatedApiCase.cureMask || false,
    premiumMask: validatedApiCase.premiumMask || false,
    allInOneSerum: validatedApiCase.allInOneSerum || false,
    skinRedSensitive: validatedApiCase.skinRedSensitive || false,
    skinPigment: validatedApiCase.skinPigment || false,
    skinPore: validatedApiCase.skinPore || false,
    skinTrouble: validatedApiCase.skinTrouble || false,
    skinWrinkle: validatedApiCase.skinWrinkle || false,
    skinEtc: validatedApiCase.skinEtc || false,
  };

  // Domain 데이터 검증
  return domainClinicalCaseSchema.parse(domainCase);
}

/**
 * Domain 타입을 API 요청 형식으로 변환
 */
export function toAPICase(domainCase: DomainClinicalCase): Partial<APIClinicalCase> {
  // Domain 데이터 검증
  const validatedDomainCase = domainClinicalCaseSchema.parse(domainCase);

  // API 형식으로 변환
  const apiCase: Partial<APIClinicalCase> = {
    id: validatedDomainCase.id,
    customerName: validatedDomainCase.customerName,
    caseName: validatedDomainCase.customerName, // caseName은 customerName과 동일하게 설정
    treatmentPlan: validatedDomainCase.customerInfo.memo,
    consentReceived: validatedDomainCase.consentReceived,
    status: validatedDomainCase.status as 'active' | 'completed' | 'archived',
    consentImageUrl: validatedDomainCase.consentImageUrl,
    // boolean 필드 전달
    cureBooster: validatedDomainCase.cureBooster,
    cureMask: validatedDomainCase.cureMask,
    premiumMask: validatedDomainCase.premiumMask,
    allInOneSerum: validatedDomainCase.allInOneSerum,
    skinRedSensitive: validatedDomainCase.skinRedSensitive,
    skinPigment: validatedDomainCase.skinPigment,
    skinPore: validatedDomainCase.skinPore,
    skinTrouble: validatedDomainCase.skinTrouble,
    skinWrinkle: validatedDomainCase.skinWrinkle,
    skinEtc: validatedDomainCase.skinEtc,
  };

  return apiCase;
}

/**
 * 케이스 생성 시 Domain 데이터를 API 생성 요청으로 변환
 */
export function toCaseCreateRequest(domainCase: Partial<DomainClinicalCase>): {
  customerName: string;
  caseName: string;
  concernArea?: string;
  treatmentPlan?: string;
  consentReceived?: boolean;
  consentDate?: string;
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
} {
  return {
    customerName: domainCase.customerName || '',
    caseName: domainCase.customerName || '',
    treatmentPlan: domainCase.customerInfo?.memo,
    consentReceived: domainCase.consentReceived || false,
    cureBooster: domainCase.cureBooster,
    cureMask: domainCase.cureMask,
    premiumMask: domainCase.premiumMask,
    allInOneSerum: domainCase.allInOneSerum,
    skinRedSensitive: domainCase.skinRedSensitive,
    skinPigment: domainCase.skinPigment,
    skinPore: domainCase.skinPore,
    skinTrouble: domainCase.skinTrouble,
    skinWrinkle: domainCase.skinWrinkle,
    skinEtc: domainCase.skinEtc,
  };
}
