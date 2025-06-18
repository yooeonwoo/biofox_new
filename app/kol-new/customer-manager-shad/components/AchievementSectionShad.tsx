import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export interface Achievements {
  basicTraining: boolean;
  standardProtocol: boolean;
  expertCourse: boolean;
}

interface Props {
  value: Achievements;
  onChange: (v: Achievements) => void;
  className?: string;
}

const LEVELS: { key: keyof Achievements; label: string; level: 1 | 2 | 3 }[] = [
  { key: "basicTraining", label: "본사 실무교육 이수", level: 1 },
  { key: "standardProtocol", label: "본사 표준 프로토콜 준수", level: 2 },
  { key: "expertCourse", label: "본사 전문가 과정 이수", level: 3 },
];

export default function AchievementSectionShad({ value, onChange, className }: Props) {
  const toggle = (lvl: 1 | 2 | 3, checked: boolean) => {
    const newVal: Achievements = { ...value };
    if (checked) {
      // 체크 → 하위까지 모두 true
      for (let i = 1; i <= lvl; i++) {
        if (i === 1) newVal.basicTraining = true;
        if (i === 2) newVal.standardProtocol = true;
        if (i === 3) newVal.expertCourse = true;
      }
    } else {
      // 해제 → 상위부터 모두 false
      for (let i = lvl; i <= 3; i++) {
        if (i === 1) newVal.basicTraining = false;
        if (i === 2) newVal.standardProtocol = false;
        if (i === 3) newVal.expertCourse = false;
      }
    }
    onChange(newVal);
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {LEVELS.map(({ key, label, level }) => (
        <div key={key} className="flex items-center gap-2">
          <Checkbox
            id={`achieve-${key}`}
            checked={value[key]}
            onCheckedChange={(c) => toggle(level, !!c)}
            className="w-4 h-4"
          />
          <label htmlFor={`achieve-${key}`} className="text-sm select-none">
            {label}
          </label>
          <Badge variant="outline" className="ml-1">
            {Array.from({ length: level }).map((_, i) => (
              <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
            ))}
          </Badge>
        </div>
      ))}
    </div>
  );
} 