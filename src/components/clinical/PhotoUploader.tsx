'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUploadPhoto } from '@/src/hooks/useClinicalCases';
import { useCaseSerialQueues } from '@/src/hooks/useSerialQueue';
import { isImage, getFileSizeMB } from '@/src/utils/file';

interface PhotoUploaderProps {
  caseId: string;
  roundId: string;
  angle: 'front' | 'left' | 'right';
  onUploaded?: () => void;
  className?: string;
  disabled?: boolean;
  maxSizeMB?: number;
}

export function PhotoUploader({
  caseId,
  roundId,
  angle,
  onUploaded,
  className = '',
  disabled = false,
  maxSizeMB = 20,
}: PhotoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutateAsync: uploadPhoto } = useUploadPhoto();
  const { enqueueForCase } = useCaseSerialQueues();

  // 파일 검증
  const validateFile = useCallback((file: File): string | null => {
    if (!isImage(file)) {
      return '이미지 파일만 업로드 가능합니다.';
    }
    
    if (parseFloat(getFileSizeMB(file)) > maxSizeMB) {
      return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`;
    }
    
    return null;
  }, [maxSizeMB]);

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) return;
    
    // 첫 번째 파일만 사용 (각도별로 하나씩)
    const file = fileArray[0];
    
    if (!file) {
      toast.error('파일을 선택해주세요.');
      return;
    }
    
    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUploading(true);

    // Serial Queue에 업로드 작업 추가
    enqueueForCase(
      caseId,
      `photo-upload-${roundId}-${angle}`,
      async () => {
        try {
          await uploadPhoto({
            caseId: parseInt(caseId, 10),
            roundNumber: parseInt(roundId, 10),
            angle,
            file,
          });
          
          toast.success(`${angle} 방향 사진이 업로드되었습니다.`);
          onUploaded?.();
        } catch (error) {
          console.error('Photo upload failed:', error);
          toast.error('사진 업로드에 실패했습니다.');
          throw error;
        } finally {
          setIsUploading(false);
        }
      },
      { priority: 'normal' } // 동의서(high) 이후 실행
    );
  }, [caseId, roundId, angle, uploadPhoto, enqueueForCase, validateFile, onUploaded]);

  // 드래그 앤 드롭 이벤트
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, [disabled, isUploading, handleFileUpload]);

  // 파일 선택 이벤트
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
    // 파일 input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  // 파일 선택 다이얼로그 열기
  const openFileDialog = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <Card className={`relative ${className}`}>
      <CardContent className="p-4">
        <motion.div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
            ${isUploading ? 'pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
            aria-label={`${angle} 방향 사진 파일 선택`}
          />
          
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center space-y-2"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-600">업로드 중...</p>
              </motion.div>
            ) : (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center space-y-3"
              >
                <div className={`
                  p-3 rounded-full 
                  ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}
                `}>
                  {isDragOver ? (
                    <Upload className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Camera className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">
                    {isDragOver ? '여기에 파일을 놓으세요' : `${angle} 방향 사진 업로드`}
                  </p>
                  <p className="text-xs text-gray-500">
                    이미지를 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p className="text-xs text-gray-400">
                    최대 {maxSizeMB}MB까지 지원
                  </p>
                </div>

                {!disabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog();
                    }}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    파일 선택
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 에러 상태 표시 */}
        {disabled && (
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            업로드가 비활성화되었습니다
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PhotoUploader; 