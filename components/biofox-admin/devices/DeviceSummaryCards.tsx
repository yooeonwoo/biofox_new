'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, PackageX, TrendingUp, DollarSign } from 'lucide-react'

interface DeviceSummaryCardsProps {
  summary: {
    total_sold: number
    total_returned: number
    net_devices: number
    total_commission: number
  }
}

export function DeviceSummaryCards({ summary }: DeviceSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const cards = [
    {
      title: '총 판매',
      value: summary.total_sold.toLocaleString() + '대',
      icon: Package,
      className: 'text-blue-600',
      bgClassName: 'bg-blue-50'
    },
    {
      title: '총 반품',
      value: summary.total_returned.toLocaleString() + '대',
      icon: PackageX,
      className: 'text-red-600',
      bgClassName: 'bg-red-50'
    },
    {
      title: '순 판매',
      value: summary.net_devices.toLocaleString() + '대',
      icon: TrendingUp,
      className: 'text-green-600',
      bgClassName: 'bg-green-50'
    },
    {
      title: '총 수수료',
      value: formatCurrency(summary.total_commission),
      icon: DollarSign,
      className: 'text-purple-600',
      bgClassName: 'bg-purple-50'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgClassName}`}>
              <card.icon className={`h-4 w-4 ${card.className}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}