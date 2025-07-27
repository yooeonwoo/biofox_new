import { toast } from 'sonner';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

// Convex HTTP 클라이언트 초기화
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
  try {
    // Convex는 문자열 ID를 사용하므로 임시로 변환
    // TODO: 적절한 ID 매핑 필요
    const convexCaseId = `clinical_cases_${caseId}` as Id<'clinical_cases'>;

    // 상태 매핑 (UI → Convex)
    const statusMap: Record<string, 'in_progress' | 'completed' | 'paused' | 'cancelled'> = {
      active: 'in_progress',
      completed: 'completed',
      archived: 'cancelled',
    };

    // 상태 업데이트만 지원 (현재 Convex mutation이 상태만 변경 가능)
    if (data.status) {
      await convex.mutation(api.clinical.updateClinicalCaseStatus, {
        caseId: convexCaseId,
        status: statusMap[data.status] || 'in_progress',
        notes: data.notes,
      });
    }

    // 업데이트된 케이스 조회
    const updatedCase = await convex.query(api.clinical.getClinicalCase, {
      caseId: convexCaseId,
    });

    if (!updatedCase) {
      throw new Error('Case not found after update');
    }

    // Convex 데이터를 UI 형식으로 변환
    return {
      id: caseId,
      kolId: 0, // TODO: 적절한 매핑 필요
      customerName: updatedCase.name,
      caseName: updatedCase.case_title || '케이스',
      concernArea: updatedCase.concern_area,
      treatmentPlan: updatedCase.treatment_plan || updatedCase.treatment_item,
      consentReceived: updatedCase.consent_status === 'consented',
      consentDate: updatedCase.consent_date
        ? new Date(updatedCase.consent_date).toISOString()
        : undefined,
      status:
        updatedCase.status === 'in_progress'
          ? 'active'
          : updatedCase.status === 'cancelled'
            ? 'archived'
            : (updatedCase.status as any),
      createdAt: new Date(updatedCase.created_at).toISOString(),
      updatedAt: new Date(updatedCase.updated_at).toISOString(),
      totalPhotos: updatedCase.photo_count || 0,

      // 제품/피부타입은 tags에서 추출
      cureBooster: updatedCase.tags?.includes('cure_booster'),
      cureMask: updatedCase.tags?.includes('cure_mask'),
      premiumMask: updatedCase.tags?.includes('premium_mask'),
      allInOneSerum: updatedCase.tags?.includes('all_in_one_serum'),
      skinRedSensitive: updatedCase.tags?.includes('skin_red_sensitive'),
      skinPigment: updatedCase.tags?.includes('skin_pigment'),
      skinPore: updatedCase.tags?.includes('skin_pore'),
      skinTrouble: updatedCase.tags?.includes('skin_trouble'),
      skinWrinkle: updatedCase.tags?.includes('skin_wrinkle'),
      skinEtc: updatedCase.tags?.includes('skin_etc'),
    };
  } catch (error: any) {
    console.error('updateCase error:', error);
    toast.error(`케이스 업데이트 실패: ${error.message}`);
    throw error;
  }
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
