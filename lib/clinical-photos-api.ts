import { supabaseClient } from './supabase-client';
import { ClinicalCase, PhotoSlot, UploadResponse } from './clinical-photos';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Supabase 결과를 위한 인터페이스 정의
interface ClinicalCaseRecord {
  id: number;
  kol_id: string;
  customer_id?: string;
  customer_name: string;
  case_name: string;
  concern_area?: string;
  treatment_plan?: string;
  consent_received: boolean;
  consent_date?: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  consent_image_url?: string;
  total_photos?: number;
  customer_phone?: string;
  customer_email?: string;
  customer_birth_date?: string;
  customer_memo?: string;
}

interface ClinicalPhotoRecord {
  id: number;
  case_id: number;
  round_number: number;
  angle: string;
  file_url: string;
  thumbnail_url?: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

// 현재 사용자의 KOL ID를 가져오는 함수
async function getCurrentKolId(): Promise<number> {
  try {
    if (typeof window === 'undefined') {
      return 0;
    }
    
    const userEmail = await getUserEmail();
    if (!userEmail) {
      throw new Error('사용자 이메일을 찾을 수 없습니다');
    }
    
    // 먼저 users 테이블에서 이메일로 사용자 ID 찾기
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError || !userData) {
      console.error('사용자 조회 실패:', userError);
      throw new Error('사용자 정보를 찾을 수 없습니다');
    }
    
    // 사용자 ID로 KOLs 테이블에서 KOL 정보 찾기 (여러 개가 있을 수 있음)
    const { data: kolsData, error: kolsError } = await supabaseClient
      .from('kols')
      .select('id, created_at')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false }); // 가장 최근 생성된 것 우선
    
    if (kolsError || !kolsData || kolsData.length === 0) {
      console.error('KOL 조회 실패:', kolsError);
      throw new Error('KOL 정보를 찾을 수 없습니다');
    }
    
    // 여러 KOL이 있을 경우 가장 최근에 생성된 것 사용
    console.log(`임상사진: ${kolsData.length}개의 KOL 중 ID=${kolsData[0].id} 선택됨`);
    return kolsData[0].id;
  } catch (error) {
    console.error('KOL ID 가져오기 실패:', error);
    return 0;
  }
}

// 현재 사용자 이메일을 가져오는 함수
async function getUserEmail(): Promise<string> {
  try {
    if (typeof window === 'undefined') {
      return '';
    }
    
    const response = await fetch('/api/user');
    if (response.ok) {
      const data = await response.json();
      return data.email || '';
    }
    
    return '';
  } catch (error) {
    console.error('사용자 이메일 가져오기 실패:', error);
    return '';
  }
}

