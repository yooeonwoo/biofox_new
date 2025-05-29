"use client";

import { useState, useEffect } from 'react';
import { 
  Users, Store, MapPin, Activity, Mail, Edit, Trash
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
  region: string;
  status: string;
  email?: string;
};

type Shop = {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id?: number | null;
  region: string;
  status: string;
  email?: string;
};

interface EntityTableProps {
  selectedEntityType: 'kol' | 'shop' | null;
  selectedEntity: KOL | Shop | null;
  kols: KOL[];
  openEditKolModal: (kol: KOL) => void;
  openEditShopModal: (shop: Shop) => void;
  openDeleteModal: (type: 'kol' | 'shop', id: number) => void;
}

export default function EntityTable({
  selectedEntityType,
  selectedEntity,
  kols,
  openEditKolModal,
  openEditShopModal,
  openDeleteModal
}: EntityTableProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // 인라인 편집 상태
  const [editMode, setEditMode] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 수정된 엔티티 데이터
  const [updatedEntity, setUpdatedEntity] = useState<KOL | Shop | null>(null);
  
  // 선택된 엔티티가 변경되면 수정 모드 초기화
  useEffect(() => {
    setEditMode(false);
    setEditField(null);
    setEditValue('');
    setUpdatedEntity(selectedEntity);
  }, [selectedEntity]);

  if (!selectedEntity) {
    return (
      <EmptyState 
        icon={Users}
        title="데이터 없음"
        description="왼쪽 사이드바에서 KOL 또는 전문점을 선택하세요"
      />
    );
  }

  // 필드 편집 시작 함수
  const startEdit = (field: string, value: string) => {
    setEditMode(true);
    setEditField(field);
    setEditValue(value || '');
  };

  // 필드 편집 취소 함수
  const cancelEdit = () => {
    setEditMode(false);
    setEditField(null);
    setEditValue('');
  };

  // 필드 편집 저장 함수
  const saveEdit = async () => {
    if (!selectedEntity || !editField) return;
    
    setIsUpdating(true);
    const entityType = selectedEntityType === 'kol' ? 'kols' : 'shops';
    const updatedData = { [editField]: editValue };
    
    try {
      const { error } = await supabase
        .from(entityType)
        .update(updatedData)
        .eq('id', selectedEntity.id);
      
      if (error) {
        toast.error(`수정 중 오류가 발생했습니다: ${error.message}`);
        return;
      }
      
      // 로컬 상태 업데이트
      if (updatedEntity) {
        setUpdatedEntity({
          ...updatedEntity,
          [editField]: editValue
        });
      }
      
      toast.success('성공적으로 수정되었습니다.');
      
      // 편집 모드 종료
      setEditMode(false);
      setEditField(null);
    } catch (error) {
      console.error('업데이트 오류:', error);
      toast.error('업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // 편집 가능한 필드 컴포넌트
  const EditableField = ({ 
    label,
    icon,
    field, 
    value,
    readOnly = false
  }: { 
    label: string; 
    icon: React.ReactNode;
    field: string; 
    value: string;
    readOnly?: boolean;
  }) => {
    const isEditing = editMode && editField === field && !readOnly;
    
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
          {readOnly && <Badge variant="outline" className="text-xs">읽기 전용</Badge>}
        </Label>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              autoFocus
              disabled={isUpdating}
            />
            <Button 
              size="sm" 
              onClick={saveEdit}
              disabled={isUpdating}
            >
              저장
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={cancelEdit}
              disabled={isUpdating}
            >
              취소
            </Button>
          </div>
        ) : (
          <div 
            className={`p-2 rounded-md border text-sm ${
              !readOnly 
                ? 'cursor-pointer hover:bg-accent hover:border-accent-foreground/20 transition-colors' 
                : 'bg-muted/50 cursor-not-allowed'
            }`}
            onClick={() => !isEditing && !readOnly && startEdit(field, value)}
          >
            {value || <span className="text-muted-foreground">없음</span>}
          </div>
        )}
      </div>
    );
  };

  if (selectedEntityType === 'kol') {
    const kol = updatedEntity as KOL || selectedEntity as KOL;
    
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <CardTitle className="text-xl">
                {kol.shop_name} - {kol.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">KOL ID: {kol.id}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditKolModal(kol)}
            >
              <Edit size={16} className="mr-2" />
              수정
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDeleteModal('kol', kol.id)}
            >
              <Trash size={16} className="mr-2" />
              삭제
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">KOL 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditableField
                  label="샵명"
                  icon={<Store size={16} />}
                  field="shop_name"
                  value={kol.shop_name}
                />
                
                <EditableField
                  label="이름"
                  icon={<Users size={16} />}
                  field="name"
                  value={kol.name}
                />
                
                <EditableField
                  label="지역"
                  icon={<MapPin size={16} />}
                  field="region"
                  value={kol.region || ''}
                />
                
                <EditableField
                  label="이메일"
                  icon={<Mail size={16} />}
                  field="email"
                  value={kol.email || ''}
                  readOnly={true}
                />
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Activity size={16} />
                    상태
                  </Label>
                  <div className="p-2">
                    <Badge variant={kol.status === 'active' ? 'default' : 'destructive'}>
                      {kol.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  } else if (selectedEntityType === 'shop') {
    const shop = updatedEntity as Shop || selectedEntity as Shop;
    const kolName = kols.find(k => k.id === shop.kol_id)?.name || '알 수 없음';
    
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-green-500/10 text-green-600">
              <Store size={24} />
            </div>
            <div>
              <CardTitle className="text-xl">
                {shop.shop_name} - {shop.owner_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">전문점 ID: {shop.id}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditShopModal(shop)}
            >
              <Edit size={16} className="mr-2" />
              수정
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDeleteModal('shop', shop.id)}
            >
              <Trash size={16} className="mr-2" />
              삭제
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">전문점 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <EditableField
                  label="전문점명"
                  icon={<Store size={16} />}
                  field="shop_name"
                  value={shop.shop_name}
                />
                
                <EditableField
                  label="담당자"
                  icon={<Users size={16} />}
                  field="owner_name"
                  value={shop.owner_name}
                />
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users size={16} />
                    KOL
                  </Label>
                  <div className="p-2 rounded-md border bg-muted/50 text-sm">
                    {shop.kol_id ? `${kolName} (ID: ${shop.kol_id})` : '지정되지 않음'}
                  </div>
                </div>
                
                <EditableField
                  label="지역"
                  icon={<MapPin size={16} />}
                  field="region"
                  value={shop.region || ''}
                />
                
                <EditableField
                  label="이메일"
                  icon={<Mail size={16} />}
                  field="email"
                  value={shop.email || ''}
                  readOnly={false}
                />
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Activity size={16} />
                    상태
                  </Label>
                  <div className="p-2">
                    <Badge variant={shop.status === 'active' ? 'default' : 'destructive'}>
                      {shop.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
}