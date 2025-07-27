'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CommissionSummaryCardsProps {
  summary: {
    total_amount: number;
    calculated_amount: number;
    paid_amount: number;
    pending_amount: number;
  };
}

export function CommissionSummaryCards({ summary }: CommissionSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: '총 수수료',
      value: formatCurrency(summary.total_amount),
      icon: Calculator,
      className: 'text-blue-600',
      bgClassName: 'bg-blue-50',
    },
    {
      title: '계산 완료',
      value: formatCurrency(summary.calculated_amount),
      icon: AlertCircle,
      className: 'text-orange-600',
      bgClassName: 'bg-orange-50',
    },
    {
      title: '지급 완료',
      value: formatCurrency(summary.paid_amount),
      icon: CheckCircle2,
      className: 'text-green-600',
      bgClassName: 'bg-green-50',
    },
    {
      title: '지급 대기',
      value: formatCurrency(summary.pending_amount),
      icon: CreditCard,
      className: 'text-purple-600',
      bgClassName: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card: any, index: number) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`rounded-lg p-2 ${card.bgClassName}`}>
              <card.icon className={`h-4 w-4 ${card.className}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
