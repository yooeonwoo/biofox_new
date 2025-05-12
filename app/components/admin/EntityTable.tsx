"use client";

import { useState, useEffect } from 'react';
import { 
  Users, Store, MapPin, Activity, Mail,
  Calendar, Clock, Edit, Trash, Check, X 
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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
  kol_id?: number;
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
      <div className="flex items-center justify-center h-full bg-white rounded-lg p-8">
        <div className="text-center text-gray-500">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Users size={48} strokeWidth={1.5} />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">데이터 없음</h3>
          <p className="mt-1 text-sm text-gray-500">
            왼쪽 사이드바에서 KOL 또는 전문점을 선택하세요
          </p>
        </div>
      </div>
    );
  }

  // 필드 편집 시작 함수
  const startEdit = (field: string, value: string) => {
    setEditMode(true);
    setEditField(field);
    setEditValue(value);
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
    
    const entityType = selectedEntityType === 'kol' ? 'kols' : 'shops';
    const updatedData = { [editField]: editValue };
    
    try {
      const { error } = await supabase
        .from(entityType)
        .update(updatedData)
        .eq('id', selectedEntity.id);
      
      if (error) {
        alert(`수정 중 오류가 발생했습니다: ${error.message}`);
        return;
      }
      
      // 로컬 상태 업데이트
      if (updatedEntity) {
        setUpdatedEntity({
          ...updatedEntity,
          [editField]: editValue
        });
      }
      
      // 편집 모드 종료
      setEditMode(false);
      setEditField(null);
    } catch (error) {
      console.error('업데이트 오류:', error);
      alert('업데이트 중 오류가 발생했습니다.');
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
      <div className="sm:col-span-1">
        <dt className="text-sm font-medium text-gray-500 flex items-center">
          {icon} {label}
        </dt>
        <dd 
          className={`mt-1 text-sm ${isEditing ? '' : 'text-gray-900 cursor-pointer hover:bg-gray-100 p-1 rounded'}`}
          onClick={() => !isEditing && !readOnly && startEdit(field, value)}
        >
          {isEditing ? (
            <div className="flex items-center">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <button 
                onClick={saveEdit}
                className="ml-2 p-1 text-green-600 hover:text-green-800 rounded-full hover:bg-green-100"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={cancelEdit}
                className="ml-1 p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-100"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <span className="inline-block w-full">
              {value || '없음'}
            </span>
          )}
        </dd>
      </div>
    );
  };

  if (selectedEntityType === 'kol') {
    const kol = updatedEntity as KOL || selectedEntity as KOL;
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {kol.shop_name} - {kol.name}
              </h2>
              <p className="text-sm text-gray-500">KOL ID: {kol.id}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => openEditKolModal(kol)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit size={16} className="mr-1.5" />
              수정
            </button>
            <button
              onClick={() => openDeleteModal('kol', kol.id)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Trash size={16} className="mr-1.5" />
              삭제
            </button>
          </div>
        </div>
        
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">KOL 정보</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableField
                label="샵명"
                icon={<Store size={16} className="mr-1" />}
                field="shop_name"
                value={kol.shop_name}
              />
              
              <EditableField
                label="이름"
                icon={<Users size={16} className="mr-1" />}
                field="name"
                value={kol.name}
              />
              
              <EditableField
                label="지역"
                icon={<MapPin size={16} className="mr-1" />}
                field="region"
                value={kol.region || ''}
              />
              
              <EditableField
                label="이메일"
                icon={<Mail size={16} className="mr-1" />}
                field="email"
                value={kol.email || ''}
                readOnly={true}
              />
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Activity size={16} className="mr-1" /> 상태
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    kol.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {kol.status === 'active' ? '활성' : '비활성'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  } else if (selectedEntityType === 'shop') {
    const shop = updatedEntity as Shop || selectedEntity as Shop;
    const kolName = kols.find(k => k.id === shop.kol_id)?.name || '알 수 없음';
    
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full flex items-center justify-center bg-green-100 text-green-600">
              <Store size={24} />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {shop.shop_name} - {shop.owner_name}
              </h2>
              <p className="text-sm text-gray-500">전문점 ID: {shop.id}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => openEditShopModal(shop)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit size={16} className="mr-1.5" />
              수정
            </button>
            <button
              onClick={() => openDeleteModal('shop', shop.id)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Trash size={16} className="mr-1.5" />
              삭제
            </button>
          </div>
        </div>
        
        <div className="px-6 py-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">전문점 정보</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableField
                label="전문점명"
                icon={<Store size={16} className="mr-1" />}
                field="shop_name"
                value={shop.shop_name}
              />
              
              <EditableField
                label="담당자"
                icon={<Users size={16} className="mr-1" />}
                field="owner_name"
                value={shop.owner_name}
              />
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Users size={16} className="mr-1" /> KOL
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shop.kol_id ? `${kolName} (ID: ${shop.kol_id})` : '지정되지 않음'}
                </dd>
              </div>
              
              <EditableField
                label="지역"
                icon={<MapPin size={16} className="mr-1" />}
                field="region"
                value={shop.region || ''}
              />
              
              <EditableField
                label="이메일"
                icon={<Mail size={16} className="mr-1" />}
                field="email"
                value={shop.email || ''}
                readOnly={false}
              />
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Activity size={16} className="mr-1" /> 상태
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    shop.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {shop.status === 'active' ? '활성' : '비활성'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
} 