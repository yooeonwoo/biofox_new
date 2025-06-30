// 기존 API의 타입들을 import
import type { ClinicalCase, PhotoSlot, UploadResponse } from '@/lib/clinical-photos';

// 케이스 관련 API 서비스
export const clinicalPhotosAPI = {
  // 케이스 관리
  cases: {
    // 케이스 목록 조회
    async list(status?: string): Promise<ClinicalCase[]> {
      const { fetchCases } = await import('@/lib/clinical-photos-api');
      return fetchCases(status);
    },

    // 특정 케이스 조회
    async get(caseId: number): Promise<ClinicalCase | null> {
      const { fetchCase } = await import('@/lib/clinical-photos-api');
      return fetchCase(caseId);
    },

    // 케이스 생성
    async create(caseData: {
      customerName: string;
      caseName: string;
      concernArea?: string;
      treatmentPlan?: string;
      consentReceived?: boolean;
      consentDate?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerBirthDate?: string;
      customerMemo?: string;
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
    }): Promise<ClinicalCase | null> {
      const { createCase } = await import('@/lib/clinical-photos-api');
      return createCase(caseData);
    },

    // 케이스 업데이트
    async update(caseId: number, updates: Partial<ClinicalCase>): Promise<ClinicalCase | null> {
      const { updateCase } = await import('@/lib/clinical-photos-api');
      return updateCase(caseId, updates);
    },

    // 케이스 삭제
    async remove(caseId: number): Promise<boolean> {
      const { deleteCase } = await import('@/lib/clinical-photos-api');
      return deleteCase(caseId);
    }
  },

  // 사진 관리
  photos: {
    // 사진 업로드
    async upload(caseId: number, roundNumber: number, angle: string, file: File): Promise<string> {
      const { uploadPhoto } = await import('@/lib/clinical-photos-api');
      return uploadPhoto(caseId, roundNumber, angle, file);
    },

    // 사진 삭제
    async remove(caseId: number, roundNumber: number, angle: string): Promise<void> {
      const { deletePhoto } = await import('@/lib/clinical-photos-api');
      return deletePhoto(caseId, roundNumber, angle);
    },

    // 사진 목록 조회
    async list(caseId: number): Promise<PhotoSlot[]> {
      const { fetchPhotos } = await import('@/lib/clinical-photos-api');
      return fetchPhotos(caseId);
    }
  },

  // 동의서 관리
  consent: {
    // 동의서 업로드
    async upload(caseId: number, file: File): Promise<string> {
      const { uploadConsentImage } = await import('@/lib/clinical-photos-api');
      return uploadConsentImage(caseId, file);
    }
  },

  // 회차별 고객 정보 관리
  roundInfo: {
    // 회차별 정보 저장/업데이트
    async save(caseId: number, roundNumber: number, roundInfo: {
      age?: number;
      gender?: 'male' | 'female' | 'other';
      treatmentType?: string;
      treatmentDate?: string;
      products?: string[];
      skinTypes?: string[];
      memo?: string;
    }): Promise<any> {
      const { saveRoundCustomerInfo } = await import('@/lib/clinical-photos-api');
      return saveRoundCustomerInfo(caseId, roundNumber, roundInfo);
    },

    // 회차별 정보 조회
    async fetch(caseId: number): Promise<any[]> {
      const { fetchRoundCustomerInfo } = await import('@/lib/clinical-photos-api');
      return fetchRoundCustomerInfo(caseId);
    }
  },

  // 유틸리티
  utils: {
    // 현재 KOL ID 조회
    async getCurrentKolId(): Promise<string> {
      const { getCurrentKolId } = await import('@/lib/clinical-photos-api');
      return getCurrentKolId();
    },

    // 이미지 업로드 (범용)
    async uploadImage(file: File, caseId: number, type: 'photo' | 'consent' = 'photo'): Promise<UploadResponse> {
      const { uploadImage } = await import('@/lib/clinical-photos-api');
      return uploadImage(file, caseId, type);
    },

    // 파일 읽기
    async readFileAsDataURL(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};

// 기본 export
export default clinicalPhotosAPI; 