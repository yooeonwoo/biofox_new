'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera, X, FileText, Download, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface ClinicalPhotoModalProps {
  caseId: string | null;
  caseName?: string;
  consentStatus?: string;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  profileId?: string;
}

interface Photo {
  _id: Id<'clinical_photos'>;
  session_number: number;
  photo_type: string;
  file_path: string;
  url: string | null;
  created_at: number;
  [key: string]: any; // Convex에서 추가로 반환할 수 있는 필드들
}

export function ClinicalPhotoModal({
  caseId,
  caseName,
  consentStatus,
  open,
  onClose,
  onUpdate,
  profileId,
}: ClinicalPhotoModalProps) {
  const [uploading, setUploading] = useState(false);
  const [activeSession, setActiveSession] = useState(0);
  const { toast } = useToast();

  // Convex queries - 자동으로 실시간 업데이트됨
  const photosRaw = useQuery(
    api.fileStorage.getClinicalPhotos,
    caseId ? { clinical_case_id: caseId as Id<'clinical_cases'> } : 'skip'
  );

  // URL 생성 로직 추가
  const photos = photosRaw?.map(photo => {
    let imageUrl = photo.url;

    if (!imageUrl && photo.file_path) {
      // 프로덕션 환경 감지
      const isProduction =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'biofoxnew.vercel.app' ||
          window.location.hostname.includes('vercel.app'));

      // 환경에 따른 Convex URL 설정
      const convexSiteUrl = isProduction
        ? 'https://aware-rook-16.convex.site'
        : process.env.NEXT_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') ||
          'https://quiet-dog-358.convex.site';

      imageUrl = `${convexSiteUrl}/storage/${photo.file_path}`;
    }

    return {
      ...photo,
      imageUrl,
    };
  });

  const consentFile = useQuery(
    api.fileStorage.getConsentFile,
    caseId ? { clinical_case_id: caseId as Id<'clinical_cases'> } : 'skip'
  );

  // Convex mutations
  const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const saveClinicalPhoto = useMutation(api.fileStorage.saveClinicalPhoto);
  const saveConsentFile = useMutation(api.fileStorage.saveConsentFile);
  const deleteClinicalPhoto = useMutation(api.fileStorage.deleteClinicalPhoto);
  const deleteConsentFile = useMutation(api.fileStorage.deleteConsentFile);

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, photoType: string) => {
      const file = e.target.files?.[0];
      if (!file || !caseId) return;

      // 파일 유효성 검사
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: '업로드 실패',
          description: '지원하지 않는 파일 형식입니다. (JPEG, PNG, WebP만 허용)',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: '업로드 실패',
          description: '파일 크기는 10MB 이하여야 합니다.',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);

      try {
        console.log('Step 1: Generating upload URL from Convex...');

        // 🚀 Step 1: Convex에서 업로드 URL 생성
        const uploadUrl = await generateUploadUrl();

        console.log('Step 2: Uploading file to Convex Storage...');

        // 🚀 Step 2: Convex Storage로 직접 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Convex upload failed:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorText,
          });
          throw new Error(`파일 업로드 실패: ${uploadResponse.statusText}`);
        }

        const { storageId } = await uploadResponse.json();
        console.log('File uploaded successfully, storageId:', storageId);

        console.log('Step 3: Saving metadata to Convex...');

        // 🚀 Step 3: 메타데이터 저장
        await saveClinicalPhoto({
          storageId,
          clinical_case_id: caseId as Id<'clinical_cases'>,
          session_number: activeSession,
          photo_type: photoType as 'front' | 'left_side' | 'right_side',
          file_size: file.size,
          profileId: profileId as Id<'profiles'> | undefined,
        });

        console.log('Clinical photo metadata saved');

        toast({
          title: '업로드 완료',
          description: '사진이 업로드되었습니다.',
        });

        onUpdate?.(); // 부모 컴포넌트에 업데이트 알림
      } catch (error) {
        console.error('Photo upload error:', error);
        toast({
          title: '업로드 실패',
          description: error instanceof Error ? error.message : '사진 업로드에 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    },
    [caseId, activeSession, generateUploadUrl, saveClinicalPhoto, toast, onUpdate]
  );

  const handleConsentUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !caseId) return;

      // 파일 유효성 검사
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: '업로드 실패',
          description: '지원하지 않는 파일 형식입니다. (PDF, JPEG, PNG만 허용)',
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: '업로드 실패',
          description: '파일 크기는 5MB 이하여야 합니다.',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);

      try {
        console.log('Step 1: Generating upload URL from Convex...');

        // 🚀 Step 1: Convex에서 업로드 URL 생성
        const uploadUrl = await generateUploadUrl();

        console.log('Step 2: Uploading file to Convex Storage...');

        // 🚀 Step 2: Convex Storage로 직접 업로드
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          body: file,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error('Convex upload failed:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorText,
          });
          throw new Error(`파일 업로드 실패: ${uploadResponse.statusText}`);
        }

        const { storageId } = await uploadResponse.json();
        console.log('File uploaded successfully, storageId:', storageId);

        console.log('Step 3: Saving metadata to Convex...');

        // 🚀 Step 3: 메타데이터 저장
        await saveConsentFile({
          storageId,
          clinical_case_id: caseId as Id<'clinical_cases'>,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          profileId: profileId as Id<'profiles'> | undefined,
        });

        console.log('Consent file metadata saved');

        toast({
          title: '업로드 완료',
          description: '동의서가 업로드되었습니다.',
        });
      } catch (error) {
        console.error('Consent upload error:', error);
        toast({
          title: '업로드 실패',
          description: error instanceof Error ? error.message : '동의서 업로드에 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
      }
    },
    [caseId, generateUploadUrl, saveConsentFile, toast]
  );

  const handleDeletePhoto = useCallback(
    async (photo: Photo) => {
      if (!photo || !confirm('정말 이 사진을 삭제하시겠습니까?')) return;

      try {
        await deleteClinicalPhoto({
          photoId: photo._id,
        });

        toast({
          title: '삭제 완료',
          description: '사진이 삭제되었습니다.',
        });

        onUpdate?.();
      } catch (error) {
        console.error('Photo delete error:', error);
        toast({
          title: '삭제 실패',
          description: '사진 삭제에 실패했습니다.',
          variant: 'destructive',
        });
      }
    },
    [deleteClinicalPhoto, toast, onUpdate]
  );

  // 데이터 변환 및 그룹화
  const photosData = photos || [];
  const photosBySession = photosData.reduce(
    (acc, photo) => {
      if (!acc[photo.session_number]) {
        acc[photo.session_number] = [];
      }
      acc[photo.session_number]?.push(photo);
      return acc;
    },
    {} as Record<number, Photo[]>
  );

  const maxSession = Math.max(0, ...Object.keys(photosBySession).map(Number));

  const photoTypes = [
    { type: 'front', label: '정면' },
    { type: 'left_side', label: '좌측면' },
    { type: 'right_side', label: '우측면' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            임상 사진 관리
            {caseName && <span className="text-muted-foreground">- {caseName}</span>}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photos">임상 사진</TabsTrigger>
            <TabsTrigger value="consent" disabled={consentStatus !== 'consented'}>
              동의서
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={activeSession === 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSession(0)}
              >
                Before
              </Button>
              {Array.from({ length: maxSession + 1 }, (_, i) => i + 1).map(session => (
                <Button
                  key={session}
                  variant={activeSession === session ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSession(session)}
                >
                  {session}회차
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setActiveSession(maxSession + 1)}>
                <Plus className="h-4 w-4" />새 회차
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {photoTypes.map(({ type, label }) => {
                const existingPhoto = photosBySession[activeSession]?.find(
                  p => p.photo_type === type
                );

                return (
                  <Card key={type}>
                    <CardContent className="p-4">
                      <Label className="mb-2 block">{label}</Label>

                      {existingPhoto ? (
                        <div className="group relative">
                          <img
                            src={
                              existingPhoto.file_path
                                ? `/api/storage/${existingPhoto.file_path}`
                                : existingPhoto.imageUrl || existingPhoto.url || ''
                            }
                            alt={`${label} 사진`}
                            className="aspect-square w-full rounded-lg object-cover"
                            onError={e => {
                              console.error('[ClinicalPhotoModal] Image load error:', {
                                photoId: existingPhoto._id,
                                url: existingPhoto.url,
                                imageUrl: existingPhoto.imageUrl,
                                file_path: existingPhoto.file_path,
                                src: e.currentTarget.src,
                              });
                            }}
                          />
                          <button
                            onClick={() => handleDeletePhoto(existingPhoto)}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                            disabled={uploading}
                            title="사진 삭제"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => handlePhotoUpload(e, type)}
                            disabled={uploading}
                          />
                          <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-gray-400">
                            <Camera className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {uploading ? '업로드 중...' : '클릭하여 업로드'}
                            </span>
                          </div>
                        </label>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="consent" className="space-y-4">
            {consentFile ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium">{consentFile.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          업로드: {new Date(consentFile.upload_date).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(consentFile.url || '', '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleConsentUpload}
                      disabled={uploading}
                    />
                    <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-colors hover:border-gray-400">
                      <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                      <p className="mb-2 text-gray-600">동의서 업로드</p>
                      <p className="text-sm text-gray-500">
                        {uploading ? '업로드 중...' : 'PDF 또는 이미지 파일 (최대 5MB)'}
                      </p>
                    </div>
                  </label>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
