'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Package,
  Users,
  Activity,
  DollarSign
} from 'lucide-react';
// User 타입을 직접 정의
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'kol' | 'ol' | 'shop_owner';
  status: 'pending' | 'approved' | 'rejected';
  shop_name: string;
  region?: string;
  commission_rate?: number;
  total_subordinates: number;
  active_subordinates: number;
  naver_place_link?: string;
  approved_at?: string;
  approved_by?: { name: string };
  created_at: string;
}

interface UserDetailModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

interface UserDetailResponse {
  success: boolean;
  data: {
    user: User;
    relationship_history: Array<{
      id: string;
      parent_id: string;
      parent_name: string;
      parent_role: string;
      parent_shop_name: string;
      started_at: string;
      ended_at?: string | null;
      is_active: boolean;
      relationship_type: string;
      notes?: string;
    }>;
    recent_activity: {
      orders: Array<{
        id: string;
        order_date: string;
        order_number: string;
        total_amount: number;
        commission_amount: number;
        order_status: string;
        commission_status: string;
        created_at: string;
      }>;
      clinical_cases: Array<{
        id: string;
        name: string;
        status: string;
        subject_type: string;
        treatment_item: string;
        start_date: string;
        end_date?: string;
        total_sessions: number;
        consent_status: string;
        created_at: string;
      }>;
      device_sales: Array<{
        id: string;
        sale_date: string;
        device_name: string;
        quantity: number;
        tier_at_sale: string;
        standard_commission: number;
        actual_commission: number;
        commission_status: string;
        created_at: string;
      }>;
    };
    crm_stats: {
      total_cards: number;
      completed_stages: number;
      average_completion: number;
    };
    sales_stats: {
      total_sales: number;
      total_commission: number;
      total_orders: number;
      average_order_value: number;
    };
    commission_stats: {
      total_calculations: number;
      paid_calculations: number;
      pending_amount: number;
      paid_amount: number;
      last_calculation_date?: string;
    };
    device_stats: {
      total_devices_sold: number;
      total_devices_returned: number;
      net_devices_sold: number;
      current_tier: string;
      tier_1_4_count: number;
      tier_5_plus_count: number;
      tier_changed_at?: string;
      last_updated?: string;
    };
  };
}

