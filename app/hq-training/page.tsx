"use client";
import { useState, useEffect } from "react";
import { groupBy } from "lodash-es";
import { format, compareDesc } from "date-fns";
import { ko } from "date-fns/locale";
import TrainingCard, { TrainingReq } from "./TrainingCard";
import { getTrainingRequests } from "./api/get-requests";

interface TrainingRound {
  round: number;
  date: string;
  list: TrainingReq[];
}

export default function HQTrainingPage() {
  const [reqs, setReqs] = useState<TrainingRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrainingRequests().then((data) => {
      // 날짜별 그룹핑 (문자열 'YYYY-MM-DD' 기준)
      const groups = groupBy(data, (r) => r.lecture_date);
      
      // 최신 날짜가 1회차가 되도록 날짜 desc 정렬
      const sortedDates = Object.keys(groups).sort((a, b) =>
        compareDesc(new Date(a), new Date(b))
      );
      
      // [{ round: 1, date: '2025-07-10', list: [...]}, …]
      const rounds = sortedDates.map((date, idx) => ({
        round: idx + 1,
        date,
        list: groups[date] || [],
      }));
      
      setReqs(rounds);
      setLoading(false);
    });
  }, []);

  // 완료 토글 함수 (회차별 구조에 맞게 수정)
  const toggle = (id: string) =>
    setReqs((prev) =>
      prev.map((sec) => ({
        ...sec,
        list: sec.list.map((r) =>
          r.id === id ? { ...r, is_completed: !r.is_completed } : r
        ),
      }))
    );

  // 전체 통계 계산
  const totalCount = reqs.reduce((sum, round) => sum + round.list.length, 0);
  const completedCount = reqs.reduce(
    (sum, round) => sum + round.list.filter(req => req.is_completed).length, 
    0
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

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

      {/* 회차별 섹션 */}
      <main className="flex flex-col gap-6">
        {reqs.map(({ round, date, list: arr }) => (
          <section key={date} className="flex flex-col gap-3">
            {/* 섹션 헤더 */}
            <h3 className="text-sm font-semibold text-gray-800">
              본사 실무교육&nbsp;{round}회차&nbsp;(
              {format(new Date(date), "yyyy.MM.dd", { locale: ko })}
              )
            </h3>

            {/* 카드 그리드 (모바일 1열 → sm 2열 → lg 3열) */}
            <div className="grid gap-4 place-items-center sm:grid-cols-2 lg:grid-cols-3">
              {arr.map((req) => (
                <TrainingCard key={req.id} req={req} onToggle={toggle} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
} 