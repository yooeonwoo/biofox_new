'use client';

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelationshipTreeView } from '@/components/biofox-admin/relationships/RelationshipTreeView';
import { RelationshipChangeModal } from '@/components/biofox-admin/relationships/RelationshipChangeModal';
import { RelationshipHistoryTable } from '@/components/biofox-admin/relationships/RelationshipHistoryTable';

interface TreeNode {
  id: string;
  name: string;
  role: 'kol' | 'ol' | 'shop_owner';
  shop_name: string;
  subordinates: TreeNode[];
}

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
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [draggedShopId, setDraggedShopId] = useState<string | null>(null);
  const [history, setHistory] = useState<RelationshipHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // 변경 이력 불러오기
  const fetchHistory = useCallback(async (page: number = 1) => {
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
  }, [toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 노드 클릭 핸들러
  const handleNodeClick = (node: TreeNode) => {
    setSelectedNode(node);
    // 추가 액션 (예: 상세 정보 표시)
  };

  // 드래그 앤 드롭으로 관계 변경
  const handleRelationshipChange = async (shopId: string, newParentId: string) => {
    setDraggedShopId(shopId);
    setSelectedNode({ id: newParentId } as TreeNode);
    setShowChangeModal(true);
  };

  // 관계 변경 확인
  const confirmRelationshipChange = async (newParentId: string, reason: string) => {
    if (!draggedShopId) return;

    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_owner_id: draggedShopId,
          parent_id: newParentId,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '관계 변경 실패');
      }

      toast({
        title: '성공',
        description: '소속 관계가 변경되었습니다.',
      });

      // 트리 및 이력 새로고침
      setRefreshKey(prev => prev + 1);
      fetchHistory();
      setShowChangeModal(false);
      setDraggedShopId(null);
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  // 현재 부모 정보 가져오기 (드래그된 노드의)
  const getCurrentParentInfo = async () => {
    if (!draggedShopId) return { id: undefined, name: undefined };

    try {
      const response = await fetch(`/api/relationships?shop_id=${draggedShopId}&active_only=true`);
      if (!response.ok) return { id: undefined, name: undefined };

      const { data } = await response.json();
      if (data.length > 0 && data[0].parent) {
        return {
          id: data[0].parent.id,
          name: data[0].parent.name,
        };
      }
    } catch (error) {
      console.error('현재 부모 정보 조회 오류:', error);
    }

    return { id: undefined, name: undefined };
  };

  const [currentParentInfo, setCurrentParentInfo] = useState<{ id?: string; name?: string }>({});

  useEffect(() => {
    if (draggedShopId) {
      getCurrentParentInfo().then(setCurrentParentInfo);
    }
  }, [draggedShopId]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">소속 관계 관리</h1>
        <p className="text-muted-foreground">
          전문점의 소속 관계를 관리하고 조직 구조를 확인합니다.
        </p>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tree">조직도</TabsTrigger>
          <TabsTrigger value="history">변경 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-4">
          {/* 조직도 */}
          <RelationshipTreeView
            key={refreshKey}
            onNodeClick={handleNodeClick}
            onRelationshipChange={handleRelationshipChange}
          />

          {/* 선택된 노드 정보 */}
          {selectedNode && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">선택된 노드</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">이름:</span>{' '}
                  <span className="font-medium">{selectedNode.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">샵명:</span>{' '}
                  <span className="font-medium">{selectedNode.shop_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">역할:</span>{' '}
                  <span className="font-medium">{selectedNode.role}</span>
                </div>
                <div>
                  <span className="text-gray-500">하위 조직:</span>{' '}
                  <span className="font-medium">{selectedNode.subordinates?.length || 0}개</span>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {/* 변경 이력 */}
          <RelationshipHistoryTable
            history={history}
            loading={historyLoading}
            pagination={historyPagination}
            onPageChange={(page) => fetchHistory(page)}
          />
        </TabsContent>
      </Tabs>

      {/* 관계 변경 모달 */}
      <RelationshipChangeModal
        shopId={draggedShopId || ''}
        shopName={selectedNode?.shop_name}
        currentParentId={currentParentInfo.id}
        currentParentName={currentParentInfo.name}
        open={showChangeModal}
        onClose={() => {
          setShowChangeModal(false);
          setDraggedShopId(null);
        }}
        onConfirm={confirmRelationshipChange}
      />
    </div>
  );
}
