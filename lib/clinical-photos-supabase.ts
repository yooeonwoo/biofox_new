'use client';

import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { PhotoSlot, ClinicalCase } from '@/types/clinical';

// 클라이언트 인스턴스들
const supabase = createClient();

// 에러 핸들링 유틸리티
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Supabase ${operation} error:`, error);
  const message = error?.message || 'Unknown error occurred';
  throw new Error(`${operation} 실패: ${message}`);
};

// 성공 로깅 유틸리티
const logSuccess = (operation: string, data?: any) => {
  console.log(`✅ Supabase ${operation} success:`, data ? Object.keys(data) : 'completed');
};

// =================================
// 타입 정의 (Convex 호환)
// =================================

// Convex 호환 Clinical Case 타입
interface ConvexCompatibleCase {
  _id: string; // Supabase id → _id 변환
  profile_id: string;
  name: string;
  concern_area?: string;
  treatment_plan?: string;
  consent_status: 'no_consent' | 'consented' | 'pending';
  consent_date?: string;
  consent_image_url?: string;
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled' | 'active' | 'archived';
  subject_type: 'self' | 'customer';
  metadata?: any;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  marketing_consent?: boolean;
  notes?: string;
  tags?: string[];
  cure_booster?: boolean;
  cure_mask?: boolean;
  premium_mask?: boolean;
  all_in_one_serum?: boolean;
  skin_red_sensitive?: boolean;
  skin_pigment?: boolean;
  skin_pore?: boolean;
  skin_trouble?: boolean;
  skin_wrinkle?: boolean;
  skin_etc?: boolean;
  created_at: string;
  updated_at: string;
  case_title?: string;
  treatment_item?: string;
  start_date?: string;
  end_date?: string;
  latest_session?: number;
  total_sessions?: number;
  photo_count?: number;
  custom_fields?: any;
}

// =================================
// 데이터 변환 어댑터 함수들
// =================================

// Supabase → Convex 데이터 변환 어댑터
const transformCaseForConvex = (supabaseCase: any): ConvexCompatibleCase => {
  logSuccess('transformCaseForConvex', supabaseCase);

  return {
    _id: supabaseCase.id,
    profile_id: supabaseCase.profile_id,
    name: supabaseCase.name,
    concern_area: supabaseCase.concern_area,
    treatment_plan: supabaseCase.treatment_plan,
    consent_status: supabaseCase.consent_status || 'no_consent',
    consent_date: supabaseCase.consent_date,
    consent_image_url: supabaseCase.consent_image_url,
    status: supabaseCase.status || 'in_progress',
    subject_type: supabaseCase.subject_type || 'customer',
    metadata: supabaseCase.metadata || {},
    age: supabaseCase.age,
    gender: supabaseCase.gender,
    marketing_consent: supabaseCase.marketing_consent || false,
    notes: supabaseCase.notes,
    tags: supabaseCase.tags || [],
    cure_booster: supabaseCase.cure_booster || false,
    cure_mask: supabaseCase.cure_mask || false,
    premium_mask: supabaseCase.premium_mask || false,
    all_in_one_serum: supabaseCase.all_in_one_serum || false,
    skin_red_sensitive: supabaseCase.skin_red_sensitive || false,
    skin_pigment: supabaseCase.skin_pigment || false,
    skin_pore: supabaseCase.skin_pore || false,
    skin_trouble: supabaseCase.skin_trouble || false,
    skin_wrinkle: supabaseCase.skin_wrinkle || false,
    skin_etc: supabaseCase.skin_etc || false,
    created_at: supabaseCase.created_at,
    updated_at: supabaseCase.updated_at,
    case_title: supabaseCase.case_title,
    treatment_item: supabaseCase.treatment_item,
    start_date: supabaseCase.start_date,
    end_date: supabaseCase.end_date,
    latest_session: supabaseCase.latest_session || 0,
    total_sessions: supabaseCase.total_sessions || 0,
    photo_count: supabaseCase.photo_count || 0,
    custom_fields: supabaseCase.custom_fields || {},
  };
};

// PhotoSlot 변환 어댑터
const transformPhotoSlot = (supabasePhoto: any): PhotoSlot => {
  logSuccess('transformPhotoSlot', supabasePhoto);

  return {
    id: supabasePhoto.id,
    roundDay: supabasePhoto.session_number || 1,
    angle: mapPhotoType(supabasePhoto.photo_type),
    imageUrl: supabasePhoto.storage_path,
    url: supabasePhoto.storage_path,
    session_number: supabasePhoto.session_number,
    uploaded: !!supabasePhoto.storage_path,
    photoId: supabasePhoto.id,
  };
};

// photo_type 매핑 헬퍼
const mapPhotoType = (photoType: string): 'front' | 'left' | 'right' => {
  switch (photoType) {
    case 'left_side':
      return 'left';
    case 'right_side':
      return 'right';
    case 'front':
    default:
      return 'front';
  }
};

// Convex → Supabase 생성 데이터 변환
const transformCreateCaseForSupabase = (convexData: any) => {
  logSuccess('transformCreateCaseForSupabase', convexData);

  return {
    profile_id: convexData.profileId || convexData.profile_id,
    name: convexData.customerName || convexData.name,
    concern_area: convexData.concernArea || convexData.concern_area,
    treatment_plan: convexData.treatmentPlan || convexData.treatment_plan,
    consent_status: convexData.consentReceived ? 'consented' : 'no_consent',
    subject_type: convexData.subject_type || 'customer',
    age: convexData.age,
    gender: convexData.gender,
    marketing_consent: convexData.marketing_consent || false,
    notes: convexData.notes || '',
    case_title: convexData.caseName || convexData.case_title,
    treatment_item: convexData.treatment_item,
    // 제품 선택들
    cure_booster: convexData.cureBooster || false,
    cure_mask: convexData.cureMask || false,
    premium_mask: convexData.premiumMask || false,
    all_in_one_serum: convexData.allInOneSerum || false,
    // 피부타입들
    skin_red_sensitive: convexData.skinRedSensitive || false,
    skin_pigment: convexData.skinPigment || false,
    skin_pore: convexData.skinPore || false,
    skin_trouble: convexData.skinTrouble || false,
    skin_wrinkle: convexData.skinWrinkle || false,
    skin_etc: convexData.skinEtc || false,
    metadata: convexData.metadata || {},
  };
};

// 기본 export
export {
  supabase,
  handleSupabaseError,
  logSuccess,
  transformCaseForConvex,
  transformPhotoSlot,
  transformCreateCaseForSupabase,
};

// =================================
// Clinical Cases 관리 함수들
// =================================

/**
 * 케이스 목록 조회 (필터링 지원)
 */
export async function listClinicalCases(profileId: string, filters?: any) {
  try {
    logSuccess('listClinicalCases', { profileId, filters });

    let query = supabase.from('clinical_cases_with_stats').select('*').eq('profile_id', profileId);

    // 필터 적용
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.consent_status) {
      query = query.eq('consent_status', filters.consent_status);
    }
    if (filters?.subject_type) {
      query = query.eq('subject_type', filters.subject_type);
    }

    // 정렬: 최신순
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'listClinicalCases');

    logSuccess('listClinicalCases result', { count: data?.length });
    return data?.map(transformCaseForConvex) || [];
  } catch (error) {
    handleSupabaseError(error, 'listClinicalCases');
    return [];
  }
}

/**
 * 개별 케이스 조회 (통계 포함)
 */
export async function getClinicalCase(caseId: string) {
  try {
    logSuccess('getClinicalCase', { caseId });

    const { data, error } = await supabase
      .from('clinical_cases_with_stats')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) handleSupabaseError(error, 'getClinicalCase');

    logSuccess('getClinicalCase result', data);
    return data ? transformCaseForConvex(data) : null;
  } catch (error) {
    handleSupabaseError(error, 'getClinicalCase');
    return null;
  }
}

/**
 * 새 케이스 생성
 */
export async function createClinicalCase(caseData: any) {
  try {
    logSuccess('createClinicalCase', caseData);

    const supabaseData = transformCreateCaseForSupabase(caseData);

    const { data, error } = await supabase
      .from('clinical_cases')
      .insert([supabaseData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'createClinicalCase');

    logSuccess('createClinicalCase result', data);
    return transformCaseForConvex(data);
  } catch (error) {
    handleSupabaseError(error, 'createClinicalCase');
    throw error;
  }
}

/**
 * 케이스 정보 업데이트
 */
export async function updateClinicalCase(caseId: string, updates: any) {
  try {
    logSuccess('updateClinicalCase', { caseId, updates });

    const supabaseUpdates = transformCreateCaseForSupabase(updates);

    const { data, error } = await supabase
      .from('clinical_cases')
      .update(supabaseUpdates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'updateClinicalCase');

    logSuccess('updateClinicalCase result', data);
    return transformCaseForConvex(data);
  } catch (error) {
    handleSupabaseError(error, 'updateClinicalCase');
    throw error;
  }
}

/**
 * 케이스 상태 업데이트
 */
export async function updateClinicalCaseStatus(caseId: string, status: string, notes?: string) {
  try {
    logSuccess('updateClinicalCaseStatus', { caseId, status, notes });

    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('clinical_cases')
      .update(updates)
      .eq('id', caseId)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'updateClinicalCaseStatus');

    logSuccess('updateClinicalCaseStatus result', data);
    return transformCaseForConvex(data);
  } catch (error) {
    handleSupabaseError(error, 'updateClinicalCaseStatus');
    throw error;
  }
}

/**
 * 케이스 삭제
 */
export async function deleteClinicalCase(caseId: string) {
  try {
    logSuccess('deleteClinicalCase', { caseId });

    const { error } = await supabase.from('clinical_cases').delete().eq('id', caseId);

    if (error) handleSupabaseError(error, 'deleteClinicalCase');

    logSuccess('deleteClinicalCase result', 'success');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteClinicalCase');
    throw error;
  }
}

/**
 * 케이스 통계 조회
 */
export async function getClinicalCaseStats(profileId?: string) {
  try {
    logSuccess('getClinicalCaseStats', { profileId });

    let query = supabase
      .from('clinical_cases_with_stats')
      .select('status, consent_status, subject_type, total_photos, total_sessions');

    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'getClinicalCaseStats');

    // 통계 계산
    const stats = {
      total: data?.length || 0,
      in_progress: data?.filter(c => c.status === 'in_progress').length || 0,
      completed: data?.filter(c => c.status === 'completed').length || 0,
      with_consent: data?.filter(c => c.consent_status === 'consented').length || 0,
      total_photos: data?.reduce((sum, c) => sum + (c.total_photos || 0), 0) || 0,
      total_sessions: data?.reduce((sum, c) => sum + (c.total_sessions || 0), 0) || 0,
    };

    logSuccess('getClinicalCaseStats result', stats);
    return stats;
  } catch (error) {
    handleSupabaseError(error, 'getClinicalCaseStats');
    return {
      total: 0,
      in_progress: 0,
      completed: 0,
      with_consent: 0,
      total_photos: 0,
      total_sessions: 0,
    };
  }
}

// =================================
// 파일 관리 함수들
// =================================

/**
 * 케이스의 사진 목록 조회
 */
export async function getClinicalPhotos(caseId: string) {
  try {
    logSuccess('getClinicalPhotos', { caseId });

    const { data, error } = await supabase
      .from('clinical_photos')
      .select('*')
      .eq('clinical_case_id', caseId)
      .order('session_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) handleSupabaseError(error, 'getClinicalPhotos');

    logSuccess('getClinicalPhotos result', { count: data?.length });
    return data?.map(transformPhotoSlot) || [];
  } catch (error) {
    handleSupabaseError(error, 'getClinicalPhotos');
    return [];
  }
}

/**
 * 특정 세션의 사진들 조회
 */
export async function getClinicalPhotosBySession(caseId: string, sessionNumber: number) {
  try {
    logSuccess('getClinicalPhotosBySession', { caseId, sessionNumber });

    const { data, error } = await supabase
      .from('clinical_photos')
      .select('*')
      .eq('clinical_case_id', caseId)
      .eq('session_number', sessionNumber)
      .order('created_at', { ascending: true });

    if (error) handleSupabaseError(error, 'getClinicalPhotosBySession');

    logSuccess('getClinicalPhotosBySession result', { count: data?.length });
    return data?.map(transformPhotoSlot) || [];
  } catch (error) {
    handleSupabaseError(error, 'getClinicalPhotosBySession');
    return [];
  }
}

/**
 * 사진 메타데이터 저장
 */
export async function saveClinicalPhoto(photoData: any) {
  try {
    logSuccess('saveClinicalPhoto', photoData);

    const { data, error } = await supabase
      .from('clinical_photos')
      .insert([photoData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'saveClinicalPhoto');

    logSuccess('saveClinicalPhoto result', data);
    return transformPhotoSlot(data);
  } catch (error) {
    handleSupabaseError(error, 'saveClinicalPhoto');
    throw error;
  }
}

/**
 * 사진 삭제
 */
export async function deleteClinicalPhoto(photoId: string) {
  try {
    logSuccess('deleteClinicalPhoto', { photoId });

    const { error } = await supabase.from('clinical_photos').delete().eq('id', photoId);

    if (error) handleSupabaseError(error, 'deleteClinicalPhoto');

    logSuccess('deleteClinicalPhoto result', 'success');
    return true;
  } catch (error) {
    handleSupabaseError(error, 'deleteClinicalPhoto');
    throw error;
  }
}

/**
 * Supabase Storage 업로드 URL 생성
 */
export async function generateUploadUrl() {
  try {
    logSuccess('generateUploadUrl');

    // Supabase Storage 업로드를 위한 signed URL 생성
    const fileName = `clinical-photo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabase.storage
      .from('clinical-photos')
      .createSignedUploadUrl(fileName);

    if (error) handleSupabaseError(error, 'generateUploadUrl');

    logSuccess('generateUploadUrl result', { signedUrl: !!data?.signedUrl });
    return data?.signedUrl || '';
  } catch (error) {
    handleSupabaseError(error, 'generateUploadUrl');
    throw error;
  }
}

