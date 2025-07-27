'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  RelationshipTreeView,
  TreeNode,
} from '@/components/biofox-admin/relationships/RelationshipTreeView';
import { RelationshipFormModal } from '@/components/biofox-admin/relationships/RelationshipFormModal';
import { DeleteConfirmDialog } from '@/components/biofox-admin/relationships/DeleteConfirmDialog';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

interface RelationshipData {
  id: string;
  shop_owner_id: string;
  parent_id: string | null;
  notes: string | null;
  shop_owner: {
    id: string;
    name: string;
    role: 'kol' | 'ol' | 'shop_owner';
    shop_name: string;
    status: string;
  };
  parent: {
    id: string;
    name: string;
    role: 'kol' | 'ol' | 'shop_owner';
    shop_name: string;
    status?: string; // optional로 변경
  } | null;
}

export default function RelationshipsPage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const profile = useQuery(
    api.profiles.getProfileByEmail,
    authUser?.email ? { email: authUser.email } : 'skip'
  );
  const { toast } = useToast();

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/signin');
    } else if (profile && profile.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [authUser, authLoading, profile, router]);

  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<RelationshipData | null>(null);

  // 선택된 노드의 관계 데이터 가져오기
  const [selectedNodeRelationship, setSelectedNodeRelationship] = useState<RelationshipData | null>(
    null
  );

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback(async (node: TreeNode) => {
    setSelectedNode(node);

    // 선택된 노드의 관계 데이터 조회
    try {
      const response = await fetch(`/api/relationships?shop_id=${node.id}&active_only=true`);
      if (response.ok) {
        const { data } = await response.json();
        if (data && data.length > 0) {
          setSelectedNodeRelationship(data[0]);
        } else {
          setSelectedNodeRelationship(null);
        }
      }
    } catch (error) {
      console.error('관계 데이터 조회 오류:', error);
      setSelectedNodeRelationship(null);
    }
  }, []);

  // 새로운 관계 생성
  const handleCreateRelationship = () => {
    setEditingRelationship(null);
    setShowFormModal(true);
  };

  // 전문점 추가 (KOL/OL 하위에)
  const handleAddShop = () => {
    if (!selectedNode) return;

    // 부모를 미리 설정한 상태로 모달 열기
    setEditingRelationship({
      id: '',
      shop_owner_id: '',
      parent_id: selectedNode.id,
      notes: null,
      shop_owner: null as any,
      parent: {
        id: selectedNode.id,
        name: selectedNode.name,
        role: selectedNode.role,
        shop_name: selectedNode.shop_name,
      },
    } as any);
    setShowFormModal(true);
  };

  // 관계 수정
  const handleEditRelationship = () => {
    if (!selectedNodeRelationship) {
      toast({
        title: '오류',
        description: '수정할 관계 데이터가 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    setEditingRelationship(selectedNodeRelationship);
    setShowFormModal(true);
  };

  // 관계 삭제
  const handleDeleteRelationship = () => {
    if (!selectedNode) return;
    setShowDeleteDialog(true);
  };

  // 조직도 새로고침
  const refreshTree = () => {
    setRefreshKey(prev => prev + 1);
    setSelectedNode(null);
    setSelectedNodeRelationship(null);
  };

  // CRUD 성공 시 실행
  const handleCrudSuccess = () => {
    refreshTree();
    toast({
      title: '성공',
      description: '작업이 완료되었습니다.',
    });
  };

  // 선택된 노드가 KOL 또는 OL인지 확인
  const isParentRole = selectedNode && (selectedNode.role === 'kol' || selectedNode.role === 'ol');
  // 선택된 노드가 SHOP인지 확인
  const isShopRole = selectedNode && selectedNode.role === 'shop_owner';

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
              에스테틱 소속 관리 페이지를 준비하고 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">에스테틱 소속 관리</h1>
          <p className="text-muted-foreground">
            에스테틱 조직도를 관리하고 소속 관계를 편집할 수 있습니다.
          </p>
        </div>

        {/* CRUD 액션 버튼들 */}
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateRelationship} className="gap-2">
            <Plus className="h-4 w-4" />새 관계 추가
          </Button>

          {/* KOL/OL 선택 시 전문점 추가 버튼 */}
          {isParentRole && (
            <Button
              variant="outline"
              onClick={handleAddShop}
              className="gap-2 border-blue-200 text-blue-600 hover:border-blue-300 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              전문점 추가
            </Button>
          )}

          {/* SHOP 선택 시 수정 버튼 */}
          {isShopRole && (
            <Button
              variant="outline"
              onClick={handleEditRelationship}
              disabled={!selectedNodeRelationship}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              관계 수정
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleDeleteRelationship}
            disabled={!selectedNode}
            className="gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 조직도 */}
        <div className="lg:col-span-2">
          <RelationshipTreeView key={refreshKey} onNodeClick={handleNodeClick} />
        </div>

        {/* 선택된 노드 정보 & CRUD 패널 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                선택된 에스테틱
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
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
                    {selectedNodeRelationship && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">상위 에스테틱</div>
                        <div>
                          {selectedNodeRelationship.parent
                            ? `${selectedNodeRelationship.parent.name} (${selectedNodeRelationship.parent.shop_name})`
                            : '최상위'}
                        </div>
                      </div>
                    )}
                    {selectedNodeRelationship?.notes && (
                      <div>
                        <div className="text-sm font-medium text-gray-500">메모</div>
                        <div className="text-sm text-gray-600">
                          {selectedNodeRelationship.notes}
                        </div>
                      </div>
                    )}
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

                  {/* 선택된 노드 액션 버튼들 */}
                  <div className="space-y-2 border-t pt-4">
                    {/* KOL/OL인 경우 전문점 추가 버튼 */}
                    {isParentRole && (
                      <Button
                        onClick={handleAddShop}
                        className="w-full gap-2 border-blue-200 text-blue-600 hover:border-blue-300 hover:text-blue-700"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                        하위 전문점 추가
                      </Button>
                    )}

                    {/* SHOP인 경우 관계 수정 버튼 */}
                    {isShopRole && (
                      <Button
                        onClick={handleEditRelationship}
                        className="w-full gap-2"
                        variant="outline"
                        disabled={!selectedNodeRelationship}
                      >
                        <Edit className="h-4 w-4" />
                        관계 수정
                      </Button>
                    )}

                    <Button
                      onClick={handleDeleteRelationship}
                      className="w-full gap-2 text-red-600 hover:text-red-700"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                      관계 삭제
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Users className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <div className="text-sm">조직도에서 에스테틱을 선택하세요</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 빠른 액션 카드 */}
          <Card>
            <CardHeader>
              <CardTitle>빠른 액션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleCreateRelationship} className="w-full gap-2">
                <Plus className="h-4 w-4" />새 에스테틱 관계 추가
              </Button>

              {/* KOL/OL 선택 시 전문점 추가 버튼 */}
              {isParentRole && (
                <Button
                  onClick={handleAddShop}
                  className="w-full gap-2 border-blue-200 text-blue-600 hover:border-blue-300 hover:text-blue-700"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  {selectedNode?.name}에 전문점 추가
                </Button>
              )}

              {/* SHOP 선택 시 관계 수정 버튼 */}
              {isShopRole && selectedNodeRelationship && (
                <Button onClick={handleEditRelationship} className="w-full gap-2" variant="outline">
                  <Edit className="h-4 w-4" />
                  {selectedNode?.name} 관계 수정
                </Button>
              )}

              <Button onClick={refreshTree} variant="outline" className="w-full">
                조직도 새로고침
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 모달들 */}
      <RelationshipFormModal
        open={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingRelationship(null);
        }}
        onSuccess={handleCrudSuccess}
        editingRelationship={editingRelationship as any}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={handleCrudSuccess}
        nodeToDelete={selectedNode}
      />
    </div>
  );
}
