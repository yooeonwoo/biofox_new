import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Achievements } from "@/lib/types/customer";

interface Props {
  level: 1 | 2 | 3;
  achievements: Achievements;
  onChange: (a: Achievements) => void;
}

const LABELS: Record<1 | 2 | 3, string> = {
  1: "본사 실무교육 이수",
  2: "본사 표준 프로토콜을 잘 따르는가?",
  3: "본사 전문가 과정을 모두 이수하였는가?",
};

const CONTAINER_STYLES: Record<1 | 2 | 3, string> = {
  1: "bg-white border-gray-200",
  2: "bg-white border-green-200",
  3: "bg-white border-violet-200",
};

export default function AchievementCheckbox({
  level,
  achievements,
  onChange,
}: Props) {
  const keys: (keyof Achievements)[] = [
    "basicTraining",
    "standardProtocol",
    "expertCourse",
  ];
  const key = keys[level - 1];
  const checked = achievements[key];

  const toggle = (isChecked: boolean | "indeterminate") => {
    if (typeof isChecked !== "boolean") return;
    const newVal = { ...achievements };
    if (isChecked) {
      // 체크 → 하위레벨까지 모두 true
      for (let i = 0; i < level; i++) newVal[keys[i]] = true;
    } else {
      // 해제 → 상위레벨부터 모두 false
      for (let i = level - 1; i < 3; i++) newVal[keys[i]] = false;
    }
    onChange(newVal);
  };

  const id = `achieve-level-${level}-${key}`;

  return (
    <div className={cn("p-3 rounded-lg border", CONTAINER_STYLES[level])}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox id={id} checked={checked} onCheckedChange={toggle} />
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 select-none"
          >
            {LABELS[level]}
          </label>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: level }).map((_, i) => (
            <Star
              key={i}
              size={16}
              className="fill-yellow-500 text-yellow-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
} 