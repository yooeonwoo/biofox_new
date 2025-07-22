'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Search, Users, Store, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface TreeNode {
  id: string;
  name: string;
  role: 'kol' | 'ol' | 'shop_owner';
  shop_name: string;
  subordinates: TreeNode[];
  stats?: {
    sales_this_month: number;
    last_order_date: string | null;
  };
}

interface RelationshipTreeViewProps {
  rootId?: string;
  onNodeClick?: (node: TreeNode) => void;
  className?: string;
}

export function RelationshipTreeView({
  rootId,
  onNodeClick,
  className,
}: RelationshipTreeViewProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 트리 데이터 가져오기
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

      // 자동으로 루트 노드들 확장
      const rootIds = data.map((node: TreeNode) => node.id);
      setExpandedNodes(new Set(rootIds));
    } catch (error) {
      console.error('트리 데이터 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [rootId]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  // 노드 확장/축소
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // 검색 필터링
  const filterNodes = (nodes: TreeNode[], searchTerm: string): TreeNode[] => {
    if (!searchTerm) return nodes;

    return nodes.reduce((filtered: TreeNode[], node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.shop_name.toLowerCase().includes(searchTerm.toLowerCase());

      const filteredSubordinates = filterNodes(node.subordinates, searchTerm);

      if (matchesSearch || filteredSubordinates.length > 0) {
        filtered.push({
          ...node,
          subordinates: filteredSubordinates,
        });
      }

      return filtered;
    }, []);
  };

  // 역할별 아이콘
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'kol':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'ol':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'shop_owner':
        return <Store className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4 text-gray-600" />;
    }
  };

  // 역할별 배지 색상
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'kol':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ol':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shop_owner':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 트리 노드 렌더링
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasSubordinates = node.subordinates.length > 0;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex cursor-pointer items-center rounded-lg border p-3 transition-colors hover:bg-gray-50',
            level > 0 && 'ml-8'
          )}
          onClick={() => {
            if (hasSubordinates) toggleNode(node.id);
            onNodeClick?.(node);
          }}
        >
          <div className="flex flex-1 items-center gap-3">
            {hasSubordinates && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-1"
                onClick={e => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}

            {!hasSubordinates && <div className="w-6" />}

            {getRoleIcon(node.role)}

            <div className="flex-1">
              <div className="text-sm font-medium">{node.name}</div>
              <div className="text-xs text-gray-600">{node.shop_name}</div>
            </div>

            <Badge className={cn('text-xs', getRoleBadgeColor(node.role))}>
              {node.role === 'kol' ? 'KOL' : node.role === 'ol' ? 'OL' : 'SHOP'}
            </Badge>

            {node.stats && (
              <div className="min-w-20 text-right text-xs text-gray-500">
                {node.stats.sales_this_month > 0
                  ? `${node.stats.sales_this_month.toLocaleString()}원`
                  : '매출없음'}
              </div>
            )}
          </div>
        </div>

        {/* 하위 노드들 */}
        {hasSubordinates && isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200">
            {node.subordinates.map(subordinate => renderTreeNode(subordinate, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTreeData = filterNodes(treeData, searchTerm);

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">에스테틱 조직도</h3>
          <Button variant="outline" size="sm" onClick={fetchTreeData} disabled={loading}>
            새로고침
          </Button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="이름 또는 샵명으로 검색..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 트리 내용 */}
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-sm text-gray-500">로딩 중...</div>
            </div>
          ) : filteredTreeData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Store className="mb-2 h-12 w-12" />
              <div className="text-sm">등록된 관계가 없습니다.</div>
            </div>
          ) : (
            filteredTreeData.map(node => renderTreeNode(node))
          )}
        </div>
      </div>
    </Card>
  );
}
