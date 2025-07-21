'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  User, 
  Users, 
  AlertCircle,
  ArrowRight,
  Building
} from 'lucide-react';
import type { User } from '@/types/biofox-admin';

interface RelationshipChangeModalProps {
  shopId: string;
  shopName?: string;
  currentParentId?: string;
  currentParentName?: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (newParentId: string, reason: string) => void;
}

export function RelationshipChangeModal({
  shopId,
  shopName,
  currentParentId,
  currentParentName,
  open,
  onClose,
  onConfirm,
}: RelationshipChangeModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const [availableParents, setAvailableParents] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAvailableParents();
    } else {
      // 모달이 닫힐 때 초기화
      setSearchTerm('');
      setSelectedParent(null);
      setReason('');
    }
  }, [open]);

  const fetchAvailableParents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?role=kol,ol&status=approved&limit=100');
      if (!response.ok) throw new Error('사용자 조회 실패');

      const { data } = await response.json();
      // 현재 샵과 현재 부모를 제외
      const filtered = data.filter((user: User) => 
        user.id !== shopId && user.id !== currentParentId
      );
      setAvailableParents(filtered);
    } catch (error) {
      console.error('사용자 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedParent) return;

    setSubmitting(true);
    try {
      await onConfirm(selectedParent.id, reason);
      onClose();
    } catch (error) {
      console.error('관계 변경 오류:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredParents = availableParents.filter(parent =>
    parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleConfig = {
    kol: { label: 'KOL', color: 'bg-purple-100 text-purple-800' },
    ol: { label: 'OL', color: 'bg-blue-100 text-blue-800' },
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>소속 관계 변경</DialogTitle>
          <DialogDescription>
            {shopName}의 소속을 변경합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 현재 소속 정보 */}
          {currentParentName && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                현재 소속: <strong>{currentParentName}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* 검색 */}
          <div className="space-y-2">
            <Label>새로운 소속 선택</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="이름, 샵명, 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 선택 가능한 부모 목록 */}
          <ScrollArea className="h-64 border rounded-lg p-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                선택 가능한 KOL/OL이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredParents.map((parent) => (
                  <button
                    key={parent.id}
                    onClick={() => setSelectedParent(parent)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedParent?.id === parent.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{parent.name}</span>
                            <Badge className={roleConfig[parent.role as 'kol' | 'ol'].color}>
                              {roleConfig[parent.role as 'kol' | 'ol'].label}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">{parent.shop_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>{parent.total_subordinates}개 소속</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Building className="h-4 w-4" />
                          <span>{parent.active_subordinates}개 활성</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* 선택된 변경 사항 표시 */}
          {selectedParent && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span>{currentParentName || '소속 없음'}</span>
                <ArrowRight className="h-4 w-4" />
                <span className="font-medium">{selectedParent.name}</span>
              </div>
            </div>
          )}

          {/* 변경 사유 */}
          <div className="space-y-2">
            <Label htmlFor="reason">변경 사유 (선택)</Label>
            <Textarea
              id="reason"
              placeholder="소속 변경 사유를 입력하세요..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            취소
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedParent || submitting}
          >
            {submitting ? '처리 중...' : '변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
