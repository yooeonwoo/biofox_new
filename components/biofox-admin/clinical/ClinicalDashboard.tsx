'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Activity, TrendingUp, Users, Clock, Camera } from 'lucide-react'

interface ClinicalDashboardProps {
  data?: any
}

export function ClinicalDashboard({ data }: ClinicalDashboardProps) {
  if (!data) return null

  const { overview, by_shop, by_treatment, recent_activities } = data

  return (
    <div className="space-y-6">
      {/* 개요 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">동의율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.consent_rate.toFixed(1)}%
            </div>
            <Progress value={overview.consent_rate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {overview.consented_count}건 / {overview.total_cases}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">평균 회차</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.average_sessions.toFixed(1)}회
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">진행중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.active_cases}건
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.completed_cases}건
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 샵별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">샵별 임상 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {by_shop.slice(0, 5).map((shop: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{shop.shop_name}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>전체: {shop.total_cases}건</span>
                      <span>진행중: {shop.active_cases}건</span>
                      <span>동의율: {shop.consent_rate.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    평균 {shop.average_sessions.toFixed(1)}회
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 치료 항목별 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">치료 항목별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {by_treatment.slice(0, 5).map((treatment: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{treatment.treatment_item}</p>
                    <span className="text-sm text-muted-foreground">
                      {treatment.count}건
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={treatment.completion_rate} 
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12">
                      {treatment.completion_rate.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    평균 {treatment.average_sessions.toFixed(1)}회 / 완료율 {treatment.completion_rate.toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 활동</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recent_activities.map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-muted">
                  {activity.type === 'photo_uploaded' ? (
                    <Camera className="h-4 w-4" />
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.shop_name}</span>
                    {' - '}
                    <span>{activity.subject_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.type === 'photo_uploaded' 
                      ? `${activity.session_number}회차 사진 업로드`
                      : '임상 업데이트'}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}