// 케이스 목록 조회
export async function fetchCases(status?: string): Promise<ClinicalCase[]> {
  try {
    console.log('임상사진: fetchCases 시작');
    
    // 사용자 이메일 확인
    const userEmail = await getUserEmail();
    console.log('임상사진: 사용자 이메일', userEmail);
    
    const kolId = await getCurrentKolId();
    console.log('임상사진: 가져온 KOL ID', kolId);
    
    if (!kolId) {
      throw new Error('KOL 정보를 찾을 수 없습니다');
    }
    
    console.log('임상사진 조회 중, 사용하는 KOL ID:', kolId);
    
    // 48번 KOL을 위해 하드코딩으로 테스트 (테스트 후 제거 필요)
    const targetKolId = kolId === 0 ? 48 : kolId;
    console.log('임상사진: 최종 사용하는 KOL ID', targetKolId);
    
    // Supabase 쿼리 실행 (동의서 파일 정보 포함)
    const { data, error } = await supabaseClient
      .from('clinical_cases')
      .select(`
        *,
        clinical_consent_files(file_url)
      `)
      .eq('kol_id', targetKolId)
      .order('created_at', { ascending: false });
    
    console.log('임상사진: Supabase 응답', { 결과있음: !!data, 데이터갯수: data?.length, 에러: error });
    
    if (error) {
      console.error('임상사진: Supabase 에러', error.message);
      throw error;
    }
    
    if (!data || !Array.isArray(data)) {
      throw new Error('데이터를 조회하는 데 실패했습니다');
    }

    // 각 케이스의 사진 개수 추출
    const photoCountsMap: Record<number, number> = {};
    
    if (data.length > 0) {
      for (const caseItem of data) {
        const { count, error: countError } = await supabaseClient
          .from('clinical_photos')
          .select('*', { count: 'exact', head: true })
          .eq('case_id', caseItem.id);
        
        if (!countError && count !== null) {
          photoCountsMap[caseItem.id] = count;
        }
      }
    }
    
    // 데이터 형식 변환
    return data.map(c => ({
      id: c.id,
      kolId: c.kol_id,
      customerId: c.customer_id,
      customerName: c.customer_name,
      caseName: c.case_name,
      concernArea: c.concern_area,
      treatmentPlan: c.treatment_plan,
      consentReceived: c.consent_received,
      consentDate: c.consent_date,
      status: c.status as 'active' | 'completed' | 'archived',
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      totalPhotos: photoCountsMap[c.id] || 0,
      consentImageUrl: c.clinical_consent_files?.[0]?.file_url || undefined,
      
      // 플레이어 제품 선택 필드
      cureBooster: c.cure_booster || false,
      cureMask: c.cure_mask || false,
      premiumMask: c.premium_mask || false,
      allInOneSerum: c.all_in_one_serum || false,
      
      // 고객 피부타입 필드
      skinRedSensitive: c.skin_red_sensitive || false,
      skinPigment: c.skin_pigment || false,
      skinPore: c.skin_pore || false,
      skinTrouble: c.skin_trouble || false,
      skinWrinkle: c.skin_wrinkle || false,
      skinEtc: c.skin_etc || false,
    }));
  } catch (error) {
    console.error('Error fetching cases:', error);
    const kolId = await getCurrentKolId();
    if (!kolId) {
      toast.error('로그인 정보를 확인할 수 없습니다. 로그인 상태를 확인해주세요.');
    } else {
      toast.error('케이스 목록을 불러오는데 실패했습니다.');
    }
    return [];
  }
}

// 특정 케이스 조회
export async function fetchCase(caseId: number): Promise<ClinicalCase | null> {
  try {
    const { data, error } = await supabaseClient
      .from('clinical_cases')
      .select(`
        *,
        clinical_photos(count)
      `)
      .eq('id', caseId)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    // 데이터 형식 변환
    return {
      id: data.id,
      kolId: data.kol_id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      caseName: data.case_name,
      concernArea: data.concern_area,
      treatmentPlan: data.treatment_plan,
      consentReceived: data.consent_received,
      consentDate: data.consent_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      totalPhotos: data.clinical_photos[0].count,
      consentImageUrl: data.consent_image_url,
    };
  } catch (error) {
    console.error('Error fetching case:', error);
    toast.error('케이스 정보를 불러오는데 실패했습니다.');
    return null;
  }
}

