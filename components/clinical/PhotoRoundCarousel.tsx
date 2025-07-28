'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Upload, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PhotoSlot } from '@/types/clinical';
import { convertAngleToFrontend } from '@/types/clinical';

interface PhotoRoundCarouselProps {
  caseId: string;
  photos: PhotoSlot[];
  currentRound: number;
  onPhotoUpload: (roundDay: number, angle: string, file: File) => Promise<void>;
  onPhotoDelete: (roundDay: number, angle: string) => Promise<void>;
  onRoundChange: (round: number) => void;
}

const PhotoRoundCarousel: React.FC<PhotoRoundCarouselProps> = ({
  caseId,
  photos,
  currentRound,
  onPhotoUpload,
  onPhotoDelete,
  onRoundChange,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingSlots, setUploadingSlots] = useState<Set<string>>(new Set());

  // 회차별 사진 슬롯 생성
  const rounds = useMemo(() => {
    const roundsData: { [key: number]: PhotoSlot[] } = {};

    // 기존 사진 데이터에서 최대 회차 계산
    const maxExistingRound = photos.length > 0 ? Math.max(...photos.map(p => p.roundDay || 1)) : 0;

    // 최대 표시할 회차 계산 (완료된 경우 기존 회차만, 아니면 +10회차까지)
    const maxRoundToShow = maxExistingRound + 10;

    for (let round = 1; round <= maxRoundToShow; round++) {
      roundsData[round] = [
        { id: `${caseId}-${round}-front`, roundDay: round, angle: 'front', uploaded: false },
        {
          id: `${caseId}-${round}-left_side`,
          roundDay: round,
          angle: 'left_side',
          uploaded: false,
        },
        {
          id: `${caseId}-${round}-right_side`,
          roundDay: round,
          angle: 'right_side',
          uploaded: false,
        },
      ];
    }

    // 실제 사진 데이터로 업데이트
    photos.forEach(photo => {
      const photoRoundDay = photo.roundDay || 1; // 기본값을 1로 설정
      const roundSlots = roundsData[photoRoundDay];
      if (roundSlots) {
        const slotIndex = roundSlots.findIndex(slot => slot.angle === photo.angle);
        if (slotIndex !== -1) {
          roundSlots[slotIndex] = {
            ...photo,
            roundDay: photoRoundDay, // 확실히 number로 설정
            uploaded: true,
            imageUrl: photo.url || photo.imageUrl,
          };
        }
      }
    });

    return roundsData;
  }, [caseId, photos]);

  // 회차 변경 핸들러
  const handleRoundChange = useCallback(
    (direction: 'prev' | 'next') => {
      const availableRounds = Object.keys(rounds)
        .map(Number)
        .sort((a, b) => a - b);
      const currentIndex = availableRounds.indexOf(currentRound);

      if (direction === 'prev' && currentIndex > 0) {
        const prevRound = availableRounds[currentIndex - 1];
        if (prevRound !== undefined) {
          // ✅ 추가 체크
          onRoundChange(prevRound);
        }
      } else if (direction === 'next' && currentIndex < availableRounds.length - 1) {
        const nextRound = availableRounds[currentIndex + 1];
        if (nextRound !== undefined) {
          // ✅ 추가 체크
          onRoundChange(nextRound);
        }
      }
    },
    [currentRound, rounds, onRoundChange]
  );

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback(
    async (slot: PhotoSlot, file: File) => {
      const roundDay: number = slot.roundDay ?? 1; // 타입 명시
      const slotId = `${roundDay}-${slot.angle}`;
      setUploadingSlots(prev => new Set(prev).add(slotId));

      try {
        await onPhotoUpload(roundDay, slot.angle, file);
      } catch (error) {
        console.error('Photo upload failed:', error);
      } finally {
        setUploadingSlots(prev => {
          const newSet = new Set(prev);
          newSet.delete(slotId);
          return newSet;
        });
      }
    },
    [onPhotoUpload]
  );

  // 사진 삭제 핸들러
  const handlePhotoDelete = useCallback(
    async (slot: PhotoSlot) => {
      const roundDay: number = slot.roundDay ?? 1; // 타입 명시
      try {
        await onPhotoDelete(roundDay, slot.angle);
      } catch (error) {
        console.error('Photo delete failed:', error);
      }
    },
    [onPhotoDelete]
  );

  const currentRoundSlots = rounds[currentRound] || [];
  const availableRounds = Object.keys(rounds)
    .map(Number)
    .sort((a, b) => a - b);
  const currentIndex = availableRounds.indexOf(currentRound);

  return (
    <div className="mb-6 space-y-4">
      {/* 회차 네비게이션 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">임상 사진</h4>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRoundChange('prev')}
            disabled={currentIndex <= 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium text-gray-600">{currentRound}회차</span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRoundChange('next')}
            disabled={currentIndex >= availableRounds.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 사진 슬롯들 */}
      <div className="grid grid-cols-3 gap-4">
        {currentRoundSlots.map(slot => {
          const roundDay = slot.roundDay || 1; // 기본값 설정
          const slotId = `${roundDay}-${slot.angle}`;
          const isUploading = uploadingSlots.has(slotId);
          const displayAngle = convertAngleToFrontend(slot.angle);

          return (
            <div key={slot.id} className="space-y-2">
              <div className="text-center">
                <span className="text-xs font-medium text-gray-600">
                  {displayAngle === 'front' && '정면'}
                  {displayAngle === 'left' && '좌측'}
                  {displayAngle === 'right' && '우측'}
                </span>
              </div>

              <div className="relative aspect-square">
                {slot.uploaded && slot.imageUrl ? (
                  // 업로드된 이미지 표시
                  <div className="group relative h-full w-full overflow-hidden rounded-lg border-2 border-green-200 bg-green-50">
                    <img
                      src={slot.imageUrl}
                      alt={`${currentRound}회차 ${displayAngle}`}
                      className="h-full w-full object-cover"
                    />

                    {/* 오버레이 버튼들 */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedImage(slot.imageUrl!)}
                        className="h-8 w-8 p-0"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handlePhotoDelete(slot)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 업로드 영역
                  <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-400 hover:bg-blue-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(slot, file);
                        }
                      }}
                      disabled={isUploading}
                    />

                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span className="text-xs text-gray-600">업로드 중...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-600">사진 업로드</span>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 이미지 확대 모달 */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              className="relative max-h-[90vh] max-w-[90vw]"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="확대된 이미지"
                className="h-full w-full object-contain"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="absolute right-4 top-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoRoundCarousel;
