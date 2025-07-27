'use client';

import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useUploadClinicalPhotoConvex as useUploadPhoto } from '@/lib/clinical-photos-hooks';
import { useCaseSerialQueues } from '@/hooks/useSerialQueue';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhotoSlot } from '@/types/clinical';

// 가이드 이미지 경로를 웹 호스팅 링크로 정의
const frontGuideImage = 'https://i.ibb.co/8gmSndQC/front-guide.png';
const leftGuideImage = 'https://i.ibb.co/gFtvyBqk/left-guide.png';
const rightGuideImage = 'https://i.ibb.co/KcM7kDQg/right-guide.png';

// PhotoSlot 타입은 /types/clinical.ts에서 import

interface PhotoRoundCarouselProps {
  caseId: string;
  photos: PhotoSlot[];
  profileId?: string;
  onPhotoUpload: (roundDay: number, angle: string, file: File, profileId?: string) => Promise<void>;
  onPhotoDelete?: (roundDay: number, angle: string) => Promise<void>;
  isCompleted?: boolean;
  onRoundChange?: (roundDay: number) => void;
  onPhotosRefresh?: () => void;
}

const PhotoRoundCarousel: React.FC<PhotoRoundCarouselProps> = React.memo(
  ({
    caseId,
    photos,
    profileId,
    onPhotoUpload,
    onPhotoDelete,
    isCompleted = false,
    onRoundChange,
    onPhotosRefresh,
  }) => {
    const [currentRound, setCurrentRound] = useState(1);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ roundDay: number; angle: string } | null>(
      null
    );

    // 회차 변경 애니메이션 상태
    const [roundChangeAnimation, setRoundChangeAnimation] = useState<{
      show: boolean;
      roundNumber: number;
      flashBackground: boolean;
    }>({
      show: false,
      roundNumber: 1,
      flashBackground: false,
    });

    // 회차별로 사진 그룹화 및 동적 회차 생성
    const photosByRound = React.useMemo(() => {
      const rounds: { [key: number]: PhotoSlot[] } = {};

      // 기존 사진들로부터 회차 파악
      const existingRounds = new Set(photos.map(p => p.roundDay));

      // 최소 1회차는 항상 존재
      if (existingRounds.size === 0) {
        existingRounds.add(1);
      }

      // 완료 상태일 때는 기존 회차만, 진행 중일 때는 추가 회차 생성
      const existingRoundsArray = Array.from(existingRounds);
      const maxExistingRound =
        existingRoundsArray.length > 0 ? Math.max(...existingRoundsArray) : 1;
      const maxRoundToShow = isCompleted ? maxExistingRound : maxExistingRound + 10; // 기존 회차에서 10회차 더 생성

      for (let round = 1; round <= maxRoundToShow; round++) {
        rounds[round] = [
          { id: `${caseId}-${round}-front`, roundDay: round, angle: 'front', uploaded: false },
          { id: `${caseId}-${round}-left`, roundDay: round, angle: 'left', uploaded: false },
          { id: `${caseId}-${round}-right`, roundDay: round, angle: 'right', uploaded: false },
        ];
      }

      // 실제 사진 데이터로 업데이트
      photos.forEach(photo => {
        const roundSlots = rounds[photo.roundDay];
        if (roundSlots) {
          const slotIndex = roundSlots.findIndex(slot => slot.angle === photo.angle);
          if (slotIndex !== -1) {
            roundSlots[slotIndex] = photo;
          }
        }
      });

      return rounds;
    }, [photos, caseId, isCompleted]);

    const roundDays = Object.keys(photosByRound)
      .map(Number)
      .sort((a, b) => a - b);

    // 각도 이름 변환
    const getAngleName = (angle: string) => {
      switch (angle) {
        case 'front':
          return '정면';
        case 'left':
          return '좌측';
        case 'right':
          return '우측';
        default:
          return angle;
      }
    };

    // 회차 이름 변환
    // 1회차를 "Before" 로 표시하고, 그 이후부터는 (round-1)회차로 표시
    const getRoundName = (round: number) => {
      if (round === 1) return 'Before';
      return `${round - 1}회차`;
    };

    // 파일 선택 핸들러
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !uploadTarget) return;

      // 파일 유효성 검사
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('JPEG, PNG, WebP 형식의 이미지만 업로드 가능합니다.');
        return;
      }

      // 파일 크기 제한 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      setUploading(true);
      try {
        // profileId를 포함하여 onPhotoUpload 호출
        await onPhotoUpload(uploadTarget.roundDay, uploadTarget.angle, file, profileId);
        toast.success('사진이 업로드되었습니다.');
        onPhotosRefresh?.();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('사진 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
        setUploadTarget(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    // 업로드 버튼 클릭 핸들러
    const handleUploadClick = (roundDay: number, angle: string) => {
      setUploadTarget({ roundDay, angle });
      fileInputRef.current?.click();
    };

    // 삭제 핸들러
    const handleDelete = async (roundDay: number, angle: string) => {
      if (!onPhotoDelete) return;

      if (confirm('정말로 이 사진을 삭제하시겠습니까?')) {
        try {
          await onPhotoDelete(roundDay, angle);
          toast.success('사진이 삭제되었습니다.');
          onPhotosRefresh?.();
        } catch (error) {
          console.error('Delete error:', error);
          toast.error('사진 삭제에 실패했습니다.');
        }
      }
    };

    // 현재 보이는 4개 슬롯: 현재 회차 3개 + 다음 회차 정면 1개
    const visibleSlots = React.useMemo(() => {
      const slots: PhotoSlot[] = [];

      // 현재 회차의 3개 (정면, 좌측, 우측)
      if (photosByRound[currentRound]) {
        slots.push(...photosByRound[currentRound]);
      }

      // 다음 회차의 정면 1개 (완료 상태가 아닐 때만)
      const nextRound = currentRound + 1;
      if (!isCompleted && photosByRound[nextRound]) {
        const nextRoundFront = photosByRound[nextRound].find(slot => slot.angle === 'front');
        if (nextRoundFront) {
          slots.push(nextRoundFront);
        }
      }

      // 완료 상태에서 4개가 안 되면 빈 슬롯으로 채우기
      if (isCompleted && slots.length < 4) {
        while (slots.length < 4) {
          slots.push({
            id: `empty-${slots.length}`,
            roundDay: 0,
            angle: 'front',
            uploaded: false,
          });
        }
      }

      return slots;
    }, [currentRound, photosByRound, isCompleted]);

    // 완료된 회차 계산 (정면, 좌측, 우측 모두 업로드된 회차)
    const getCompletedRounds = () => {
      let completedRounds = 0;

      for (const round of roundDays) {
        const roundSlots = photosByRound[round];
        if (!roundSlots) continue;

        const allAnglesUploaded = ['front', 'left', 'right'].every(angle => {
          const slot = roundSlots.find(s => s.angle === angle);
          return slot && slot.uploaded;
        });

        if (allAnglesUploaded) {
          completedRounds++;
        } else {
          break; // 연속되지 않으면 중단
        }
      }

      return completedRounds;
    };

    // 다음 업로드할 슬롯 찾기
    const getNextSlot = () => {
      // 순서: 1회차 정면 → 1회차 좌측 → 1회차 우측 → 2회차 정면 → 2회차 좌측 → ...
      for (const round of roundDays) {
        const roundSlots = photosByRound[round];
        if (!roundSlots) continue;

        const angles = ['front', 'left', 'right'] as const;

        for (const angle of angles) {
          const slot = roundSlots.find(s => s.angle === angle);
          if (slot && !slot.uploaded) {
            return slot;
          }
        }
      }
      return null;
    };

    // 완료된 회차 계산 먼저
    const completedRounds = getCompletedRounds();

    // 네비게이션 - 완료 상태에서는 완료된 회차까지만
    const canGoPrev = currentRound > 1;
    const canGoNext = isCompleted
      ? currentRound < completedRounds // 완료 상태: 완료된 회차까지만
      : true; // 진행 상태: 무제한

    // 회차 변경 애니메이션 트리거 함수
    const triggerRoundChangeAnimation = (roundNumber: number) => {
      setRoundChangeAnimation({
        show: true,
        roundNumber,
        flashBackground: true,
      });

      // 1.5초 후 애니메이션 숨기기
      setTimeout(() => {
        setRoundChangeAnimation(prev => ({
          ...prev,
          show: false,
          flashBackground: false,
        }));
      }, 1500);
    };

    const goToPrevRound = () => {
      const newRound = Math.max(1, currentRound - 1);
      setCurrentRound(newRound);
      onRoundChange?.(newRound);
      triggerRoundChangeAnimation(newRound);
    };

    const goToNextRound = () => {
      const newRound = currentRound + 1;
      setCurrentRound(newRound);
      onRoundChange?.(newRound);
      triggerRoundChangeAnimation(newRound);
    };

    const nextSlot = !isCompleted ? getNextSlot() : null;

    return (
      <div
        className={`relative rounded-lg border-2 border-gray-200 bg-gray-50/50 p-2 transition-all duration-300 ${
          roundChangeAnimation.flashBackground ? 'border-blue-300 bg-blue-100/80' : ''
        }`}
      >
        {/* 회차 변경 애니메이션 오버레이 */}
        <AnimatePresence>
          {roundChangeAnimation.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 1],
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 1.5,
                times: [0, 0.2, 0.8, 1],
                ease: 'easeOut',
              }}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
                pointerEvents: 'none',
              }}
            >
              <div className="rounded-xl bg-biofox-blue-violet px-6 py-3 text-white shadow-2xl">
                <span className="text-xl font-bold">
                  {getRoundName(roundChangeAnimation.roundNumber)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
          aria-label="사진 파일 선택"
        />

        {/* 회차 제목들 */}
        <div className="relative z-30 mb-2 flex justify-between">
          <div className="flex-1 text-center">
            <h3 className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow-sm">
              {getRoundName(currentRound)}
            </h3>
          </div>
          {!isCompleted && visibleSlots[3] && (
            <div style={{ width: 'calc(25% - 8px)' }} className="text-center">
              <h3 className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-gray-400 shadow-sm">
                {getRoundName(visibleSlots[3].roundDay)}
              </h3>
            </div>
          )}
        </div>

        {/* 전체 컨테이너 - 좌우 버튼과 슬롯들 */}
        <div className="relative flex items-start gap-2">
          {/* 왼쪽 회차 이동 버튼 - 더 바깥쪽 + 호버 효과 */}
          {canGoPrev && (
            <Button
              variant="default"
              size="sm"
              className="legacy-btn absolute -left-3 top-1/2 z-20 h-8 w-8 -translate-y-1/2 transform p-0 opacity-30 shadow-xl transition-all duration-300 hover:scale-110 hover:opacity-100 xs:-left-4 sm:-left-5"
              onClick={goToPrevRound}
              disabled={uploading}
            >
              <ChevronLeft className="h-4 w-4 font-bold" />
            </Button>
          )}

          {/* 메인 컨테이너 - 4개 슬롯을 grid로 구성 */}
          <div className="grid flex-1 grid-cols-4 gap-2" style={{ aspectRatio: '4/1' }}>
            {/* 현재 회차 3개 슬롯 영역 (하나로 묶음) */}
            <div className="col-span-3 rounded-lg border-2 border-gray-300 bg-white p-1">
              <div className="grid h-full grid-cols-3 gap-1">
                {visibleSlots.slice(0, 3).map(slot => {
                  const isNext = nextSlot?.id === slot.id;
                  const isEmptySlot = slot.roundDay === 0; // 빈 슬롯

                  return (
                    <div key={slot.id} className="h-full">
                      {/* 사진 슬롯 */}
                      <div
                        className={`h-full w-full overflow-hidden rounded-lg border-2 ${
                          isEmptySlot
                            ? 'border-transparent bg-transparent' // 빈 슬롯은 투명
                            : isNext
                              ? 'border-biofox-blue-violet bg-biofox-blue-violet/5'
                              : slot.uploaded
                                ? 'border-biofox-lavender bg-biofox-lavender/10'
                                : 'border-soksok-light-blue/40 bg-soksok-light-blue/10'
                        }`}
                      >
                        {isEmptySlot ? (
                          // 빈 슬롯은 아무것도 표시하지 않음
                          <div className="h-full w-full"></div>
                        ) : slot.uploaded && slot.imageUrl ? (
                          <div className="group relative h-full w-full">
                            <img
                              src={slot.imageUrl}
                              alt={`${getRoundName(slot.roundDay)} ${getAngleName(slot.angle)}`}
                              className="h-full w-full object-cover"
                            />
                            {/* 호버 시 표시되는 액션 버튼들 */}
                            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                className="rounded bg-blue-500 p-1 text-xs text-white transition-colors hover:bg-blue-600"
                                onClick={() => handleUploadClick(slot.roundDay, slot.angle)}
                                title="사진 교체"
                                disabled={uploading}
                              >
                                ✏️
                              </button>
                              {onPhotoDelete && (
                                <button
                                  className="rounded bg-red-500 p-1 text-xs text-white transition-colors hover:bg-red-600"
                                  onClick={() => handleDelete(slot.roundDay, slot.angle)}
                                  title="사진 삭제"
                                  disabled={uploading}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            className="flex h-full w-full cursor-pointer flex-col items-center justify-center bg-white transition-colors hover:bg-soksok-light-blue/10 disabled:opacity-50"
                            onClick={() => handleUploadClick(slot.roundDay, slot.angle)}
                            disabled={uploading || isCompleted}
                          >
                            {slot.angle === 'front' && (
                              <div className="h-full w-full">
                                <img
                                  src={frontGuideImage}
                                  alt="정면 가이드라인"
                                  className="h-full w-full object-cover opacity-80"
                                />
                              </div>
                            )}
                            {slot.angle === 'left' && (
                              <div className="h-full w-full">
                                <img
                                  src={leftGuideImage}
                                  alt="좌측 가이드라인"
                                  className="h-full w-full object-cover opacity-80"
                                />
                              </div>
                            )}
                            {slot.angle === 'right' && (
                              <div className="h-full w-full">
                                <img
                                  src={rightGuideImage}
                                  alt="우측 가이드라인"
                                  className="h-full w-full object-cover opacity-80"
                                />
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 다음 회차 미리보기 */}
            {!isCompleted && visibleSlots[3] ? (
              <div className="h-full">
                <div className="h-full w-full overflow-hidden rounded-lg border-2 border-soksok-light-blue/40 bg-soksok-light-blue/10">
                  <button
                    className="flex h-full w-full cursor-pointer flex-col items-center justify-center bg-soksok-light-blue/10 transition-colors hover:bg-soksok-light-blue/20 disabled:opacity-50"
                    onClick={() =>
                      visibleSlots[3] &&
                      handleUploadClick(visibleSlots[3].roundDay, visibleSlots[3].angle)
                    }
                    disabled={uploading}
                  >
                    <div className="h-full w-full">
                      <img
                        src={frontGuideImage}
                        alt="정면 가이드라인"
                        className="h-full w-full object-cover opacity-60"
                      />
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              // 완료 상태거나 다음 슬롯이 없을 때 빈 공간
              <div className="h-full"></div>
            )}
          </div>

          {/* 오른쪽 회차 이동 버튼 - 더 바깥쪽 + 호버 효과 */}
          {canGoNext && (
            <Button
              variant="default"
              size="sm"
              className="legacy-btn absolute -right-3 top-1/2 z-20 h-8 w-8 -translate-y-1/2 transform p-0 opacity-30 shadow-xl transition-all duration-300 hover:scale-110 hover:opacity-100 xs:-right-4 sm:-right-5"
              onClick={goToNextRound}
              disabled={uploading}
            >
              <ChevronRight className="h-4 w-4 font-bold" />
            </Button>
          )}
        </div>

        {/* 업로드 중 표시 */}
        {uploading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/80">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 animate-pulse" />
              <span className="text-sm">업로드 중...</span>
            </div>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // photos 배열의 실제 내용이 같으면 리렌더링하지 않음
    return (
      prevProps.caseId === nextProps.caseId &&
      prevProps.isCompleted === nextProps.isCompleted &&
      prevProps.photos.length === nextProps.photos.length &&
      prevProps.photos.every((photo, index) => {
        const nextPhoto = nextProps.photos?.[index];
        return (
          nextPhoto &&
          photo.id === nextPhoto.id &&
          photo.uploaded === nextPhoto.uploaded &&
          photo.imageUrl === nextPhoto.imageUrl
        );
      })
    );
  }
);

export default PhotoRoundCarousel;

// linting: react/display-name
PhotoRoundCarousel.displayName = 'PhotoRoundCarousel';
