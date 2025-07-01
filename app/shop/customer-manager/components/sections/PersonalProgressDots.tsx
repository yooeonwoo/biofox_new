import { cn } from "@/lib/utils";

type Props = { 
  finished: number; // 0~10
  onProgressClick?: (level: number) => void;
};

export default function PersonalProgressDots({ finished, onProgressClick }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 10 }, (_, i) => {
        const idx = i + 1;
        const done = idx <= finished;
        return (
          <span
            key={idx}
            aria-label={`회차 ${idx} / 10`}
            className={cn(
              "w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-medium",
              "transition-colors duration-200 cursor-pointer",
              done
                ? "bg-blue-600 text-white"
                : "bg-gray-300/70 text-gray-600"
            )}
            onClick={() => onProgressClick?.(idx)}
          >
            {idx}
          </span>
        );
      })}
    </div>
  );
} 