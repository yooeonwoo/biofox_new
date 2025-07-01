import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: { owner?: boolean; educator?: boolean };
  onToggle: (key: "owner" | "educator") => void;
  hideIntegratedStar?: boolean;
};

export default function ExpertCourseTabs({ value, onToggle, hideIntegratedStar }: Props) {
  const SEG = [
    { key: "owner", label: "원장님", active: value.owner },
    { key: "educator", label: "교육 담당", active: value.educator },
  ] as const;

  const allDone = value.owner && value.educator;

  return (
    <div>
      {/* 세그먼트 탭 - 한 줄 고정 */}
      <div className="flex items-center gap-2 py-[3px] whitespace-nowrap">
        {/* 통합 별 3개 – 조건부 렌더링 */}
        {!hideIntegratedStar && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <span
              className={cn(
                "text-[22px] transition-opacity duration-200",
                allDone
                  ? "text-yellow-400 opacity-100"
                  : "text-gray-300 opacity-40"
              )}
              aria-label="전문가과정 평가 완료 여부"
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
              aria-label="전문가과정 평가 완료 여부"
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
              aria-label="전문가과정 평가 완료 여부"
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
export const getExpertCourseStarState = (value: { owner?: boolean; educator?: boolean }) => {
  return value.owner && value.educator;
}; 