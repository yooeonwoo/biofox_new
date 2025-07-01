import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: { clinical?: boolean; learning?: boolean };
  onToggle: (key: "clinical" | "learning") => void;
  hideIntegratedStar?: boolean;
};

export default function ClinicalLearningTabs({ value, onToggle, hideIntegratedStar }: Props) {
  const SEG = [
    { key: "clinical", label: "임상", active: value.clinical },
    { key: "learning", label: "학습", active: value.learning },
  ] as const;

  const allDone = value.clinical && value.learning;

  return (
    <div>
      {/* 세그먼트 탭 - 한 줄 고정 */}
      <div className="flex items-center gap-2 py-[3px] whitespace-nowrap">
        {/* 통합 별 – 조건부 렌더링 */}
        {!hideIntegratedStar && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className={cn(
                "text-[22px] transition-opacity duration-200",
                allDone
                  ? "text-yellow-400 opacity-100"
                  : "text-gray-300 opacity-40"
              )}
              aria-label="임상 학습 평가 완료 여부"
            >
              🌟
            </span>
            <span
              className={cn(
                "text-[22px] transition-opacity duration-200",
                allDone
                  ? "text-yellow-400 opacity-100"
                  : "text-gray-300 opacity-40"
              )}
              aria-label="임상 학습 평가 완료 여부"
            >
              🌟
            </span>
          </div>
        )}

        {SEG.map(({ key, label, active }) => (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className={cn(
              "flex-1 min-w-0 flex items-center justify-center gap-[2px] px-1 py-[3px] border rounded-md text-[11px] leading-none",
              active ? "bg-yellow-50 border-yellow-400" : "bg-muted/20"
            )}
          >
            <Star
              className={cn(
                "size-4",
                active ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
              )}
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 통합 별 상태를 외부에서 계산할 수 있도록 헬퍼 함수 export
export const getClinicalLearningStarState = (value: { clinical?: boolean; learning?: boolean }) => {
  return value.clinical && value.learning;
}; 