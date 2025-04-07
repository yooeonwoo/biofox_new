'use client';

import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Props 타입 정의
interface SalesChartProps {
  kolId?: number;
}

// 월별 매출 데이터 타입
interface MonthlyData {
  month: string;
  sales: number;
  allowance: number;
}

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesChart({ kolId }: SalesChartProps) {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // KOL 월별 매출 및 수당 데이터 가져오기
  useEffect(() => {
    const fetchMonthlySales = async () => {
      if (!kolId) return;

      setLoading(true);
      setError(null);

      try {
        // 최근 6개월 데이터 가져오기
        const response = await fetch(`/api/kol-new/monthly-sales?kolId=${kolId}`);
        if (!response.ok) {
          throw new Error('월별 매출 데이터를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setChartData(data);
      } catch (err) {
        console.error('차트 데이터 로드 에러:', err);
        setError('차트 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlySales();
  }, [kolId]);

  // 차트가 준비되지 않았거나 kolId가 없는 경우 목업 데이터 사용
  const months = chartData.length > 0 
    ? chartData.map(d => d.month) 
    : ['1월', '2월', '3월', '4월', '5월', '6월'];
  
  const salesData = chartData.length > 0 
    ? chartData.map(d => d.sales) 
    : [1200, 1900, 1500, 2050, 2300, 4004];
  
  const allowanceData = chartData.length > 0 
    ? chartData.map(d => d.allowance) 
    : [600, 800, 700, 1100, 1200, 2100];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('ko-KR').format(context.parsed.y) + '만';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          // y축 레이블 포맷 설정
          callback: function(value) {
            return value.toLocaleString() + '만';
          }
        }
      }
    }
  };

  const data = {
    labels: months,
    datasets: [
      {
        label: '매출',
        data: salesData,
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: '수당',
        data: allowanceData,
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return <div className="flex h-80 items-center justify-center">데이터 로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="flex h-80 flex-col items-center justify-center text-red-500">
        <p className="mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="h-80">
      <Bar options={options} data={data} />
    </div>
  );
} 