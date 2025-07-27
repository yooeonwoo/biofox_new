'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, BarChart3 } from 'lucide-react';
import { ClinicalFilters } from '@/components/biofox-admin/clinical/ClinicalFilters';
import { ClinicalTable } from '@/components/biofox-admin/clinical/ClinicalTable';
import { ClinicalSummaryCards } from '@/components/biofox-admin/clinical/ClinicalSummaryCards';
import { ClinicalDashboard } from '@/components/biofox-admin/clinical/ClinicalDashboard';
import { ClinicalPhotoModal } from '@/components/biofox-admin/clinical/ClinicalPhotoModal';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ClinicalFiltersState {
  shop_id?: string;
  consent_status?: string;
  status?: string;
  subject_type?: string;
  search?: string;
  dateRange?: DateRange;
}

export default function ClinicalManagementPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/signin');
    } else if (profile && profile.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [authUser, authLoading, profile, router]);

  const [activeTab, setActiveTab] = useState('cases');
  const [filters, setFilters] = useState<ClinicalFiltersState>({
    consent_status: 'consented',
  });
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [summary, setSummary] = useState({
    total_cases: 0,
    active_cases: 0,
    completed_cases: 0,
    self_cases: 0,
    customer_cases: 0,
    consented_count: 0,
    non_consented_count: 0,
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (activeTab === 'cases') {
      fetchCases();
    } else if (activeTab === 'dashboard') {
      fetchDashboard();
    }
  }, [filters, pagination.page, activeTab]);

  const fetchCases = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    if (filters.shop_id) params.append('shop_id', filters.shop_id);
    if (filters.consent_status) params.append('consent_status', filters.consent_status);
    if (filters.status) params.append('status', filters.status);
    if (filters.subject_type) params.append('subject_type', filters.subject_type);
    if (filters.search) params.append('search', filters.search);
    if (filters.dateRange?.from) {
      params.append('date_from', format(filters.dateRange.from, 'yyyy-MM-dd'));
    }
    if (filters.dateRange?.to) {
      params.append('date_to', format(filters.dateRange.to, 'yyyy-MM-dd'));
    }

    const response = await fetch(`/api/admin/clinical?${params}`);

    if (response.ok) {
      const data = await response.json();
      setCases(data.data);
      setPagination(data.pagination);
      setSummary(data.summary);
    }

    setLoading(false);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    const response = await fetch('/api/admin/clinical/dashboard');

    if (response.ok) {
      const data = await response.json();
      setDashboardData(data);
    }

    setLoading(false);
  };

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: '선택된 임상이 없습니다',
        description: '다운로드할 임상을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 일괄 다운로드 API 호출
    const response = await fetch('/api/admin/clinical/photos/bulk-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_ids: selectedIds }),
    });

    if (response.ok) {
      const data = await response.json();
      window.open(data.download_url, '_blank');
      toast({
        title: '다운로드 준비 완료',
        description: `${data.included_cases}개 케이스의 사진이 준비되었습니다.`,
      });
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams({
      format: 'csv',
    });

    if (filters.consent_status) params.append('consent_status', filters.consent_status);
    if (filters.dateRange?.from) {
      params.append('date_from', format(filters.dateRange.from, 'yyyy-MM-dd'));
    }
    if (filters.dateRange?.to) {
      params.append('date_to', format(filters.dateRange.to, 'yyyy-MM-dd'));
    }

    window.open(`/api/admin/clinical/export?${params}`, '_blank');
  };

  // 로딩 상태
  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">로딩 중...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              임상 관리 페이지를 준비하고 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">임상 관리</h1>
        <div className="flex gap-2">
          {activeTab === 'cases' && (
            <>
              {selectedIds.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  사진 다운로드 ({selectedIds.length})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                내보내기
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cases">임상 케이스</TabsTrigger>
          <TabsTrigger value="dashboard">통계 대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="space-y-4">
          <ClinicalSummaryCards summary={summary} />

          <ClinicalFilters
            filters={filters}
            onFiltersChange={setFilters}
            showConsentFilter={true}
          />

          <ClinicalTable
            cases={cases}
            loading={loading}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onView={clinicalCase => {
              // 상세보기 구현
              console.log('View case:', clinicalCase);
            }}
            onManagePhotos={clinicalCase => {
              setSelectedCase(clinicalCase);
              setPhotoModalOpen(true);
            }}
            showShopInfo={true}
          />

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="dashboard">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : (
            <ClinicalDashboard data={dashboardData} />
          )}
        </TabsContent>
      </Tabs>

      <ClinicalPhotoModal
        caseId={selectedCase?.id}
        caseName={selectedCase?.name}
        consentStatus={selectedCase?.consent_status}
        open={photoModalOpen}
        onClose={() => {
          setPhotoModalOpen(false);
          setSelectedCase(null);
        }}
        onUpdate={fetchCases}
      />
    </div>
  );
}
