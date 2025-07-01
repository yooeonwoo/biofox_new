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
      {/* 통합 별(타이틀 위치) */}
      <span
        className={cn(
          "text-2xl text-yellow-400 block mb-2",
          allDone ? "" : "opacity-40"       /* 세 탭 모두 활성 → 진한 노랑 */
        )}
      >
        🌟
      </span>

      {/* 세그먼트 탭 - 한 줄 고정 */}
      <div className="flex items-center gap-2 py-1">
        {SEG.map(({ key, label, readOnly, active }) => (
          <button
            key={key}
            disabled={readOnly}
            onClick={() => !readOnly && onToggle("manager")}
            className={cn(
              "flex-1 min-w-0 flex items-center justify-center gap-0.5 px-1.5 py-1 border rounded-md text-[11px]",
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
            {label}
          </button>
        ))}
      </div>
    </div>
  );
} 