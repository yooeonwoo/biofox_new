import { toast } from 'sonner';

export interface ClinicalCase {
  id: number;
  kolId: number; // Supabase clinical_cases.kol_id는 숫자형(KOL 내부 ID)
  customerId?: string; // Supabase에서는 customer_id가 string 타입임
  customerName: string;
  caseName: string;
  concernArea?: string;
  treatmentPlan?: string;
  consentReceived: boolean;
  consentDate?: string;
  status: 'active' | 'completed' | 'archived'; // Supabase와 일치하도록 'cancelled'에서 'archived'로 변경
  createdAt: string;
  updatedAt: string;
  totalPhotos?: number;
  completedRounds?: number;
  consentImageUrl?: string;
  
  // 플레이어 제품 선택 필드
  cureBooster?: boolean;
  cureMask?: boolean;
  premiumMask?: boolean;
  allInOneSerum?: boolean;
  
  // 고객 피부타입 필드
  skinRedSensitive?: boolean;
  skinPigment?: boolean;
  skinPore?: boolean;
  skinTrouble?: boolean;
  skinWrinkle?: boolean;
  skinEtc?: boolean;
}

export interface PhotoSlot {
  id: string;
  roundDay: number;
  angle: 'front' | 'left' | 'right';
  imageUrl?: string;
  uploaded: boolean;
  photoId?: number;
}

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Supabase 연동된 API 함수들 가져오기
import {
  fetchCases,
  fetchCase,
  createCase,
  updateCase,
  deleteCase,
  fetchPhotos,
  uploadImage,
  savePhoto,
  deletePhoto,
  uploadPhoto,
  uploadConsentImage
} from './clinical-photos-api';

// 기존 API 함수들을 export하여 기존 코드와의 호환성 유지
export {
  fetchCases,
  fetchCase,
  createCase,
  updateCase,
  deleteCase,
  fetchPhotos,
  uploadImage,
  savePhoto,
  deletePhoto,
  uploadPhoto,
  uploadConsentImage
};

// 동의서 업로드
export async function uploadConsentFile(caseId: number, file: File): Promise<UploadResponse> {
  return uploadImage(file, caseId, 'consent');
}