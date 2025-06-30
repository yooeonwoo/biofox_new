'use client';

import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCaseSerialQueues } from '@/hooks/useSerialQueue';
import { isPdf, isImage, getFileSizeMB } from '@/utils/file';
import { clinicalPhotosAPI } from '@/services/clinicalPhotos';
import { useQueryClient } from '@tanstack/react-query';

interface ConsentUploaderProps {
  caseId: string;
  roundId: string;          // 회차별 관리 – 필수
  onUploaded?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ConsentUploader({
  caseId,
  roundId,
  onUploaded,
  disabled = false,
  className = ''
}: ConsentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { enqueueForCase } = useCaseSerialQueues();

  // 파일 유효성 검사
  const validateFile = useCallback((file: File): boolean => {
    // 파일 타입 검사 (PDF 또는 이미지)
    if (!isPdf(file) && !isImage(file)) {
      toast.warning('PDF 파일이나 이미지 파일만 업로드 가능합니다.', {
        description: '지원 형식: PDF, JPEG, PNG, WebP'
      });
      return false;
    }

    // 파일 크기 검사 (10MB 제한)
    const maxSizeMB = 10;
    const fileSizeMB = parseFloat(getFileSizeMB(file));
    if (fileSizeMB > maxSizeMB) {
      toast.warning(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`, {
        description: `현재 파일 크기: ${getFileSizeMB(file)}MB`
      });
      return false;
    }

    return true;
  }, []);

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (file: File) => {
    if (!validateFile(file)) return;

    const taskId = `consent-upload-${caseId}-${roundId}`;
    
    enqueueForCase(caseId, taskId, async () => {
      setIsUploading(true);
      
      try {
        await clinicalPhotosAPI.consent.upload(parseInt(caseId), roundId, file);
        
                 // 성공 시 캐시 무효화
         queryClient.invalidateQueries({ queryKey: ['cases', caseId] });
        
        toast.success('동의서 업로드 완료', {
          description: `${file.name} 파일이 성공적으로 업로드되었습니다.`
        });
        
        onUploaded?.();
      } catch (error) {
        console.error('동의서 업로드 실패:', error);
        toast.error('업로드 실패', {
          description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
        });
             } finally {
         setIsUploading(false);
       }
     }, { priority: 'high' });
  }, [caseId, roundId, validateFile, enqueueForCase, queryClient, onUploaded]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // 파일 입력 초기화 (같은 파일 재선택 가능)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload]);

  // 버튼 클릭 핸들러
  const handleButtonClick = useCallback(() => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const files = Array.from(event.dataTransfer.files);
    const file = files[0]; // 첫 번째 파일만 처리
    
    if (file) {
      handleFileUpload(file);
    }
  }, [disabled, isUploading, handleFileUpload]);

  return (
    <div className={`relative ${className}`}>
             <input
         ref={fileInputRef}
         type="file"
         accept="application/pdf,image/*"
         onChange={handleFileSelect}
         className="hidden"
         disabled={disabled || isUploading}
         aria-label="동의서 파일 선택"
       />
      
      <Card 
        className={`
          relative overflow-hidden transition-all duration-200 cursor-pointer
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'border-blue-400 bg-blue-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-3">
            {isUploading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
                <span className="text-sm text-blue-600 font-medium">업로드 중...</span>
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  동의서 업로드 (PDF, 이미지)
                </span>
                <Upload className="h-4 w-4 text-gray-400" />
              </>
            )}
          </div>
          
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex items-center justify-center bg-blue-50/80 backdrop-blur-sm"
            >
              <div className="text-center">
                <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <span className="text-sm font-medium text-blue-600">
                  파일을 여기에 놓으세요
                </span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        PDF 또는 이미지 파일 (최대 10MB)
      </div>
    </div>
  );
} 