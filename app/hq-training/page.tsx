"use client";
import { useState } from "react";
import TrainingCard, { TrainingReq } from "./TrainingCard";

const MOCK: TrainingReq[] = [
  {
    id: "a1",
    created_at: "2024-03-01",
    shop_name: "바이오포톤 강남점",
    contact_name: "홍길동",
    contact_phone: "010-1234-5678",
    lecture_date: "2024-04-05",
    is_completed: false,
  },
  {
    id: "b2",
    created_at: "2024-03-03",
    shop_name: "바이오포톤 부산점",
    contact_name: "김미래",
    contact_phone: "010-9876-5432",
    lecture_date: "2024-04-08",
    is_completed: true,
  },
  {
    id: "c3",
    created_at: "2024-03-05",
    shop_name: "바이오포톤 대구점",
    contact_name: "이진수",
    contact_phone: "010-5555-1234",
    lecture_date: "2024-04-12",
    is_completed: false,
  },
  {
    id: "d4",
    created_at: "2024-03-07",
    shop_name: "바이오포톤 인천점",
    contact_name: "박서현",
    contact_phone: "010-7777-8888",
    lecture_date: "2024-04-15",
    is_completed: true,
  },
  {
    id: "e5",
    created_at: "2024-03-10",
    shop_name: "바이오포톤 광주점",
    contact_name: "최민호",
    contact_phone: "010-3333-4444",
    lecture_date: "2024-04-20",
    is_completed: false,
  },
];

export default function HQTrainingPage() {
  const [list, setList] = useState<TrainingReq[]>(MOCK);

  // 완료 토글 (모바일에서도 즉시 반응)
  const toggle = (id: string) =>
    setList((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_completed: !r.is_completed } : r
      )
    );

  const completedCount = list.filter(req => req.is_completed).length;
  const totalCount = list.length;

  return (
    <div className="p-4 md:p-6">
      {/* 헤더 영역 */}
      <div className="mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
          본사 교육 담당자 페이지
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>전체: <strong>{totalCount}건</strong></span>
          <span>완료: <strong className="text-green-600">{completedCount}건</strong></span>
          <span>미완료: <strong className="text-orange-600">{totalCount - completedCount}건</strong></span>
        </div>
      </div>

      {/* 카드 그리드 */}
      <main className="grid gap-4 place-items-center sm:grid-cols-2 lg:grid-cols-3">
        {list.map((req) => (
          <TrainingCard key={req.id} req={req} onToggle={toggle} />
        ))}
      </main>
    </div>
  );
} 