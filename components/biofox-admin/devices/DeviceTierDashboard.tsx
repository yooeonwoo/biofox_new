'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Award, Target } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface DeviceTierDashboardProps {
  kolId?: string
}

interface KolTierInfo {
  id: string
  name: string
  role: string
  net_devices_sold: number
  current_tier: string
  tier_changed_at?: string
  progress_to_next: number
}

export function DeviceTierDashboard({ kolId }: DeviceTierDashboardProps) {
  const [tierData, setTierData] = useState<KolTierInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTierData()
  }, [kolId])

  const fetchTierData = async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('kol_device_accumulator')
      .select(`
        *,
        kol:profiles!kol_id (
          id,
          name,
          role
        )
      `)
      .order('net_devices_sold', { ascending: false })

    if (kolId) {
      query = query.eq('kol_id', kolId)
    } else {
      query = query.limit(10)
    }

    const { data } = await query
    
    const processedData = (data || []).map(item => ({
      id: item.kol.id,
      name: item.kol.name,
      role: item.kol.role,
      net_devices_sold: item.net_devices_sold || 0,
      current_tier: item.current_tier,
      tier_changed_at: item.tier_changed_at,
      progress_to_next: item.current_tier === 'tier_1_4' 
        ? Math.min((item.net_devices_sold / 5) * 100, 100)
        : 100
    }))

    setTierData(processedData)
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Award className="h-5 w-5" />
        KOL 티어 현황
      </h3>

      <div className="grid gap-4">
        {tierData.map((kol) => (
          <Card key={kol.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{kol.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {kol.role.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{kol.net_devices_sold}대</div>
                  <Badge className={kol.current_tier === 'tier_5_plus' ? 'bg-purple-500' : ''}>
                    {kol.current_tier === 'tier_5_plus' ? '5대 이상' : '1-4대'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {kol.current_tier === 'tier_1_4' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>다음 티어까지</span>
                    <span className="font-medium">{5 - kol.net_devices_sold}대</span>
                  </div>
                  <Progress value={kol.progress_to_next} className="h-2" />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">현재 수수료</p>
                  <p className="font-medium">
                    {formatCurrency(kol.current_tier === 'tier_5_plus' ? 2500000 : 1500000)}/대
                  </p>
                </div>
                {kol.current_tier === 'tier_1_4' && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      다음 티어 수수료
                    </p>
                    <p className="font-medium text-primary">
                      {formatCurrency(2500000)}/대
                    </p>
                  </div>
                )}
              </div>

              {kol.current_tier === 'tier_1_4' && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm">
                    <TrendingUp className="inline h-3 w-3 mr-1" />
                    {5 - kol.net_devices_sold}대 더 판매하면 수수료가{' '}
                    <span className="font-medium text-primary">
                      {formatCurrency(1000000)}
                    </span>
                    {' '}인상됩니다!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}