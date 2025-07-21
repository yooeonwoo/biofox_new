'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Package, FileText } from 'lucide-react'

interface CommissionDetailModalProps {
  commissionId: string | null
  open: boolean
  onClose: () => void
}

export function CommissionDetailModal({ commissionId, open, onClose }: CommissionDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [commission, setCommission] = useState<any>(null)

  useEffect(() => {
    if (commissionId && open) {
      fetchCommissionDetail()
    }
  }, [commissionId, open])

  const fetchCommissionDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/commissions/${commissionId}`)
      if (response.ok) {
        const data = await response.json()
        setCommission(data)
      }
    } catch (error) {
      console.error('Failed to fetch commission detail:', error)
    }
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
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!commission) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {commission.kol.name} - {new Date(commission.calculation_month + '-01').toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long'
            })} 정산 상세
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">KOL/OL 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이름</span>
                  <span className="font-medium">{commission.kol.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">역할</span>
                  <Badge variant="outline">{commission.kol.role.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">이메일</span>
                  <span>{commission.kol.email}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">정산 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 수수료</span>
                  <span className="font-bold text-lg">{formatCurrency(commission.total_commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <Badge className={commission.status === 'paid' ? 'bg-green-500' : ''}>
                    {commission.status === 'paid' ? '지급완료' : commission.status === 'adjusted' ? '조정됨' : '계산완료'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="subordinate" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="subordinate">소속 전문점</TabsTrigger>
              <TabsTrigger value="self">본인샵</TabsTrigger>
              <TabsTrigger value="device">기기 판매</TabsTrigger>
              <TabsTrigger value="adjustment">조정 내역</TabsTrigger>
            </TabsList>

            <TabsContent value="subordinate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    소속 전문점 수수료
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {commission.details.subordinate_shops.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">소속 전문점 매출이 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {commission.details.subordinate_shops.map((shop: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">{shop.shop_name}</div>
                            <div className="text-sm text-muted-foreground">
                              매출: {formatCurrency(shop.sales)} × {shop.commission_rate}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(shop.commission_amount)}</div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>소계</span>
                        <span>{formatCurrency(commission.details.subordinate_shops.reduce((sum: number, s: any) => sum + s.commission_amount, 0))}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="self" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">본인샵 수수료</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <div className="font-medium">본인샵 매출</div>
                        <div className="text-sm text-muted-foreground">
                          다음달 환급 예정
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          매출: {formatCurrency(commission.details.self_shop.sales)}
                        </div>
                        <div className="font-medium">{formatCurrency(commission.details.self_shop.commission_amount)}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="device" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    기기 판매 수수료
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {commission.details.devices.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">기기 판매가 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {commission.details.devices.map((device: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="font-medium">{device.shop_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {device.quantity > 0 ? '+' : ''}{device.quantity}대 × {formatCurrency(device.commission_per_unit)}
                              <Badge variant="outline" className="ml-2">
                                {device.tier === 'tier_5_plus' ? '5대 이상' : '1-4대'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(device.total_commission)}</div>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>소계</span>
                        <span>{formatCurrency(commission.details.devices.reduce((sum: number, d: any) => sum + d.total_commission, 0))}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adjustment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    조정 내역
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(!commission.adjustments || commission.adjustments.length === 0) ? (
                    <p className="text-muted-foreground text-center py-4">조정 내역이 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {commission.adjustments.map((adj: any, index: number) => (
                        <div key={index} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">
                              {adj.amount > 0 ? '+' : ''}{formatCurrency(adj.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(adj.adjusted_at).toLocaleDateString('ko-KR')}
                            </div>
                          </div>
                          <div className="text-sm">{adj.reason}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            처리자: {adj.adjusted_by.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 지급 정보 */}
          {commission.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">지급 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">지급일</span>
                  <span>{new Date(commission.payment.paid_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">지급 방법</span>
                  <span>{commission.payment.payment_method}</span>
                </div>
                {commission.payment.reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">참조 번호</span>
                    <span>{commission.payment.reference}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}