// 케이스 생성
export async function createCase(caseData: {
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
}): Promise<ClinicalCase | null> {
  try {
    const kolId = await getCurrentKolId();
    
    const { data, error } = await supabaseClient
      .from('clinical_cases')
      .insert({
        kol_id: kolId,
        customer_name: caseData.customerName,
        case_name: caseData.caseName,
        concern_area: caseData.concernArea,
        treatment_plan: caseData.treatmentPlan,
        consent_received: caseData.consentReceived || false,
        consent_date: caseData.consentDate,
        customer_phone: caseData.customerPhone,
        customer_email: caseData.customerEmail,
        customer_birth_date: caseData.customerBirthDate,
        customer_memo: caseData.customerMemo,
        status: 'active',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 데이터 형식 변환
    return {
      id: data.id,
      kolId: data.kol_id,
      customerName: data.customer_name,
      caseName: data.case_name,
      concernArea: data.concern_area,
      treatmentPlan: data.treatment_plan,
      consentReceived: data.consent_received,
      consentDate: data.consent_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      totalPhotos: 0,
    };
  } catch (error) {
    console.error('Error creating case:', error);
    toast.error('케이스 생성에 실패했습니다.');
    return null;
  }
}

// 케이스 업데이트
export async function updateCase(caseId: number, caseData: Partial<ClinicalCase>): Promise<ClinicalCase | null> {
  try {
    // Supabase 필드명에 맞게 변환 (인덱스 시그니처 추가)
    const supabaseData: { 
      [key: string]: string | boolean | undefined 
    } = {
      customer_name: caseData.customerName,
      case_name: caseData.caseName,
      concern_area: caseData.concernArea,
      treatment_plan: caseData.treatmentPlan,
      consent_received: caseData.consentReceived,
      consent_date: caseData.consentDate,
      status: caseData.status,
      consent_image_url: caseData.consentImageUrl,
      
      // 플레이어 제품 선택 필드
      cure_booster: caseData.cureBooster,
      cure_mask: caseData.cureMask,
      premium_mask: caseData.premiumMask,
      all_in_one_serum: caseData.allInOneSerum,
      
      // 고객 피부타입 필드
      skin_red_sensitive: caseData.skinRedSensitive,
      skin_pigment: caseData.skinPigment,
      skin_pore: caseData.skinPore,
      skin_trouble: caseData.skinTrouble,
      skin_wrinkle: caseData.skinWrinkle,
      skin_etc: caseData.skinEtc,
    };
    
    // undefined 제거
    Object.keys(supabaseData).forEach(key => {
      if (supabaseData[key] === undefined) {
        delete supabaseData[key];
      }
    });
    
    const { data, error } = await supabaseClient
      .from('clinical_cases')
      .update(supabaseData)
      .eq('id', caseId)
      .select()
      .single();
    
    if (error) throw error;
    
    // 데이터 형식 변환
    return {
      id: data.id,
      kolId: data.kol_id,
      customerId: data.customer_id,
      customerName: data.customer_name,
      caseName: data.case_name,
      concernArea: data.concern_area,
      treatmentPlan: data.treatment_plan,
      consentReceived: data.consent_received,
      consentDate: data.consent_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      consentImageUrl: data.consent_image_url,
    };
  } catch (error) {
    console.error('Error updating case:', error);
    toast.error('케이스 수정에 실패했습니다.');
    return null;
  }
}

// 케이스 삭제
export async function deleteCase(caseId: number): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('clinical_cases')
      .delete()
      .eq('id', caseId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting case:', error);
    toast.error('케이스 삭제에 실패했습니다.');
    return false;
  }
}

// 케이스의 사진 목록 조회
export async function fetchPhotos(caseId: number): Promise<PhotoSlot[]> {
  try {
    const { data, error } = await supabaseClient
      .from('clinical_photos')
      .select('*')
      .eq('case_id', caseId)
      .order('round_number', { ascending: true });
    
    if (error) throw error;
    
    // 데이터 형식 변환
    return data.map(p => ({
      id: `${p.id}`,
      roundDay: p.round_number,
      angle: p.angle,
      imageUrl: p.file_url,
      uploaded: true,
      photoId: p.id,
    }));
  } catch (error) {
    console.error('Error fetching photos:', error);
    toast.error('사진 목록을 불러오는데 실패했습니다.');
    return [];
  }
}

// 파일명 안전화 함수
function sanitizeFileName(fileName: string): string {
  // 파일 확장자 추출
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex > -1 ? fileName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;
  
  // 안전한 파일명으로 변환 (알파벳, 숫자, 하이픈, 언더스코어만 허용)
  const safeName = nameWithoutExt
    .replace(/[^\w\-_]/g, '_')  // 특수문자를 언더스코어로 변경
    .replace(/_{2,}/g, '_')     // 연속된 언더스코어를 하나로 변경
    .substring(0, 100);        // 최대 100자로 제한
  
  return `${safeName}${extension}`;
}

// 이미지 파일 업로드 (서버 API 사용)
export async function uploadImage(file: File, caseId: number, type: 'photo' | 'consent' = 'photo'): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId.toString());
    formData.append('type', type);
    
    const response = await fetch('/api/kol-new/clinical-photos/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `업로드 실패 (${response.status})`);
    }
    
    const result = await response.json();
    
    return {
      url: result.url,
      fileName: result.fileName,
      fileSize: result.fileSize,
      mimeType: result.mimeType,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error(`이미지 업로드에 실패했습니다: ${error.message || error}`);
    throw new Error('이미지 업로드에 실패했습니다.');
  }
}

