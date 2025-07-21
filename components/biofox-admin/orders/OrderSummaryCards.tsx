'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Calculator,
  Store,
  TrendingDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface OrderSummaryCardsProps {
  summary: {
    total_sales: number;
    total_commission: number;
    order_count: number;
    average_order?: number;
    growth_rate?: number;
    active_shops?: number;
  };
  loading?: boolean;
  previousPeriod?: {
    total_sales: number;
    order_count: number;
  };
}

export function OrderSummaryCards({ 
  summary, 
  loading = false,
  previousPeriod
}: OrderSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 성장률 계산
  const growthRate = previousPeriod?.total_sales 
    ? ((summary.total_sales - previousPeriod.total_sales) / previousPeriod.total_sales * 100)
    : 0;

  const cards = [
    {
      title: '총 매출',
      value: formatCurrency(summary.total_sales),
      icon: DollarSign,
      description: growthRate !== 0 
        ? `전월 대비 ${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`
        : '이번 달 매출',
      trend: growthRate,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: '총 수수료',
      value: formatCurrency(summary.total_commission),
      icon: Calculator,
      description: summary.total_sales > 0
        ? `매출의 ${((summary.total_commission / summary.total_sales) * 100).toFixed(1)}%`
        : '계산된 수수료',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: '주문 건수',
      value: formatNumber(summary.order_count),
      icon: ShoppingCart,
      description: previousPeriod?.order_count
        ? `전월 대비 ${summary.order_count - previousPeriod.order_count > 0 ? '+' : ''}${summary.order_count - previousPeriod.order_count}건`
        : '총 주문 수',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: '평균 주문 금액',
      value: summary.order_count > 0 
        ? formatCurrency(summary.total_sales / summary.order_count)
        : '₩0',
      icon: TrendingUp,
      description: '주문당 평균 금액',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {card.trend !== undefined && card.trend !== 0 && (
                  card.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )
                )}
                {card.description}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
