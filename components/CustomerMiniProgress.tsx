import { cn } from "@/lib/utils";

type Props = {
  customers: { id: number; completed: 0 | 1 | 2 | 3 }[]; // 길이 10
};

export default function CustomerMiniProgress({ customers }: Props) {
  return (
    <div className="grid grid-cols-5 gap-x-2 gap-y-3 w-full xs:text-xs text-[10px]">
      {customers.map(({ id, completed }) => (
        <div key={id} className="flex flex-col items-center gap-1 min-w-0">
          {/* 번호 뱃지 */}
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            {id}
          </div>

          {/* 3-dot 진행도 */}
          <div className="flex gap-0.5">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  step <= completed ? "bg-blue-500" : "bg-gray-300/70"
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 