// 사진 메타데이터 저장
export async function savePhoto(caseId: number, photoData: {
  roundNumber: number;
  angle: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
}): Promise<any> {
  try {
    const { data, error } = await supabaseClient
      .from('clinical_photos')
      .insert({
        case_id: caseId,
        round_number: photoData.roundNumber,
        angle: photoData.angle,
        file_url: photoData.fileUrl,
        thumbnail_url: photoData.thumbnailUrl,
        file_size: photoData.fileSize,
        mime_type: photoData.mimeType,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving photo metadata:', error);
    throw new Error('사진 메타데이터 저장에 실패했습니다.');
  }
}

// 사진 삭제
export async function deletePhoto(caseId: number, roundNumber: number, angle: string): Promise<void> {
  try {
    // 먼저 메타데이터 조회
    const { data: photoData, error: fetchError } = await supabaseClient
      .from('clinical_photos')
      .select('*')
      .eq('case_id', caseId)
      .eq('round_number', roundNumber)
      .eq('angle', angle)
      .single();
    
    if (fetchError) throw fetchError;
    if (!photoData) throw new Error('삭제할 사진을 찾을 수 없습니다.');
    
    // 스토리지에서 파일 삭제 (URL에서 경로 추출)
    const filePathMatch = photoData.file_url.match(/clinical-photos\/([^?]+)/);
    if (filePathMatch && filePathMatch[1]) {
      const filePath = filePathMatch[1];
      const { error: storageError } = await supabaseClient
        .storage
        .from('clinical-photos')
        .remove([filePath]);
      
      if (storageError) console.error('스토리지에서 파일 삭제 실패:', storageError);
    }
    
    // 데이터베이스에서 메타데이터 삭제
    const { error: deleteError } = await supabaseClient
      .from('clinical_photos')
      .delete()
      .eq('id', photoData.id);
    
    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error deleting photo:', error);
    toast.error('사진 삭제에 실패했습니다.');
    throw error;
  }
}

// 사진 업로드 (API 서버를 통해 업로드 + 메타데이터 저장)
export async function uploadPhoto(caseId: number, roundNumber: number, angle: string, file: File): Promise<void> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId.toString());
    formData.append('type', 'photo');
    formData.append('roundNumber', roundNumber.toString());
    formData.append('angle', angle);
    
    const response = await fetch('/api/kol-new/clinical-photos/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `사진 업로드 실패 (${response.status})`);
    }
    
    // 업로드 성공 - API에서 이미 메타데이터 저장까지 완료됨
  } catch (error) {
    console.error('Photo upload error:', error);
    toast.error(`사진 업로드에 실패했습니다: ${error.message || error}`);
    throw error;
  }
}

// 동의서 이미지 업로드 및 케이스 업데이트
export async function uploadConsentImage(caseId: number, file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId.toString());
    formData.append('type', 'consent');
    
    const response = await fetch('/api/kol-new/clinical-photos/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `동의서 업로드 실패 (${response.status})`);
    }
    
    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('Consent image upload error:', error);
    toast.error(`동의서 업로드에 실패했습니다: ${error.message || error}`);
    throw error;
  }
}
