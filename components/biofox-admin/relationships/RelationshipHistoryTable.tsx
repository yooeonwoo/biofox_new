'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Calendar, 
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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

interface RelationshipHistoryTableProps {
  history: RelationshipHistory[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
}

export function RelationshipHistoryTable({
  history,
  loading = false,
  pagination,
  onPageChange
}: RelationshipHistoryTableProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), 'PPP p', { locale: ko });
  };

  const formatShortDate = (date: string) => {
    return format(new Date(date), 'yyyy.MM.dd', { locale: ko });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>소속 변경 이력</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>전문점</TableHead>
                <TableHead>변경 내용</TableHead>
                <TableHead>기간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>변경 사유</TableHead>
                <TableHead>변경자</TableHead>
                <TableHead>변경일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    변경 이력이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.shop_owner.name}</p>
                        <p className="text-sm text-gray-500">{item.shop_owner.shop_name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {item.old_parent?.name || '소속 없음'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {item.parent?.name || '소속 없음'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatShortDate(item.started_at)}</div>
                        {item.ended_at && (
                          <div className="text-gray-500">
                            ~ {formatShortDate(item.ended_at)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? 'default' : 'secondary'}>
                        {item.is_active ? '현재' : '종료'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {item.reason || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3" />
                        <span>{item.changed_by?.name || '시스템'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(item.changed_at)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
