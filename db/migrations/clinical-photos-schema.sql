-- 임상사진 관련 테이블 스키마 정의

-- 케이스 테이블 (clinical_cases)
CREATE TABLE IF NOT EXISTS clinical_cases (
  id BIGSERIAL PRIMARY KEY,
  kol_id UUID NOT NULL,  -- 관련 KOL 사용자 ID (Clerk ID)
  customer_id UUID, -- 고객 ID (선택 사항)
  customer_name TEXT NOT NULL, -- 고객 이름
  case_name TEXT NOT NULL, -- 케이스 이름
  concern_area TEXT, -- 관심 영역
  treatment_plan TEXT, -- 치료 계획
  consent_received BOOLEAN NOT NULL DEFAULT false, -- 동의서 수령 여부
  consent_date TIMESTAMP WITH TIME ZONE, -- 동의서 수령 일자
  consent_image_url TEXT, -- 동의서 이미지 URL
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')), -- 케이스 상태
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 생성일
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 수정일
  customer_phone TEXT, -- 고객 연락처
  customer_email TEXT, -- 고객 이메일
  customer_birth_date DATE, -- 고객 생년월일
  customer_memo TEXT -- 고객 메모
);

-- 사진 테이블 (clinical_photos)
CREATE TABLE IF NOT EXISTS clinical_photos (
  id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE, -- 관련 케이스
  round_number INTEGER NOT NULL, -- 회차 번호
  angle TEXT NOT NULL CHECK (angle IN ('front', 'left', 'right')), -- 각도 (정면, 좌측, 우측)
  file_url TEXT NOT NULL, -- 파일 URL
  thumbnail_url TEXT, -- 썸네일 URL (선택 사항)
  file_size INTEGER NOT NULL, -- 파일 크기
  mime_type TEXT NOT NULL, -- MIME 타입
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 생성일
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 수정일
  UNIQUE(case_id, round_number, angle) -- 케이스 내에서 회차와 각도 조합은 고유해야 함
);

-- 회차별 고객 정보 테이블 (round_customer_info)
CREATE TABLE IF NOT EXISTS round_customer_info (
  id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE, -- 관련 케이스
  round_number INTEGER NOT NULL, -- 회차 번호
  treatment_type TEXT, -- 치료 타입
  products JSONB, -- 사용 제품 목록
  skin_types JSONB, -- 피부 타입 목록
  memo TEXT, -- 메모
  round_date DATE, -- 회차 진행일
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 생성일
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), -- 수정일
  UNIQUE(case_id, round_number) -- 케이스 내에서 회차는 고유해야 함
);

-- 접근 권한 설정
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_customer_info ENABLE ROW LEVEL SECURITY;

-- 정책 설정: 인증된 사용자는 자신의 데이터만 볼 수 있음
CREATE POLICY "Users can view their own cases" ON clinical_cases
  FOR SELECT USING (auth.uid()::text = kol_id::text);

CREATE POLICY "Users can insert their own cases" ON clinical_cases
  FOR INSERT WITH CHECK (auth.uid()::text = kol_id::text);

CREATE POLICY "Users can update their own cases" ON clinical_cases
  FOR UPDATE USING (auth.uid()::text = kol_id::text);

CREATE POLICY "Users can delete their own cases" ON clinical_cases
  FOR DELETE USING (auth.uid()::text = kol_id::text);

-- clinical_photos 테이블에 대한 정책
CREATE POLICY "Users can manage photos of their cases" ON clinical_photos
  USING (EXISTS (
    SELECT 1 FROM clinical_cases
    WHERE clinical_cases.id = clinical_photos.case_id
    AND clinical_cases.kol_id::text = auth.uid()::text
  ));

-- round_customer_info 테이블에 대한 정책
CREATE POLICY "Users can manage round info of their cases" ON round_customer_info
  USING (EXISTS (
    SELECT 1 FROM clinical_cases
    WHERE clinical_cases.id = round_customer_info.case_id
    AND clinical_cases.kol_id::text = auth.uid()::text
  ));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clinical_cases_kol_id ON clinical_cases(kol_id);
CREATE INDEX IF NOT EXISTS idx_clinical_cases_status ON clinical_cases(status);
CREATE INDEX IF NOT EXISTS idx_clinical_photos_case_id ON clinical_photos(case_id);
CREATE INDEX IF NOT EXISTS idx_round_customer_info_case_id ON round_customer_info(case_id);
