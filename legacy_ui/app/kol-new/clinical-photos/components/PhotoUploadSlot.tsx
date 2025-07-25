'use client';

import React, { useRef, useState } from 'react';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
// @ts-expect-error Module not found in legacy_ui
import { Button } from "@/components/ui/button";
// @ts-expect-error Module not found in legacy_ui
import { cn } from "@/lib/utils";

interface PhotoUploadSlotProps {
  id: string;
  roundDay: number;
  angle: 'front' | 'left' | 'right';
  imageUrl?: string;
  uploaded: boolean;
  size?: 'sm' | 'md' | 'lg';
  showPreview?: boolean;
  onUpload: (file: File) => void;
  onDelete?: () => void;
  className?: string;
}

const PhotoUploadSlot: React.FC<PhotoUploadSlotProps> = ({
  id,
  roundDay,
  angle,
  imageUrl,
  uploaded,
  size = 'md',
  showPreview = false,
  onUpload,
  onDelete,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // 사이즈별 클래스
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  // 각도 이름 변환
  const getAngleName = (angle: string) => {
    switch (angle) {
      case 'front': return '정면';
      case 'left': return '좌측';
      case 'right': return '우측';
      default: return angle;
    }
  };

  // 회차 이름 변환
  const getRoundName = (day: number) => {
    if (day === 0) return 'Before';
    return `${day}일차`;
  };

  // 이미지 리사이징 함수
  const resizeImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // 비율 유지하면서 크기 조정
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('이미지 변환에 실패했습니다.'));
            }
          }, 'image/jpeg', 0.85); // 85% 품질로 압축
        };
        img.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsDataURL(file);
    });
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }
    
    try {
      // 파일 크기가 5MB 이상이면 리사이징
      if (file.size > 5 * 1024 * 1024) {
        const resizedFile = await resizeImage(file);
        onUpload(resizedFile);
      } else {
        onUpload(file);
      }
    } catch (error) {
      console.error('File processing error:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  // 클릭 핸들러
  const handleClick = () => {
    if (uploaded && imageUrl) {
      // 이미 업로드된 경우 교체 또는 삭제 옵션
      if (showPreview) {
        // 프리뷰 모드에서는 큰 이미지로 보기
        window.open(imageUrl, '_blank');
      } else {
        // 편집 모드에서는 파일 선택
        fileInputRef.current?.click();
      }
    } else {
      // 업로드되지 않은 경우 파일 선택
      fileInputRef.current?.click();
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  };

  return (
    <div className={cn("relative group", className)}>
      {/* 메인 슬롯 */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg overflow-hidden transition-all duration-200 cursor-pointer",
          sizeClasses[size],
          uploaded && imageUrl 
            ? "border-green-300 bg-green-50" 
            : isDragging 
              ? "border-blue-400 bg-blue-50" 
              : "border-gray-300 bg-gray-50 hover:bg-gray-100",
          isHovering && "border-blue-400"
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploaded && imageUrl ? (
          <>
            {/* 업로드된 이미지 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${getRoundName(roundDay)} ${getAngleName(angle)}`}
              className="w-full h-full object-cover"
            />
            
            {/* 호버 시 오버레이 */}
            {isHovering && !showPreview && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 업로드 영역 */}
            <div className="w-full h-full flex flex-col items-center justify-center">
              {isDragging ? (
                <>
                  <Upload className="h-6 w-6 text-blue-500 mb-1" />
                  <span className="text-xs text-blue-600">드롭하세요</span>
                </>
              ) : (
                <>
                  <Camera className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 text-center px-1">
                    {getAngleName(angle)}
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 라벨 (사이즈가 작을 때는 외부에 표시) */}
      {size === 'sm' && (
        <div className="text-xs text-gray-500 text-center mt-1">
          {getAngleName(angle)}
        </div>
      )}

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="사진 업로드 입력"
        onChange={async (e) => await handleFileSelect(e.target.files)}
      />
    </div>
  );
};

export default PhotoUploadSlot;