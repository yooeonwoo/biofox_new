'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertTriangle, Calendar, TrendingUp, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type KolMetric = {
  kol_id: number;
  year_month: string;
  total_shops_count: number;
  active_shops_count: number;
  monthly_sales: number;
  monthly_commission: number;
  updated_at: string;
  kols: {
    name: string;
    shop_name: string;
  };
};

type VerificationResult = {
  kol_id: number;
  kol_name: string;
  current_total_shops: number;
  correct_total_shops: number;
  current_active_shops: number;
  correct_active_shops: number;
  total_diff: number;
  active_diff: number;
  is_accurate: boolean;
};

export default function KolMetricsManagementPage() {
  const { toast } = useToast();
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7).replace('-', '') + new Date().toISOString().slice(5, 7));
  const [metrics, setMetrics] = useState<KolMetric[]>([]);
  const [verification, setVerification] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  // 현재 년월로 초기화
  useEffect(() => {
    const now = new Date();
    const currentYearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
    setYearMonth(currentYearMonth);
  }, []);

  // 메트릭스 데이터 로드
  const loadMetrics = async () => {
    if (!yearMonth) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/kol-metrics?yearMonth=${yearMonth}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '메트릭스 조회에 실패했습니다.');
      }

      setMetrics(data.metrics || []);
    } catch (error) {
      console.error('메트릭스 로드 오류:', error);
      toast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '메트릭스 조회 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 메트릭스 업데이트
  const updateMetrics = async () => {
    if (!yearMonth) {
      toast({
        title: '입력 오류',
        description: '년월을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await fetch('/api/admin/kol-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_metrics',
          yearMonth: yearMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '메트릭스 업데이트에 실패했습니다.');
      }

      toast({
        title: '업데이트 성공',
        description: data.message,
      });

      // 업데이트 후 데이터 다시 로드
      await loadMetrics();
    } catch (error) {
      console.error('메트릭스 업데이트 오류:', error);
      toast({
        title: '업데이트 실패',
        description: error instanceof Error ? error.message : '메트릭스 업데이트 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // 데이터 검증
  const verifyMetrics = async () => {
    if (!yearMonth) {
      toast({
        title: '입력 오류',
        description: '년월을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setVerifyLoading(true);
    try {
      const response = await fetch('/api/admin/kol-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_metrics',
          yearMonth: yearMonth,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '메트릭스 검증에 실패했습니다.');
      }

      setVerification(data.verification || []);
      
      const inaccurateCount = data.verification?.filter((v: VerificationResult) => !v.is_accurate).length || 0;
      
      toast({
        title: '검증 완료',
        description: `검증이 완료되었습니다. ${inaccurateCount > 0 ? `${inaccurateCount}개의 불일치 발견` : '모든 데이터가 정확합니다.'}`,
        variant: inaccurateCount > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('메트릭스 검증 오류:', error);
      toast({
        title: '검증 실패',
        description: error instanceof Error ? error.message : '메트릭스 검증 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (yearMonth) {
      loadMetrics();
    }
  }, [yearMonth]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">KOL 메트릭스 관리</h1>
        <p className="text-muted-foreground">
          KOL별 전체 전문점수와 활성 전문점수를 관리하고 검증합니다.
        </p>
      </div>

      {/* 컨트롤 패널 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            메트릭스 관리
          </CardTitle>
          <CardDescription>
            특정 월의 KOL 메트릭스를 업데이트하고 검증할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearMonth">년월 (YYYYMM)</Label>
              <Input
                id="yearMonth"
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
                placeholder="202505"
                className="w-32"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={updateMetrics} 
                disabled={updateLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${updateLoading ? 'animate-spin' : ''}`} />
                {updateLoading ? '업데이트 중...' : '메트릭스 업데이트'}
              </Button>
              <Button 
                variant="outline" 
                onClick={verifyMetrics} 
                disabled={verifyLoading}
                className="flex items-center gap-2"
              >
                <CheckCircle className={`h-4 w-4 ${verifyLoading ? 'animate-spin' : ''}`} />
                {verifyLoading ? '검증 중...' : '데이터 검증'}
              </Button>
              <Button 
                variant="outline" 
                onClick={loadMetrics} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 검증 결과 */}
      {verification.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              데이터 검증 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="default">
                  총 {verification.length}개 KOL 검증됨
                </Badge>
                <Badge variant={verification.filter(v => v.is_accurate).length === verification.length ? "default" : "destructive"}>
                  {verification.filter(v => v.is_accurate).length}개 정확
                </Badge>
                <Badge variant="destructive">
                  {verification.filter(v => !v.is_accurate).length}개 불일치
                </Badge>
              </div>
              
              {verification.filter(v => !v.is_accurate).length > 0 && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>KOL명</TableHead>
                        <TableHead>전체 전문점수</TableHead>
                        <TableHead>활성 전문점수</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verification.filter(v => !v.is_accurate).map((item) => (
                        <TableRow key={item.kol_id}>
                          <TableCell className="font-medium">{item.kol_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                현재: {item.current_total_shops} 
                                {item.total_diff !== 0 && (
                                  <span className="text-red-600 ml-2">
                                    (정확: {item.correct_total_shops})
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">
                                현재: {item.current_active_shops}
                                {item.active_diff !== 0 && (
                                  <span className="text-red-600 ml-2">
                                    (정확: {item.correct_active_shops})
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">불일치</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 현재 메트릭스 데이터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            현재 메트릭스 데이터
          </CardTitle>
          <CardDescription>
            {yearMonth}월 KOL 메트릭스 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3">데이터를 불러오는 중...</span>
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              해당 월의 데이터가 없습니다.
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KOL명</TableHead>
                    <TableHead>샵명</TableHead>
                    <TableHead className="text-center">전체 전문점수</TableHead>
                    <TableHead className="text-center">활성 전문점수</TableHead>
                    <TableHead className="text-right">월 매출</TableHead>
                    <TableHead className="text-right">월 수수료</TableHead>
                    <TableHead>최종 업데이트</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => (
                    <TableRow key={metric.kol_id}>
                      <TableCell className="font-medium">{metric.kols.name}</TableCell>
                      <TableCell>{metric.kols.shop_name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3" />
                          {metric.total_shops_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default" className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {metric.active_shops_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {metric.monthly_sales.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-right">
                        {metric.monthly_commission.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(metric.updated_at).toLocaleString('ko-KR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}