/**
 * 파일 URL 조회
 */
export async function getFileUrl(filePath: string) {
  try {
    logSuccess('getFileUrl', { filePath });

    const { data } = supabase.storage.from('clinical-photos').getPublicUrl(filePath);

    logSuccess('getFileUrl result', { publicUrl: !!data?.publicUrl });
    return data?.publicUrl || '';
  } catch (error) {
    handleSupabaseError(error, 'getFileUrl');
    return '';
  }
}

/**
 * 동의서 파일 저장
 */
export async function saveConsentFile(fileData: any) {
  try {
    logSuccess('saveConsentFile', fileData);

    const { data, error } = await supabase
      .from('consent_files')
      .insert([fileData])
      .select()
      .single();

    if (error) handleSupabaseError(error, 'saveConsentFile');

    logSuccess('saveConsentFile result', data);
    return data;
  } catch (error) {
    handleSupabaseError(error, 'saveConsentFile');
    throw error;
  }
}

/**
 * 동의서 파일 조회
 */
export async function getConsentFile(caseId: string) {
  try {
    logSuccess('getConsentFile', { caseId });

    const { data, error } = await supabase
      .from('consent_files')
      .select('*')
      .eq('clinical_case_id', caseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      handleSupabaseError(error, 'getConsentFile');
    }

    logSuccess('getConsentFile result', data);
    return data || null;
  } catch (error) {
    handleSupabaseError(error, 'getConsentFile');
    return null;
  }
}

