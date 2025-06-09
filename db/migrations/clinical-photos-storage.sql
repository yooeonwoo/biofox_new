-- 임상사진 스토리지 버킷 생성 및 설정

-- 1. clinical-photos 버킷 생성 (아직 없는 경우)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical-photos', 'clinical-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 스토리지 보안 정책 설정
-- 인증된 사용자만 파일 업로드/수정 가능
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- 자신이 업로드한 파일만 수정/삭제 가능
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);

-- 모든 임상 사진은 공개적으로 접근 가능 (비공개 사진은 별도 저장소 사용 권장)
CREATE POLICY "Clinical photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clinical-photos');
