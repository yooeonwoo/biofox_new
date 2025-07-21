'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Search, 
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  Move
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TreeNode {
  id: string;
  name: string;
  role: 'kol' | 'ol' | 'shop_owner';
  shop_name: string;
  subordinates: TreeNode[];
  stats?: {
    sales_this_month: number;
    last_order_date: string | null;
  };
  relationship_id?: string;
  started_at?: string;
}

interface RelationshipTreeViewProps {
  rootId?: string;
  onNodeClick?: (node: TreeNode) => void;
  onRelationshipChange?: (shopId: string, newParentId: string) => void;
  className?: string;
}

export function RelationshipTreeView({
  rootId,
  onNodeClick,
  onRelationshipChange,
  className
}: RelationshipTreeViewProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [draggedNode, setDraggedNode] = useState<TreeNode | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);

  // 트리 데이터 불러오기
  const fetchTreeData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (rootId) params.append('root_id', rootId);
      params.append('depth', '3');

      const response = await fetch(`/api/relationships/tree?${params}`);
      if (!response.ok) throw new Error('트리 데이터 조회 실패');

      const { data } = await response.json();
      setTreeData(data);
    } catch (error) {
      console.error('트리 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [rootId]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // 검색 기능
  useEffect(() => {
    if (!searchTerm) {
      setHighlightedNodes(new Set());
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const highlighted = new Set<string>();

    const searchTree = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (
          node.name.toLowerCase().includes(searchLower) ||
          node.shop_name.toLowerCase().includes(searchLower)
        ) {
          highlighted.add(node.id);
          // 부모 노드들도 확장
          expandParentNodes(node.id);
        }
        searchTree(node.subordinates);
      });
    };

    searchTree(treeData);
    setHighlightedNodes(highlighted);
  }, [searchTerm, treeData]);

  const expandParentNodes = (nodeId: string) => {
    // 트리에서 nodeId까지의 경로를 찾아 모든 부모 노드 확장
    const findPath = (nodes: TreeNode[], targetId: string, path: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return path;
        }
        const subPath = findPath(node.subordinates, targetId, [...path, node.id]);
        if (subPath) {
          return subPath;
        }
      }
      return null;
    };

    const path = findPath(treeData, nodeId);
    if (path) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev);
        path.forEach(id => newSet.add(id));
        return newSet;
      });
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      notation: 'compact'
    }).format(amount);
  };

  const roleConfig = {
    kol: { label: 'KOL', color: 'bg-purple-100 text-purple-800' },
    ol: { label: 'OL', color: 'bg-blue-100 text-blue-800' },
    shop_owner: { label: 'Shop', color: 'bg-gray-100 text-gray-800' }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    setDraggedNode(node);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverNode(nodeId);
  };

  const handleDragLeave = () => {
    setDragOverNode(null);
  };

  const handleDrop = (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    setDragOverNode(null);

    if (!draggedNode || !onRelationshipChange) return;

    // 자기 자신이나 하위 노드로는 이동 불가
    if (draggedNode.id === targetNode.id || isDescendant(draggedNode, targetNode.id)) {
      alert('자기 자신이나 하위 노드로는 이동할 수 없습니다.');
      return;
    }

    // KOL/OL만 부모가 될 수 있음
    if (targetNode.role === 'shop_owner') {
      alert('Shop Owner는 다른 노드의 부모가 될 수 없습니다.');
      return;
    }

    onRelationshipChange(draggedNode.id, targetNode.id);
    setDraggedNode(null);
  };

  const isDescendant = (node: TreeNode, targetId: string): boolean => {
    if (node.subordinates.some(sub => sub.id === targetId)) {
      return true;
    }
    return node.subordinates.some(sub => isDescendant(sub, targetId));
  };

  // 트리 노드 렌더링
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.subordinates.length > 0;
    const isHighlighted = highlightedNodes.has(node.id);
    const isDragOver = dragOverNode === node.id;

    return (
      <div key={node.id} className={cn('select-none', level > 0 && 'ml-6')}>
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg transition-all cursor-pointer',
            'hover:bg-gray-50 dark:hover:bg-gray-800',
            isHighlighted && 'bg-yellow-50 dark:bg-yellow-900/20',
            isDragOver && 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
          )}
          onClick={() => onNodeClick?.(node)}
          draggable={node.role !== 'shop_owner'}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
        >
          {/* 확장/축소 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
            }}
            className={cn(
              'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700',
              !hasChildren && 'invisible'
            )}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* 노드 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{node.name}</span>
              <Badge className={cn('text-xs', roleConfig[node.role].color)}>
                {roleConfig[node.role].label}
              </Badge>
            </div>
            <div className="text-sm text-gray-500 truncate">{node.shop_name}</div>
          </div>

          {/* 통계 정보 */}
          <div className="flex items-center gap-4 text-sm">
            {node.stats && (
              <>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium">
                    {formatCurrency(node.stats.sales_this_month)}
                  </span>
                </div>
                {node.stats.last_order_date && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(node.stats.last_order_date), 'MM/dd')}
                    </span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{node.subordinates.length}</span>
            </div>
          </div>
        </div>

        {/* 하위 노드 */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {node.subordinates.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">조직도</h3>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="이름 또는 샵명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchTreeData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-blue-600" />
            <span className="text-blue-700 dark:text-blue-300">
              드래그 앤 드롭으로 소속 관계를 변경할 수 있습니다.
            </span>
          </div>
        </div>

        {/* 트리 뷰 */}
        <div className="space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : treeData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 관계가 없습니다.
            </div>
          ) : (
            treeData.map(node => renderTreeNode(node))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