// =================================
// 라운드별 관리 함수들
// =================================

/**
 * 라운드별 고객 정보 저장
 */
export async function saveRoundCustomerInfo(caseId: string, roundNumber: number, info: any) {
  try {
    logSuccess('saveRoundCustomerInfo', { caseId, roundNumber, info });

    const { data, error } = await supabase.rpc('save_round_customer_info', {
      p_case_id: caseId,
      p_round_number: roundNumber,
      p_age: info.age,
      p_gender: info.gender,
      p_treatment_type: info.treatmentType,
      p_treatment_date: info.treatmentDate,
      p_products: info.products || [],
      p_skin_types: info.skinTypes || [],
      p_memo: info.memo,
    });

    if (error) handleSupabaseError(error, 'saveRoundCustomerInfo');

    logSuccess('saveRoundCustomerInfo result', data);
    return data;
  } catch (error) {
    handleSupabaseError(error, 'saveRoundCustomerInfo');
    throw error;
  }
}

/**
 * 라운드별 고객 정보 조회
 */
export async function getRoundCustomerInfo(caseId: string) {
  try {
    logSuccess('getRoundCustomerInfo', { caseId });

    const { data, error } = await supabase.rpc('get_round_customer_info', {
      p_case_id: caseId,
    });

    if (error) handleSupabaseError(error, 'getRoundCustomerInfo');

    logSuccess('getRoundCustomerInfo result', { count: data?.length });
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'getRoundCustomerInfo');
    return [];
  }
}

// ✅ Step 1 완료: Supabase API 레이어 구축 완료!