export function UserDetailModal({ user, open, onClose }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<UserDetailResponse['data'] | null>(null);

  useEffect(() => {
    if (user && open) {
      fetchUserDetails();
    }
  }, [user, open]);

  const fetchUserDetails = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const result: UserDetailResponse = await response.json();
        if (result.success && result.data) {
          setDetailData(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };

  const roleLabels = {
    admin: '관리자',
    kol: 'KOL',
    ol: 'OL',
    shop_owner: '전문점 원장',
  };

  const statusConfig = {
    pending: { label: '승인 대기', variant: 'secondary' as const },
    approved: { label: '승인됨', variant: 'default' as const },
    rejected: { label: '거절됨', variant: 'destructive' as const },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>사용자 상세 정보</DialogTitle>
          <DialogDescription>
            {user?.name} ({user?.email})
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : detailData ? (
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">기본 정보</TabsTrigger>
              <TabsTrigger value="relationship">소속 관계</TabsTrigger>
              <TabsTrigger value="activity">최근 활동</TabsTrigger>
              <TabsTrigger value="stats">통계</TabsTrigger>
              <TabsTrigger value="commission">수수료</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserIcon className="h-4 w-4" />
                      <span>이름</span>
                    </div>
                    <p className="font-medium">{detailData.user.name}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span>이메일</span>
                    </div>
                    <p className="font-medium">{detailData.user.email}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Package className="h-4 w-4" />
                      <span>역할</span>
                    </div>
                    <Badge variant="outline">{roleLabels[detailData.user.role]}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Activity className="h-4 w-4" />
                      <span>상태</span>
                    </div>
                    <Badge variant={statusConfig[detailData.user.status].variant}>
                      {statusConfig[detailData.user.status].label}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>지역</span>
                    </div>
                    <p className="font-medium">{detailData.user.region || '-'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>가입일</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(detailData.user.created_at), 'PPP', { locale: ko })}
                    </p>
                  </div>
                </div>

                {detailData.user.approved_at && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">
                      {format(new Date(detailData.user.approved_at), 'PPP', { locale: ko })}에{' '}
                      {detailData.user.approved_by?.name || '관리자'}님이 승인
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="relationship" className="space-y-4">
                {detailData.relationship_history && detailData.relationship_history.length > 0 ? (
                  <div className="space-y-3">
                    {detailData.relationship_history.map((rel) => (
                      <div
                        key={rel.id}
                        className={`p-4 rounded-lg border ${
                          rel.is_active ? 'border-primary bg-primary/5' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{rel.parent_name}</p>
                            <p className="text-sm text-gray-500">{rel.parent_shop_name}</p>
                            <p className="text-xs text-gray-400">{roleLabels[rel.parent_role as keyof typeof roleLabels]}</p>
                          </div>
                          <div className="text-right">
                            {rel.is_active && (
                              <Badge variant="default">현재</Badge>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{rel.relationship_type}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>
                            시작: {format(new Date(rel.started_at), 'PPP', { locale: ko })}
                          </p>
                          {rel.ended_at && (
                            <p>
                              종료: {format(new Date(rel.ended_at), 'PPP', { locale: ko })}
                            </p>
                          )}
                          {rel.notes && (
                            <p className="mt-1 text-xs bg-gray-100 p-2 rounded">
                              {rel.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">소속 관계가 없습니다.</p>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">최근 주문</h4>
                  {detailData.recent_activity?.orders && detailData.recent_activity.orders.length > 0 ? (
                    <div className="space-y-2">
                      {detailData.recent_activity.orders.map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                            <p className="text-sm text-gray-500">
                              {order.order_number} - {format(new Date(order.order_date), 'PPP', { locale: ko })}
                            </p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                주문: {order.order_status === 'completed' ? '완료' : '진행중'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                수수료: {order.commission_status === 'paid' ? '지급됨' : '미지급'}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">수수료</p>
                            <p className="font-medium">{formatCurrency(order.commission_amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">최근 주문이 없습니다.</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-3">최근 임상</h4>
                  {detailData.recent_activity?.clinical_cases && detailData.recent_activity.clinical_cases.length > 0 ? (
                    <div className="space-y-2">
                      {detailData.recent_activity.clinical_cases.map((clinical) => (
                        <div key={clinical.id} className="p-3 bg-gray-50 rounded">
                          <p className="font-medium">{clinical.name}</p>
                          <p className="text-sm text-gray-500">
                            {clinical.subject_type === 'self' ? '자가' : '고객'} - {clinical.treatment_item}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {clinical.status === 'in_progress' ? '진행중' : '완료'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {clinical.consent_status === 'consented' ? '동의함' : '미동의'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {clinical.total_sessions}회차
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {format(new Date(clinical.created_at), 'PPP', { locale: ko })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">최근 임상 케이스가 없습니다.</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-3">최근 기기 판매</h4>
                  {detailData.recent_activity?.device_sales && detailData.recent_activity.device_sales.length > 0 ? (
                    <div className="space-y-2">
                      {detailData.recent_activity.device_sales.map((device) => (
                        <div key={device.id} className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{device.device_name}</p>
                              <p className="text-sm text-gray-500">
                                {device.quantity}개 - {format(new Date(device.sale_date), 'PPP', { locale: ko })}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {device.tier_at_sale === 'tier_1_4' ? '1-4개 티어' : '5개이상 티어'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">실제 수수료</p>
                              <p className="font-medium">{formatCurrency(device.actual_commission)}</p>
                              <p className="text-xs text-gray-500">
                                (기준: {formatCurrency(device.standard_commission)})
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">최근 기기 판매가 없습니다.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>총 매출 (12개월)</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(detailData.sales_stats?.total_sales || 0)}
                    </p>
                    <p className="text-sm text-blue-500 mt-1">
                      평균 주문액: {formatCurrency(detailData.sales_stats?.average_order_value || 0)}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span>총 수수료</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(detailData.sales_stats?.total_commission || 0)}
                    </p>
                    <p className="text-sm text-green-500 mt-1">
                      총 주문: {detailData.sales_stats?.total_orders || 0}건
                    </p>
                  </div>
                </div>

                {detailData.crm_stats && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      CRM 진행 현황
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{detailData.crm_stats.total_cards}</p>
                        <p className="text-sm text-gray-500">총 CRM 카드</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{detailData.crm_stats.completed_stages}</p>
                        <p className="text-sm text-gray-500">완료된 단계</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{detailData.crm_stats.average_completion}%</p>
                        <p className="text-sm text-gray-500">평균 완료율</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Users className="h-4 w-4" />
                      <span>전체 소속 전문점</span>
                    </div>
                    <p className="text-xl font-bold">{detailData.user.total_subordinates}개</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                      <Activity className="h-4 w-4" />
                      <span>활성 전문점</span>
                    </div>
                    <p className="text-xl font-bold">{detailData.user.active_subordinates}개</p>
                  </div>
                </div>

                {(detailData.user.role === 'kol' || detailData.user.role === 'ol') && detailData.device_stats && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      기기 판매 현황
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold">{detailData.device_stats.total_devices_sold}</p>
                        <p className="text-sm text-gray-500">총 판매</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-red-600">{detailData.device_stats.total_devices_returned}</p>
                        <p className="text-sm text-gray-500">반품</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">{detailData.device_stats.net_devices_sold}</p>
                        <p className="text-sm text-gray-500">순 판매</p>
                      </div>
                      <div className="text-center">
                        <Badge variant={detailData.device_stats.current_tier === 'tier_5_plus' ? 'default' : 'secondary'}>
                          {detailData.device_stats.current_tier === 'tier_5_plus' ? '5개 이상 티어' : '1-4개 티어'}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">현재 티어</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="commission" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span>미지급 수수료</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">
                      {formatCurrency(detailData.commission_stats?.pending_amount || 0)}
                    </p>
                    <p className="text-sm text-orange-500 mt-1">
                      {detailData.commission_stats?.total_calculations - detailData.commission_stats?.paid_calculations || 0}건 대기중
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span>지급된 수수료</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(detailData.commission_stats?.paid_amount || 0)}
                    </p>
                    <p className="text-sm text-green-500 mt-1">
                      {detailData.commission_stats?.paid_calculations || 0}건 완료
                    </p>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">수수료 정산 현황</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">총 정산 건수</span>
                      <span className="font-medium">{detailData.commission_stats?.total_calculations || 0}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">지급 완료</span>
                      <span className="font-medium text-green-600">{detailData.commission_stats?.paid_calculations || 0}건</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">지급 대기</span>
                      <span className="font-medium text-orange-600">
                        {(detailData.commission_stats?.total_calculations || 0) - (detailData.commission_stats?.paid_calculations || 0)}건
                      </span>
                    </div>
                    {detailData.commission_stats?.last_calculation_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">최근 정산일</span>
                        <span className="font-medium">
                          {format(new Date(detailData.commission_stats.last_calculation_date), 'PPP', { locale: ko })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 수수료 정산은 매월 말일에 자동으로 계산되며, 익월 10일에 지급됩니다.
                  </p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
