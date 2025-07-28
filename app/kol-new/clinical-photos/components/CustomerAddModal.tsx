'use client';

import React, { useState } from 'react';
import { X, User, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

interface CustomerData {
  customerName: string;
  consentReceived: boolean;
  consentImageUrl?: string;
}

interface CustomerAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerData, profileId: Id<'profiles'>) => void;
  isLoading?: boolean;
  profileId: Id<'profiles'>;
}

const CustomerAddModal: React.FC<CustomerAddModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  profileId,
}) => {
  const [formData, setFormData] = useState<CustomerData>({
    customerName: '',
    consentReceived: false,
    consentImageUrl: undefined,
  });

  const [consentFileInput, setConsentFileInput] = useState<HTMLInputElement | null>(null);
  const [uploadingConsent, setUploadingConsent] = useState(false);

  const [errors, setErrors] = useState<Partial<CustomerData>>({});

  // Convex mutations
  const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const saveFileMetadata = useMutation(api.fileStorage.saveFileMetadata);

  // Convex query for consent image URL
  const consentImageUrl = useQuery(
    api.fileStorage.getFileUrl,
    formData.consentImageUrl && formData.consentImageUrl.startsWith('khtt')
      ? { storageId: formData.consentImageUrl as Id<'_storage'> }
      : 'skip'
  );

  // 폼 데이터 초기화
  const resetForm = () => {
    setFormData({
      customerName: '',
      consentReceived: false,
      consentImageUrl: undefined,
    });
    setErrors({});
  };

  // 모달 닫기
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 에러 초기화
    if (errors[name as keyof CustomerData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // 동의서 상태 변경 핸들러
  const handleConsentStatusChange = (status: boolean) => {
    setFormData(prev => ({
      ...prev,
      consentReceived: status,
      consentImageUrl: status === false ? undefined : prev.consentImageUrl,
    }));
  };

  // 동의서 파일 업로드 핸들러
  const handleConsentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setUploadingConsent(true);
    try {
      console.log('[Consent Debug] Generating upload URL...');
      // 1. 업로드 URL 생성
      const postUrl = await generateUploadUrl();
      console.log('[Consent Debug] Upload URL:', postUrl);

      // 2. 파일 업로드
      console.log('[Consent Debug] Uploading file...');
      const result = await fetch(postUrl, {
        method: 'POST',
        body: file,
      });

      console.log('[Consent Debug] Upload response status:', result.status);
      if (!result.ok) {
        const errorText = await result.text();
        console.error('[Consent Debug] Upload error:', errorText);
        throw new Error('파일 업로드에 실패했습니다.');
      }

      const { storageId } = await result.json();
      console.log('[Consent Debug] Storage ID:', storageId);

      // 3. 파일 메타데이터 저장
      console.log('[Consent Debug] Saving metadata...');
      await saveFileMetadata({
        storageId,
        bucket_name: 'consent-images',
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        metadata: {
          uploadedAt: new Date().toISOString(),
          purpose: 'consent',
        },
      });

      // 4. URL을 storageId로 저장 (나중에 표시할 때 getFileUrl로 조회)
      setFormData(prev => ({
        ...prev,
        consentImageUrl: storageId,
      }));

      toast.success('동의서가 업로드되었습니다.');
    } catch (error) {
      console.error('동의서 업로드 오류:', error);
      toast.error('동의서 업로드에 실패했습니다.');
    } finally {
      setUploadingConsent(false);
    }
  };

  // 동의서 파일 삭제 핸들러
  const handleConsentFileDelete = () => {
    setFormData(prev => ({
      ...prev,
      consentImageUrl: undefined,
    }));
    if (consentFileInput) {
      consentFileInput.value = '';
    }
  };

  // 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerData> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = '고객명을 입력해주세요';
    }

    if (formData.consentReceived && !formData.consentImageUrl) {
      alert('동의서 완료 상태에서는 동의서 이미지를 업로드해주세요.');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit(formData, profileId);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border border-gray-200 bg-white shadow-lg sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />새 고객 추가
          </DialogTitle>
          <DialogDescription>고객 정보를 입력하고 새로운 케이스를 생성하세요</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 고객명 입력 */}
          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              고객명 *
            </Label>
            <Input
              id="customerName"
              name="customerName"
              placeholder="고객명을 입력하세요"
              value={formData.customerName}
              onChange={handleInputChange}
              className={errors.customerName ? 'border-red-500' : ''}
            />
            {errors.customerName && <p className="text-sm text-red-500">{errors.customerName}</p>}
          </div>

          {/* 동의서 상태 탭 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">동의서 상태</Label>
            <div className="flex w-fit rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => handleConsentStatusChange(false)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  !formData.consentReceived
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                미완료
              </button>
              <button
                type="button"
                onClick={() => handleConsentStatusChange(true)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  formData.consentReceived
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                완료
              </button>
            </div>
          </div>

          {/* 동의서 업로드 (완료 상태일 때만) */}
          {formData.consentReceived && (
            <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <Label className="text-sm font-medium">동의서 이미지 업로드</Label>

              {formData.consentImageUrl ? (
                <div className="space-y-3">
                  <div className="relative">
                    {consentImageUrl ? (
                      <img
                        src={consentImageUrl}
                        alt="동의서"
                        className="h-32 w-full rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center rounded-lg border bg-gray-50">
                        <span className="text-sm text-gray-500">로딩 중...</span>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-2 top-2 h-6 w-6 p-0"
                      onClick={handleConsentFileDelete}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => consentFileInput?.click()}
                    disabled={uploadingConsent}
                  >
                    {uploadingConsent ? '업로드 중...' : '수정'}
                  </Button>
                </div>
              ) : (
                <div
                  className={`cursor-pointer rounded-lg border-2 border-dashed border-green-300 p-6 text-center transition-colors hover:bg-green-100 ${
                    uploadingConsent ? 'pointer-events-none opacity-50' : ''
                  }`}
                  onClick={() => !uploadingConsent && consentFileInput?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="동의서 이미지 업로드"
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      consentFileInput?.click();
                    }
                  }}
                >
                  <div className="space-y-2">
                    <div className="text-green-600">
                      <svg
                        className="mx-auto h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">
                        {uploadingConsent ? '업로드 중...' : '동의서 이미지를 업로드하세요'}
                      </p>
                      <p className="text-xs">
                        {uploadingConsent ? '잠시만 기다려주세요' : '클릭하여 파일 선택'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={setConsentFileInput}
                type="file"
                accept="image/*"
                className="hidden"
                aria-hidden="true"
                onChange={handleConsentFileUpload}
              />
            </div>
          )}

          {/* 버튼 영역 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !formData.customerName.trim() || uploadingConsent}
            >
              {isLoading ? '추가 중...' : uploadingConsent ? '업로드 중...' : '고객 추가'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerAddModal;
