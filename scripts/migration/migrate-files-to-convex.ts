/**
 * Supabase Storage에서 Convex Storage로 파일 마이그레이션 스크립트
 *
 * 기능:
 * - 임상 사진 및 동의서 파일 마이그레이션
 * - 배치 처리 및 에러 복구
 * - 진행률 표시 및 상세 로깅
 * - 재시작 가능한 구조
 */

import { createClient } from '@supabase/supabase-js';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// =====================================
// 환경 설정 및 클라이언트 초기화
// =====================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!supabaseUrl || !supabaseServiceKey || !convexUrl) {
  throw new Error('필수 환경변수가 설정되지 않았습니다.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const convex = new ConvexHttpClient(convexUrl);

// =====================================
// 타입 정의
// =====================================

interface SupabaseClinicalPhoto {
  id: string;
  clinical_case_id: string;
  session_number: number;
  photo_type: 'front' | 'left_side' | 'right_side';
  file_path: string;
  file_size?: number;
  created_at: string;
  metadata?: any;
}

interface SupabaseConsentFile {
  id: string;
  clinical_case_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface MigrationResult {
  success: boolean;
  supabaseId: string;
  convexId?: Id<'clinical_photos'> | Id<'consent_files'>;
  storageId?: Id<'_storage'>;
  error?: string;
  retryCount: number;
}

interface MigrationState {
  startedAt: string;
  completedClinicalPhotos: string[];
  completedConsentFiles: string[];
  failedItems: Array<{
    id: string;
    type: 'clinical_photo' | 'consent_file';
    error: string;
    retryCount: number;
  }>;
  stats: {
    totalClinicalPhotos: number;
    totalConsentFiles: number;
    successfulClinicalPhotos: number;
    successfulConsentFiles: number;
    failedClinicalPhotos: number;
    failedConsentFiles: number;
  };
}

// =====================================
// 상태 관리 유틸리티
// =====================================

const STATE_FILE = join(process.cwd(), 'migration-data', 'file-migration-state.json');
const LOG_FILE = join(process.cwd(), 'migration-data', 'file-migration.log');

function loadMigrationState(): MigrationState {
  if (existsSync(STATE_FILE)) {
    try {
      const content = readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ 기존 상태 파일을 읽을 수 없습니다. 새로 시작합니다.');
    }
  }

  return {
    startedAt: new Date().toISOString(),
    completedClinicalPhotos: [],
    completedConsentFiles: [],
    failedItems: [],
    stats: {
      totalClinicalPhotos: 0,
      totalConsentFiles: 0,
      successfulClinicalPhotos: 0,
      successfulConsentFiles: 0,
      failedClinicalPhotos: 0,
      failedConsentFiles: 0,
    },
  };
}

function saveMigrationState(state: MigrationState): void {
  const outputDir = join(process.cwd(), 'migration-data');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function logMessage(message: string): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(logLine);

  const outputDir = join(process.cwd(), 'migration-data');
  mkdirSync(outputDir, { recursive: true });

  try {
    const existingLog = existsSync(LOG_FILE) ? readFileSync(LOG_FILE, 'utf-8') : '';
    writeFileSync(LOG_FILE, existingLog + logLine + '\n', 'utf-8');
  } catch (error) {
    console.warn('⚠️ 로그 파일 쓰기 실패:', error);
  }
}

// =====================================
// 파일 다운로드 및 업로드 유틸리티
// =====================================

async function downloadFileFromSupabase(filePath: string): Promise<Buffer> {
  try {
    const { data, error } = await supabase.storage
      .from('clinical-photos') // 기본 버킷, 필요시 동적으로 변경
      .download(filePath);

    if (error) {
      throw new Error(`Supabase 다운로드 실패: ${error.message}`);
    }

    if (!data) {
      throw new Error('파일 데이터가 없습니다');
    }

    return Buffer.from(await data.arrayBuffer());
  } catch (error) {
    // 다른 버킷에서도 시도
    try {
      const { data, error: error2 } = await supabase.storage
        .from('consent-files')
        .download(filePath);

      if (error2) {
        throw error; // 원래 에러를 던짐
      }

      if (!data) {
        throw error;
      }

      return Buffer.from(await data.arrayBuffer());
    } catch {
      throw error; // 원래 에러를 던짐
    }
  }
}

async function uploadFileToConvex(fileBuffer: Buffer, filename: string): Promise<Id<'_storage'>> {
  try {
    // 1. 업로드 URL 생성
    const uploadUrl = await convex.mutation(api.fileStorage.generateUploadUrl, {});

    // 2. 파일 업로드
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Convex 업로드 실패: ${uploadResponse.statusText} - ${errorText}`);
    }

    const result = await uploadResponse.json();
    return result.storageId as Id<'_storage'>;
  } catch (error) {
    throw new Error(
      `Convex 업로드 실패: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// =====================================
// 마이그레이션 로직
// =====================================

async function migrateClinicalPhoto(
  photo: SupabaseClinicalPhoto,
  retryCount: number = 0
): Promise<MigrationResult> {
  const maxRetries = 3;

  try {
    logMessage(`📸 임상 사진 마이그레이션 시작: ${photo.id} (재시도: ${retryCount})`);

    // 1. 파일 다운로드
    const fileBuffer = await downloadFileFromSupabase(photo.file_path);
    logMessage(`✅ 파일 다운로드 완료: ${photo.file_path} (${fileBuffer.length} bytes)`);

    // 2. Convex Storage에 업로드
    const storageId = await uploadFileToConvex(fileBuffer, photo.file_path);
    logMessage(`✅ Convex Storage 업로드 완료: ${storageId}`);

    // 3. Convex DB에 메타데이터 저장
    const convexId = await convex.mutation(api.fileStorage.saveClinicalPhoto, {
      storageId,
      clinical_case_id: photo.clinical_case_id as Id<'clinical_cases'>,
      session_number: photo.session_number,
      photo_type: photo.photo_type,
      file_size: photo.file_size,
      metadata: photo.metadata,
    });

    logMessage(`✅ 임상 사진 마이그레이션 완료: ${photo.id} → ${convexId}`);

    return {
      success: true,
      supabaseId: photo.id,
      convexId: convexId as Id<'clinical_photos'>,
      storageId,
      retryCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logMessage(`❌ 임상 사진 마이그레이션 실패: ${photo.id} - ${errorMessage}`);

    if (retryCount < maxRetries) {
      logMessage(`🔄 재시도 예정: ${photo.id} (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 지수 백오프
      return migrateClinicalPhoto(photo, retryCount + 1);
    }

    return {
      success: false,
      supabaseId: photo.id,
      error: errorMessage,
      retryCount,
    };
  }
}

async function migrateConsentFile(
  consentFile: SupabaseConsentFile,
  retryCount: number = 0
): Promise<MigrationResult> {
  const maxRetries = 3;

  try {
    logMessage(`📄 동의서 파일 마이그레이션 시작: ${consentFile.id} (재시도: ${retryCount})`);

    // 1. 파일 다운로드
    const fileBuffer = await downloadFileFromSupabase(consentFile.file_path);
    logMessage(`✅ 파일 다운로드 완료: ${consentFile.file_path} (${fileBuffer.length} bytes)`);

    // 2. Convex Storage에 업로드
    const storageId = await uploadFileToConvex(fileBuffer, consentFile.file_name);
    logMessage(`✅ Convex Storage 업로드 완료: ${storageId}`);

    // 3. Convex DB에 메타데이터 저장
    const convexId = await convex.mutation(api.fileStorage.saveConsentFile, {
      storageId,
      clinical_case_id: consentFile.clinical_case_id as Id<'clinical_cases'>,
      file_name: consentFile.file_name,
      file_size: consentFile.file_size,
      file_type: consentFile.file_type,
    });

    logMessage(`✅ 동의서 파일 마이그레이션 완료: ${consentFile.id} → ${convexId}`);

    return {
      success: true,
      supabaseId: consentFile.id,
      convexId: convexId as Id<'consent_files'>,
      storageId,
      retryCount,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logMessage(`❌ 동의서 파일 마이그레이션 실패: ${consentFile.id} - ${errorMessage}`);

    if (retryCount < maxRetries) {
      logMessage(`🔄 재시도 예정: ${consentFile.id} (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 지수 백오프
      return migrateConsentFile(consentFile, retryCount + 1);
    }

    return {
      success: false,
      supabaseId: consentFile.id,
      error: errorMessage,
      retryCount,
    };
  }
}

// =====================================
// 메인 마이그레이션 함수
// =====================================

async function migrateFiles(): Promise<void> {
  logMessage('🚀 파일 마이그레이션 시작');

  // 상태 로드
  let state = loadMigrationState();

  try {
    // 1. Supabase에서 파일 정보 가져오기
    logMessage('📊 Supabase에서 파일 정보 조회 중...');

    const { data: clinicalPhotos, error: photosError } = await supabase
      .from('clinical_photos')
      .select('*')
      .order('created_at', { ascending: true });

    if (photosError) {
      throw new Error(`임상 사진 조회 실패: ${photosError.message}`);
    }

    const { data: consentFiles, error: consentError } = await supabase
      .from('consent_files')
      .select('*')
      .order('created_at', { ascending: true });

    if (consentError) {
      throw new Error(`동의서 파일 조회 실패: ${consentError.message}`);
    }

    // 통계 업데이트
    state.stats.totalClinicalPhotos = clinicalPhotos?.length || 0;
    state.stats.totalConsentFiles = consentFiles?.length || 0;

    logMessage(
      `📈 마이그레이션 대상: 임상 사진 ${state.stats.totalClinicalPhotos}개, 동의서 ${state.stats.totalConsentFiles}개`
    );

    // 2. 임상 사진 마이그레이션
    if (clinicalPhotos && clinicalPhotos.length > 0) {
      logMessage('📸 임상 사진 마이그레이션 시작...');

      for (const photo of clinicalPhotos) {
        if (state.completedClinicalPhotos.includes(photo.id)) {
          logMessage(`⏭️ 이미 완료된 임상 사진: ${photo.id}`);
          continue;
        }

        const result = await migrateClinicalPhoto(photo);

        if (result.success) {
          state.completedClinicalPhotos.push(photo.id);
          state.stats.successfulClinicalPhotos++;
        } else {
          state.stats.failedClinicalPhotos++;
          state.failedItems.push({
            id: photo.id,
            type: 'clinical_photo',
            error: result.error || 'Unknown error',
            retryCount: result.retryCount,
          });
        }

        // 상태 저장 (중간 저장)
        saveMigrationState(state);

        // 진행률 표시
        const totalProcessed =
          state.stats.successfulClinicalPhotos + state.stats.failedClinicalPhotos;
        const progress = Math.round((totalProcessed / state.stats.totalClinicalPhotos) * 100);
        logMessage(
          `📊 임상 사진 진행률: ${progress}% (${totalProcessed}/${state.stats.totalClinicalPhotos})`
        );
      }
    }

    // 3. 동의서 파일 마이그레이션
    if (consentFiles && consentFiles.length > 0) {
      logMessage('📄 동의서 파일 마이그레이션 시작...');

      for (const consentFile of consentFiles) {
        if (state.completedConsentFiles.includes(consentFile.id)) {
          logMessage(`⏭️ 이미 완료된 동의서: ${consentFile.id}`);
          continue;
        }

        const result = await migrateConsentFile(consentFile);

        if (result.success) {
          state.completedConsentFiles.push(consentFile.id);
          state.stats.successfulConsentFiles++;
        } else {
          state.stats.failedConsentFiles++;
          state.failedItems.push({
            id: consentFile.id,
            type: 'consent_file',
            error: result.error || 'Unknown error',
            retryCount: result.retryCount,
          });
        }

        // 상태 저장 (중간 저장)
        saveMigrationState(state);

        // 진행률 표시
        const totalProcessed = state.stats.successfulConsentFiles + state.stats.failedConsentFiles;
        const progress = Math.round((totalProcessed / state.stats.totalConsentFiles) * 100);
        logMessage(
          `📊 동의서 파일 진행률: ${progress}% (${totalProcessed}/${state.stats.totalConsentFiles})`
        );
      }
    }

    // 4. 마이그레이션 완료 보고
    logMessage('🎉 파일 마이그레이션 완료!');
    logMessage(`📊 최종 통계:`);
    logMessage(
      `   임상 사진: ${state.stats.successfulClinicalPhotos}개 성공, ${state.stats.failedClinicalPhotos}개 실패`
    );
    logMessage(
      `   동의서 파일: ${state.stats.successfulConsentFiles}개 성공, ${state.stats.failedConsentFiles}개 실패`
    );

    if (state.failedItems.length > 0) {
      logMessage(`⚠️ ${state.failedItems.length}개 파일 마이그레이션 실패:`);
      state.failedItems.forEach(item => {
        logMessage(`   - ${item.type} ${item.id}: ${item.error}`);
      });
    }

    // 최종 상태 저장
    saveMigrationState(state);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logMessage(`💥 마이그레이션 실패: ${errorMessage}`);
    saveMigrationState(state);
    throw error;
  }
}

// =====================================
// 스크립트 실행
// =====================================

if (require.main === module) {
  migrateFiles()
    .then(() => {
      logMessage('✨ 파일 마이그레이션 스크립트 완료');
      process.exit(0);
    })
    .catch(error => {
      logMessage(`💥 파일 마이그레이션 스크립트 실패: ${error}`);
      console.error(error);
      process.exit(1);
    });
}

export { migrateFiles };
