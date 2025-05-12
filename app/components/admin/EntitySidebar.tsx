"use client";

import { useState } from 'react';
import { 
  Users, Store, ChevronDown, ChevronRight, 
  PlusCircle, Search, Edit, Trash 
} from 'lucide-react';

// 타입 정의
type KOL = {
  id: number;
  name: string;
  shop_name: string;
  region: string;
  status: string;
};

type Shop = {
  id: number;
  shop_name: string;
  owner_name: string;
  kol_id?: number;
  region: string;
  status: string;
};

interface EntitySidebarProps {
  kols: KOL[];
  shopsByKol: {[key: number]: Shop[]};
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  expandedKolId: number | null;
  toggleKol: (kolId: number) => void;
  onSelectKol: (kol: KOL) => void;
  onSelectShop: (shop: Shop) => void;
  openAddKolModal: () => void;
  openAddShopModal: (kolId: number) => void;
  openEditKolModal: (kol: KOL) => void;
  openEditShopModal: (shop: Shop) => void;
  openDeleteModal: (type: 'kol' | 'shop', id: number) => void;
  selectedEntityId: number | null;
  selectedEntityType: 'kol' | 'shop' | null;
}

export default function EntitySidebar({
  kols,
  shopsByKol,
  searchQuery,
  setSearchQuery,
  expandedKolId,
  toggleKol,
  onSelectKol,
  onSelectShop,
  openAddKolModal,
  openAddShopModal,
  openEditKolModal,
  openEditShopModal,
  openDeleteModal,
  selectedEntityId,
  selectedEntityType
}: EntitySidebarProps) {
  
  // 검색 필터링
  const filteredKols = kols.filter(
    (kol) =>
      kol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kol.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kol.region && kol.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div className="w-full lg:w-80 bg-white shadow-sm border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">엔티티 관리</h2>
          <button
            onClick={openAddKolModal}
            className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
            title="KOL 추가">
            <PlusCircle size={18} />
          </button>
        </div>
        
        {/* 검색 필드 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색..."
            className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredKols.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredKols.map((kol) => (
              <div key={kol.id} className="overflow-hidden">
                {/* KOL 행 */}
                <div 
                  className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer ${
                    selectedEntityType === 'kol' && selectedEntityId === kol.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div 
                    className="flex items-center flex-1"
                    onClick={() => {
                      toggleKol(kol.id);
                      onSelectKol(kol);
                    }}
                  >
                    {expandedKolId === kol.id ? (
                      <ChevronDown size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                    )}
                    <div className="flex items-center">
                      <Users size={16} className="text-blue-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{kol.shop_name}</h3>
                        <p className="text-xs text-gray-500">{kol.name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {/* 전문점 개수 뱃지 */}
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full mr-2">
                      {shopsByKol[kol.id]?.length || 0}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditKolModal(kol);
                      }}
                      className="text-gray-500 hover:text-blue-600 p-1"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal('kol', kol.id);
                      }}
                      className="text-gray-500 hover:text-red-600 p-1"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
                
                {/* 확장된 전문점 목록 */}
                {expandedKolId === kol.id && (
                  <div className="bg-gray-50 pl-8 pr-3 pb-2">
                    {shopsByKol[kol.id] && shopsByKol[kol.id].length > 0 ? (
                      <ul className="space-y-1 py-1">
                        {shopsByKol[kol.id].map((shop) => (
                          <li 
                            key={shop.id}
                            className={`py-2 flex items-center justify-between hover:bg-gray-100 px-2 rounded-md text-sm ${
                              selectedEntityType === 'shop' && selectedEntityId === shop.id ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => onSelectShop(shop)}
                          >
                            <div className="flex items-center">
                              <Store size={14} className="text-green-600 mr-2" />
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{shop.shop_name}</h4>
                                <p className="text-xs text-gray-500">{shop.owner_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditShopModal(shop);
                                }}
                                className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                                title="수정"
                              >
                                <Edit size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteModal('shop', shop.id);
                                }}
                                className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                                title="삭제"
                              >
                                <Trash size={12} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-2 text-center text-xs text-gray-500">
                        전문점 없음
                      </div>
                    )}
                    <div className="mt-1 mb-1 text-center">
                      <button
                        onClick={() => openAddShopModal(kol.id)}
                        className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        <PlusCircle size={12} className="mr-1" />
                        전문점 추가
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 