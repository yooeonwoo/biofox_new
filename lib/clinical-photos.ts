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

// 임시 더미 함수들 (Convex 마이그레이션 중)
export async function fetchCases(): Promise<ClinicalCase[]> {
  console.log('fetchCases called - returning dummy data');
  return [];
}

export async function fetchCase(caseId: number): Promise<ClinicalCase | null> {
  console.log('fetchCase called - returning null');
  return null;
}

export async function createCase(data: any): Promise<ClinicalCase> {
  console.log('createCase called - returning dummy case');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function updateCase(caseId: number, data: any): Promise<ClinicalCase> {
  console.log('updateCase called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function deleteCase(caseId: number): Promise<void> {
  console.log('deleteCase called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function fetchPhotos(caseId: number): Promise<any[]> {
  console.log('fetchPhotos called - returning empty array');
  return [];
}

export async function uploadImage(
  file: File,
  caseId: number,
  type: string
): Promise<UploadResponse> {
  console.log('uploadImage called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function savePhoto(data: any): Promise<any> {
  console.log('savePhoto called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function deletePhoto(photoId: number): Promise<void> {
  console.log('deletePhoto called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function uploadPhoto(
  caseId: number,
  roundDay: number,
  angle: string,
  file: File
): Promise<any> {
  console.log('uploadPhoto called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function uploadConsentImage(caseId: number, file: File): Promise<string> {
  console.log('uploadConsentImage called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function saveRoundCustomerInfo(
  caseId: number,
  roundDay: number,
  data: any
): Promise<any> {
  console.log('saveRoundCustomerInfo called');
  throw new Error('Not implemented - use Convex hooks instead');
}

export async function fetchRoundCustomerInfo(caseId: number): Promise<any> {
  console.log('fetchRoundCustomerInfo called');
  return {};
}

// 동의서 업로드
export async function uploadConsentFile(caseId: number, file: File): Promise<UploadResponse> {
  return uploadImage(file, caseId, 'consent');
}
