import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function HQTrainingDashboard() {
  // Mock 통계 데이터 (추후 실제 데이터로 교체)
  const stats = {
    totalRequests: 6,
    completedRequests: 2,
    upcomingRounds: 3,
    totalParticipants: 12,
  };

  return (
    <div className="p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          본사 교육 대시보드
        </h1>
        <p className="text-gray-600">
          본사 교육 현황을 한눈에 확인하고 관리하세요.
        </p>
      </div>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="전체 신청"
          value={stats.totalRequests}
          unit="건"
          icon={<Users className="w-5 h-5" />}
          bgColor="bg-blue-500"
        />
        <StatCard
          title="완료"
          value={stats.completedRequests}
          unit="건"
          icon={<CheckCircle className="w-5 h-5" />}
          bgColor="bg-green-500"
        />
        <StatCard
          title="진행 중"
          value={stats.totalRequests - stats.completedRequests}
          unit="건"
          icon={<Clock className="w-5 h-5" />}
          bgColor="bg-orange-500"
        />
        <StatCard
          title="예정 회차"
          value={stats.upcomingRounds}
          unit="회차"
          icon={<Calendar className="w-5 h-5" />}
          bgColor="bg-purple-500"
        />
      </div>

      {/* 빠른 액션 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              본사 실무교육 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              교육 신청 현황을 확인하고 완료 상태를 관리하세요.
            </p>
            <Link
              href="/hq-training/head-office"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              관리하기
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              교육 일정 관리
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              향후 교육 일정을 계획하고 관리하세요.
            </p>
            <button
              disabled
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
            >
              준비 중
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({
  title,
  value,
  unit,
  icon,
  bgColor,
}: {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-sm text-gray-500">{unit}</span>
            </div>
          </div>
          <div className={`${bgColor} text-white p-2 rounded-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 