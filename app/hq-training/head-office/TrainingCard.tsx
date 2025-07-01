import { CheckCircle, Circle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export interface TrainingReq {
  id: string;
  created_at: string;   // 신청일자
  shop_name: string;
  contact_name: string;
  contact_phone: string;
  lecture_date: string;
  is_completed: boolean;
}

export default function TrainingCard({
  req,
  onToggle,
}: {
  req: TrainingReq;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="w-full max-w-[420px] p-4 bg-white border rounded-lg shadow-sm flex flex-col gap-2">
      {/* 1행 : 샵명 + 완료버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold truncate">{req.shop_name}</span>

        <button
          onClick={() => onToggle(req.id)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border
                     transition-colors hover:bg-gray-50"
        >
          {req.is_completed ? (
            <>
              <CheckCircle className="size-3.5 text-green-600" />
              <span className="text-green-600">완료</span>
            </>
          ) : (
            <>
              <Circle className="size-3.5 text-gray-400" />
              <span className="text-gray-600">미완</span>
            </>
          )}
        </button>
      </div>

      {/* 2행 : 정보 그리드 */}
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[11px] xs:text-xs">
        <span className="text-gray-500">신청일자</span>
        <span>{format(new Date(req.created_at), "yyyy.MM.dd", { locale: ko })}</span>

        <span className="text-gray-500">성함</span>
        <span>{req.contact_name}</span>

        <span className="text-gray-500">연락처</span>
        <span>{req.contact_phone}</span>

        <span className="text-gray-500">강의 날짜</span>
        <span>{format(new Date(req.lecture_date), "yyyy.MM.dd", { locale: ko })}</span>
      </div>
    </div>
  );
} 