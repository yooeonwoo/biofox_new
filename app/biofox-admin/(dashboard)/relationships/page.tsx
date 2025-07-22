'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  RelationshipTreeView,
  TreeNode,
} from '@/components/biofox-admin/relationships/RelationshipTreeView';
import { RelationshipHistoryTable } from '@/components/biofox-admin/relationships/RelationshipHistoryTable';

interface RelationshipHistory {
  id: string;
  shop_owner: {
    id: string;
    name: string;
    shop_name: string;
  };
  old_parent: {
    id: string;
    name: string;
  } | null;
  parent: {
    id: string;
    name: string;
    role: string;
  } | null;
  started_at: string;
  ended_at?: string | null;
  is_active: boolean;
  reason?: string | null;
  changed_by: {
    id: string;
    name: string;
  } | null;
  changed_at: string;
}

export default function RelationshipsPage() {
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [history, setHistory] = useState<RelationshipHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // 변경 이력 불러오기
  const fetchHistory = useCallback(
    async (page: number = 1) => {
      setHistoryLoading(true);
      try {
        const response = await fetch(`/api/relationships/history?page=${page}&limit=20`);
        if (!response.ok) throw new Error('이력 조회 실패');

        const result = await response.json();
        setHistory(result.data);
        setHistoryPagination(result.pagination);
      } catch (error) {
        console.error('이력 조회 오류:', error);
        toast({
          title: '오류',
          description: '변경 이력을 불러오는데 실패했습니다.',
          variant: 'destructive',
        });
      } finally {
        setHistoryLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 노드 클릭 핸들러
  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode(node);
    // 선택된 노드 정보 표시용
    toast({
      title: '선택된 에스테틱',
      description: `${node.name} - ${node.shop_name}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">에스테틱 소속 관리</h1>
          <p className="text-muted-foreground">
            에스테틱 조직도와 소속 관계 이력을 확인할 수 있습니다.
          </p>
        </div>
      </div>

      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tree">조직도</TabsTrigger>
          <TabsTrigger value="history">변경 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* 조직도 */}
            <div className="lg:col-span-2">
              <RelationshipTreeView onNodeClick={handleNodeClick} />
            </div>

            {/* 선택된 노드 정보 */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>선택된 정보</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedNode ? (
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-500">이름</div>
                        <div className="text-lg font-semibold">{selectedNode.name}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">에스테틱명</div>
                        <div>{selectedNode.shop_name}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">역할</div>
                        <div className="capitalize">
                          {selectedNode.role === 'kol'
                            ? 'KOL'
                            : selectedNode.role === 'ol'
                              ? 'OL'
                              : '샵 운영자'}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-500">직속 에스테틱 수</div>
                        <div>{selectedNode.subordinates.length}개</div>
                      </div>
                      {selectedNode.stats && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">이번 달 매출</div>
                          <div className="text-lg font-semibold">
                            {selectedNode.stats.sales_this_month > 0
                              ? `${selectedNode.stats.sales_this_month.toLocaleString()}원`
                              : '매출 없음'}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-gray-500">
                      조직도에서 에스테틱을 선택하세요
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          {/* 변경 이력 */}
          <RelationshipHistoryTable
            history={history}
            loading={historyLoading}
            pagination={historyPagination}
            onPageChange={page => fetchHistory(page)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
