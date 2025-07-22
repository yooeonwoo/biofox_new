'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  role: 'kol' | 'ol' | 'shop_owner';
  shop_name: string;
  status: string;
}

interface RelationshipFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingRelationship?: {
    id: string;
    shop_owner_id: string;
    parent_id: string | null;
    notes: string | null;
    shop_owner: Profile;
    parent: Profile | null;
  } | null;
}

export function RelationshipFormModal({
  open,
  onClose,
  onSuccess,
  editingRelationship,
}: RelationshipFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    shop_owner_id: '',
    parent_id: '',
    reason: '',
  });

  const isEditing = !!editingRelationship && editingRelationship.id !== '';
  const isAddingShop =
    !!editingRelationship && editingRelationship.id === '' && editingRelationship.parent_id;

  // 프로필 목록 가져오기
  useEffect(() => {
    if (open) {
      fetchProfiles();
      if (editingRelationship) {
        setFormData({
          shop_owner_id: editingRelationship.shop_owner_id,
          parent_id: editingRelationship.parent_id || '',
          reason: editingRelationship.notes || '',
        });
      } else {
        setFormData({
          shop_owner_id: '',
          parent_id: '',
          reason: '',
        });
      }
    }
  }, [open, editingRelationship]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      if (!response.ok) throw new Error('프로필 조회 실패');

      const { data } = await response.json();
      setProfiles(data?.filter((profile: Profile) => profile.status === 'approved') || []);
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      toast({
        title: '오류',
        description: '에스테틱 목록을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shop_owner_id) {
      toast({
        title: '오류',
        description: '에스테틱을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const url = '/api/relationships';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing
        ? {
            relationship_id: editingRelationship!.id,
            shop_owner_id: formData.shop_owner_id,
            parent_id: formData.parent_id || null,
            reason: formData.reason || null,
          }
        : {
            shop_owner_id: formData.shop_owner_id,
            parent_id: formData.parent_id || null,
            reason: formData.reason || null,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `관계 ${isEditing ? '수정' : '생성'} 실패`);
      }

      toast({
        title: '성공',
        description: `관계가 ${isEditing ? '수정' : '생성'}되었습니다.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 부모가 될 수 있는 프로필들 (KOL, OL)
  const availableParents = profiles.filter(
    profile => profile.role === 'kol' || profile.role === 'ol'
  );

  // 에스테틱이 될 수 있는 프로필들
  const availableShops = isAddingShop
    ? profiles.sort((a, b) => {
        // 전문점 추가 모드에서는 SHOP 역할을 우선 표시
        if (a.role === 'shop_owner' && b.role !== 'shop_owner') return -1;
        if (a.role !== 'shop_owner' && b.role === 'shop_owner') return 1;
        return a.name.localeCompare(b.name);
      })
    : profiles;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isAddingShop
              ? `${editingRelationship?.parent?.name}에 전문점 추가`
              : isEditing
                ? '관계 수정'
                : '새 관계 추가'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 에스테틱 선택 */}
          <div className="space-y-2">
            <Label htmlFor="shop_owner">{isAddingShop ? '추가할 전문점 *' : '에스테틱 *'}</Label>
            <Select
              value={formData.shop_owner_id}
              onValueChange={value => setFormData(prev => ({ ...prev, shop_owner_id: value }))}
              disabled={isEditing && !isAddingShop} // 수정 시에는 에스테틱 변경 불가 (전문점 추가는 제외)
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isAddingShop ? '추가할 전문점을 선택하세요' : '에스테틱을 선택하세요'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableShops.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      <span>{profile.name}</span>
                      <span className="text-xs text-gray-500">({profile.shop_name})</span>
                      <span
                        className={`rounded px-1 text-xs ${
                          profile.role === 'shop_owner'
                            ? 'bg-blue-100 text-blue-700'
                            : profile.role === 'kol'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {profile.role === 'kol' ? 'KOL' : profile.role === 'ol' ? 'OL' : 'SHOP'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 상위 에스테틱 선택 */}
          <div className="space-y-2">
            <Label htmlFor="parent">상위 에스테틱</Label>
            {isAddingShop && editingRelationship?.parent ? (
              // 전문점 추가 모드에서는 상위가 고정됨
              <div className="rounded-md border bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{editingRelationship.parent.name}</span>
                  <span className="text-xs text-gray-500">
                    ({editingRelationship.parent.shop_name})
                  </span>
                  <span
                    className={`rounded px-1 text-xs ${
                      editingRelationship.parent.role === 'kol'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {editingRelationship.parent.role === 'kol' ? 'KOL' : 'OL'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  이 {editingRelationship.parent.role === 'kol' ? 'KOL' : 'OL'} 하위에 전문점이
                  추가됩니다.
                </div>
              </div>
            ) : (
              <Select
                value={formData.parent_id}
                onValueChange={value => setFormData(prev => ({ ...prev, parent_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상위 에스테틱을 선택하세요 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">상위 없음 (최상위)</SelectItem>
                  {availableParents.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      <div className="flex items-center gap-2">
                        <span>{profile.name}</span>
                        <span className="text-xs text-gray-500">({profile.shop_name})</span>
                        <span
                          className={`rounded px-1 text-xs ${
                            profile.role === 'kol'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {profile.role === 'kol' ? 'KOL' : 'OL'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 사유/메모 */}
          <div className="space-y-2">
            <Label htmlFor="reason">사유 / 메모</Label>
            <Textarea
              id="reason"
              placeholder={
                isAddingShop
                  ? '전문점 추가 사유나 메모를 입력하세요'
                  : '관계 설정 사유나 메모를 입력하세요'
              }
              value={formData.reason}
              onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
            />
          </div>

          {/* 버튼들 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={isAddingShop ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAddingShop ? '추가 중...' : isEditing ? '수정 중...' : '생성 중...'}
                </>
              ) : isAddingShop ? (
                '전문점 추가'
              ) : isEditing ? (
                '수정'
              ) : (
                '생성'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
