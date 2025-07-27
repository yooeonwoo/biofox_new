'use client';

import { useState } from 'react';
import {
  Users,
  Store,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  Search,
  Edit,
  Trash,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  kol_id?: number | null;
  region: string;
  status: string;
};

interface EntitySidebarProps {
  kols: KOL[];
  shopsByKol: { [key: number]: Shop[] };
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
  selectedEntityType,
}: EntitySidebarProps) {
  // 검색 필터링
  const filteredKols = kols.filter(
    kol =>
      kol.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kol.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kol.region && kol.region.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Card className="flex h-full w-full flex-col lg:w-80">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">엔티티 관리</CardTitle>
          <Button variant="ghost" size="sm" onClick={openAddKolModal} className="h-8 w-8 p-2">
            <PlusCircle size={16} />
          </Button>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 transform text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="검색..."
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {filteredKols.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">검색 결과가 없습니다</div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredKols.map(kol => (
              <Collapsible
                key={kol.id}
                open={expandedKolId === kol.id}
                onOpenChange={() => toggleKol(kol.id)}
              >
                <div
                  className={`rounded-lg border transition-colors ${
                    selectedEntityType === 'kol' && selectedEntityId === kol.id
                      ? 'border-accent-foreground/20 bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  {/* KOL 행 */}
                  <CollapsibleTrigger asChild>
                    <div
                      className="flex w-full cursor-pointer items-center justify-between p-3"
                      onClick={() => onSelectKol(kol)}
                    >
                      <div className="flex flex-1 items-center space-x-3">
                        {expandedKolId === kol.id ? (
                          <ChevronDown size={16} className="flex-shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight size={16} className="flex-shrink-0 text-muted-foreground" />
                        )}

                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                            <Users size={14} className="text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{kol.shop_name}</p>
                            <p className="truncate text-xs text-muted-foreground">{kol.name}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {shopsByKol[kol.id]?.length || 0}
                        </Badge>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            openEditKolModal(kol);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Edit size={12} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            openDeleteModal('kol', kol.id);
                          }}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  {/* 확장된 전문점 목록 */}
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 px-3 pb-3">
                      {shopsByKol[kol.id]?.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {shopsByKol[kol.id]?.map(shop => (
                            <div
                              key={shop.id}
                              className={`flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors ${
                                selectedEntityType === 'shop' && selectedEntityId === shop.id
                                  ? 'border border-accent-foreground/20 bg-accent'
                                  : 'hover:bg-accent/50'
                              }`}
                              onClick={() => onSelectShop(shop)}
                            >
                              <div className="flex min-w-0 flex-1 items-center space-x-2">
                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/10">
                                  <Store size={12} className="text-green-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium">{shop.shop_name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {shop.owner_name}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    openEditShopModal(shop);
                                  }}
                                  className="h-5 w-5 p-0"
                                >
                                  <Edit size={10} />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    openDeleteModal('shop', shop.id);
                                  }}
                                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash size={10} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-muted-foreground">
                          전문점 없음
                        </div>
                      )}

                      <Separator className="my-2" />

                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddShopModal(kol.id)}
                          className="h-6 text-xs"
                        >
                          <PlusCircle size={12} className="mr-1" />
                          전문점 추가
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
