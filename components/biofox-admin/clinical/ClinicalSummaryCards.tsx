'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle2, Users, Camera } from 'lucide-react'

interface ClinicalSummaryCardsProps {
  summary: {
    total_cases: number
    active_cases: number
    completed_cases: number
    self_cases: number
    customer_cases: number
    consented_count?: number
    non_consented_count?: number
  }
}

export function ClinicalSummaryCards({ summary }: ClinicalSummaryCardsProps) {
  const cards = [
    {
      title: '전체 임상',
      value: summary.total_cases,
      icon: Activity,
      className: 'text-blue-600',
      bgClassName: 'bg-blue-50'
    },
    {
      title: '진행중',
      value: summary.active_cases,
      icon: Activity,
      className: 'text-orange-600',
      bgClassName: 'bg-orange-50'
    },
    {
      title: '완료',
      value: summary.completed_cases,
      icon: CheckCircle2,
      className: 'text-green-600',
      bgClassName: 'bg-green-50'
    },
    {
      title: '고객 임상',
      value: summary.customer_cases,
      icon: Users,
      className: 'text-purple-600',
      bgClassName: 'bg-purple-50'
    }
  ]

  // 관리자용 추가 카드
  if (summary.consented_count !== undefined) {
    cards.push({
      title: '동의 임상',
      value: summary.consented_count,
      icon: Camera,
      className: 'text-green-600',
      bgClassName: 'bg-green-50'
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <div className="text-2xl font-bold">{card.value}건</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}