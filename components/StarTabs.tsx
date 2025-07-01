import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: { manager?: boolean; owner?: boolean; director?: boolean };
  onToggle: (key: "manager") => void;          // 토글 가능한 건 'manager' 하나
};

export default function StarTabs({ value, onToggle }: Props) {
  const SEG = [
    { key: "manager", label: "담당", readOnly: false, active: value.manager },
    { key: "owner", label: "원장님", readOnly: true, active: value.owner },
    { key: "director", label: "교육 이사", readOnly: true, active: value.director },
  ] as const;

  const allDone = value.manager && value.owner && value.director;

  return (
    <div>
      {/* 세그먼트 탭 - 한 줄 고정 */}
      <div className="flex items-center gap-2 py-[3px] whitespace-nowrap">
        {/* 통합 별 – 왼쪽에 배치 */}
        <span
          className={cn(
            "text-[22px] flex-shrink-0",
            allDone ? "text-yellow-400" : "text-gray-300"
          )}
        >
          🌟
        </span>

        {SEG.map(({ key, label, readOnly, active }) => (
          <button
            key={key}
            disabled={readOnly}
            onClick={() => !readOnly && onToggle("manager")}
            className={cn(
              "flex-1 min-w-0 flex items-center justify-center gap-[2px] px-1 py-[3px] border rounded-md text-[11px] leading-none",
              readOnly && "opacity-60 cursor-default",
              active ? "bg-yellow-50 border-yellow-400" : "bg-muted/20"
            )}
          >
            <Star
              className={cn(
                "size-4",
                active ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
              )}
            />
            {/* 모바일에서 라벨 축약 */}
            {key === "owner" ? (
              <>
                <span className="inline xs:hidden">원장</span>
                <span className="hidden xs:inline">원장님</span>
              </>
            ) : key === "director" ? (
              <>
                <span className="inline xs:hidden">교육</span>
                <span className="hidden xs:inline">교육&nbsp;이사</span>
              </>
            ) : (
              label   /* 담당 */
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 