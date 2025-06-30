import { describe, it, expect } from 'vitest';
import { toDomainCase, toAPICase, toCaseCreateRequest } from './clinical';
import type { ClinicalCase as APIClinicalCase, PhotoSlot as APIPhotoSlot } from '@/lib/clinical-photos';

describe('Clinical Adapter', () => {
  // 테스트용 API 케이스 데이터
  const mockAPICase: APIClinicalCase = {
    id: 123,
    kolId: 456,
    customerId: 'cust123',
    customerName: '김테스트',
    caseName: '김테스트 케이스',
    concernArea: '얼굴 전체',
    treatmentPlan: '10GF 마이크로젯 케어',
    consentReceived: true,
    consentDate: '2024-01-15',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
    totalPhotos: 3,
    completedRounds: 1,
    consentImageUrl: 'https://example.com/consent.jpg',
    cureBooster: true,
    cureMask: false,
    premiumMask: true,
    allInOneSerum: false,
    skinRedSensitive: true,
    skinPigment: false,
    skinPore: true,
    skinTrouble: false,
    skinWrinkle: false,
    skinEtc: false,
  };

  // 테스트용 사진 데이터
  const mockPhotos: APIPhotoSlot[] = [
    {
      id: 'photo1',
      roundDay: 1,
      angle: 'front',
      imageUrl: 'https://example.com/photo1.jpg',
      uploaded: true,
      photoId: 1,
    },
    {
      id: 'photo2',
      roundDay: 1,
      angle: 'left',
      imageUrl: 'https://example.com/photo2.jpg',
      uploaded: true,
      photoId: 2,
    },
  ];

  // 테스트용 회차 정보
  const mockRoundInfos = [
    {
      round_number: 1,
      age: 30,
      gender: 'female',
      treatment_type: '10GF',
      products: '["cure_booster", "premium_mask"]',
      skin_types: '["red_sensitive", "pore"]',
      memo: '첫 번째 시술',
      treatment_date: '2024-01-15',
    },
  ];

  describe('toDomainCase', () => {
    it('모든 필드를 올바르게 매핑해야 한다', async () => {
      const result = await toDomainCase(mockAPICase, mockPhotos, mockRoundInfos);

      expect(result.id).toBe('123');
      expect(result.customerName).toBe('김테스트');
      expect(result.status).toBe('active');
      expect(result.createdAt).toBe('2024-01-15');
      expect(result.consentReceived).toBe(true);
      expect(result.consentImageUrl).toBe('https://example.com/consent.jpg');
      
      // 사진 데이터 검증
      expect(result.photos).toHaveLength(2);
      expect(result.photos[0].id).toBe('photo1');
      expect(result.photos[0].angle).toBe('front');
      
      // 고객 정보 검증
      expect(result.customerInfo.name).toBe('김테스트');
      expect(result.customerInfo.products).toContain('cure_booster');
      expect(result.customerInfo.products).toContain('premium_mask');
      expect(result.customerInfo.skinTypes).toContain('red_sensitive');
      expect(result.customerInfo.skinTypes).toContain('pore');
      
      // boolean 필드 검증
      expect(result.cureBooster).toBe(true);
      expect(result.premiumMask).toBe(true);
      expect(result.skinRedSensitive).toBe(true);
      expect(result.skinPore).toBe(true);
    });

    it('enum과 string 변환을 올바르게 처리해야 한다', async () => {
      const result = await toDomainCase(mockAPICase, mockPhotos, mockRoundInfos);

      // boolean → string 변환 확인
      expect(result.customerInfo.products).toEqual(['cure_booster', 'premium_mask']);
      expect(result.customerInfo.skinTypes).toEqual(['red_sensitive', 'pore']);
      
      // 회차별 정보 검증
      expect(result.roundCustomerInfo[1]).toBeDefined();
      expect(result.roundCustomerInfo[1].age).toBe(30);
      expect(result.roundCustomerInfo[1].gender).toBe('female');
      expect(result.roundCustomerInfo[1].products).toEqual(['cure_booster', 'premium_mask']);
      expect(result.roundCustomerInfo[1].skinTypes).toEqual(['red_sensitive', 'pore']);
    });

    it('옵셔널 필드 누락 시 기본값으로 처리해야 한다', async () => {
      const minimalAPICase: APIClinicalCase = {
        id: 999,
        kolId: 888,
        customerName: '최소 케이스',
        caseName: '최소 케이스',
        consentReceived: false,
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const result = await toDomainCase(minimalAPICase, [], []);

      expect(result.id).toBe('999');
      expect(result.customerName).toBe('최소 케이스');
      expect(result.consentReceived).toBe(false);
      expect(result.photos).toEqual([]);
      
      // 기본 회차 정보가 생성되어야 함
      expect(result.roundCustomerInfo[1]).toBeDefined();
      expect(result.roundCustomerInfo[1].products).toEqual([]);
      expect(result.roundCustomerInfo[1].skinTypes).toEqual([]);
      
      // boolean 필드는 false로 기본값 설정
      expect(result.cureBooster).toBe(false);
      expect(result.cureMask).toBe(false);
      expect(result.skinRedSensitive).toBe(false);
    });
  });

  describe('toAPICase', () => {
    it('Domain 타입을 API 타입으로 올바르게 변환해야 한다', () => {
      const domainCase = {
        id: '123',
        customerName: '김테스트',
        status: 'active' as const,
        createdAt: '2024-01-15',
        consentReceived: true,
        consentImageUrl: 'https://example.com/consent.jpg',
        photos: [],
        customerInfo: {
          name: '김테스트',
          age: 30,
          gender: 'female' as const,
          treatmentType: '10GF',
          products: ['cure_booster', 'premium_mask'],
          skinTypes: ['red_sensitive', 'pore'],
          memo: '테스트 메모',
        },
        roundCustomerInfo: {},
        cureBooster: true,
        cureMask: false,
        premiumMask: true,
        allInOneSerum: false,
        skinRedSensitive: true,
        skinPigment: false,
        skinPore: true,
        skinTrouble: false,
        skinWrinkle: false,
        skinEtc: false,
      };

      const result = toAPICase(domainCase);

      expect(result.id).toBe(123);
      expect(result.customerName).toBe('김테스트');
      expect(result.caseName).toBe('김테스트');
      expect(result.status).toBe('active');
      expect(result.treatmentPlan).toBe('테스트 메모');
      expect(result.consentReceived).toBe(true);
      expect(result.cureBooster).toBe(true);
      expect(result.premiumMask).toBe(true);
      expect(result.skinRedSensitive).toBe(true);
      expect(result.skinPore).toBe(true);
    });
  });

  describe('toCaseCreateRequest', () => {
    it('케이스 생성 요청 형식으로 올바르게 변환해야 한다', () => {
      const domainCase = {
        customerName: '새 고객',
        consentReceived: false,
        customerInfo: {
          name: '새 고객',
          memo: '새 고객 메모',
          products: [],
          skinTypes: [],
        },
        cureBooster: true,
        skinRedSensitive: true,
      };

      const result = toCaseCreateRequest(domainCase);

      expect(result.customerName).toBe('새 고객');
      expect(result.caseName).toBe('새 고객');
      expect(result.treatmentPlan).toBe('새 고객 메모');
      expect(result.consentReceived).toBe(false);
      expect(result.cureBooster).toBe(true);
      expect(result.skinRedSensitive).toBe(true);
      expect(result.cureMask).toBeUndefined();
    });
  });
}); 