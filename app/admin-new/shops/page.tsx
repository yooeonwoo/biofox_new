'use client';

import { useState, useCallback, useMemo } from 'react';
import KolSidebar from '@/components/admin_new/kols/KolSidebar';
import ShopSidebar from '@/components/admin_new/shops/ShopSidebar';
import AdminNewShopTable from '@/components/admin_new/shops/ShopTable';
import NewShopDialog from '@/components/admin_new/shops/NewShopDialog';
import { useAdminShops } from '@/lib/hooks/adminNewShops-convex';
import { Loader2 } from 'lucide-react';
import ShopDetailDrawer from '@/components/admin_new/shops/ShopDetailDrawer';

/**
 * ID 변환 유틸리티
 */
const IdConverter = {
  /**
   * string ID를 number ID로 변환 (KOL → Shop 선택 시)
   */
  stringToNumber: (stringId: string): number => {
    // 'k' 접두사 제거 후 숫자 변환
    const numStr = stringId.replace(/^k/, '');
    return parseInt(numStr, 10) || 0;
  },

  /**
   * number ID를 string ID로 변환 (Shop → KOL 관련 로직)
   */
  numberToString: (numberId: number): string => {
    return `k${Math.abs(numberId)}`;
  },
};

export default function AdminNewShopListPage() {
  // KOL ID는 string으로 관리 (KolSidebar 호환)
  const [selectedKolIdString, setSelectedKolIdString] = useState<string | null>(null);
  // Shop ID는 number로 관리 (ShopSidebar 호환)
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // KOL ID를 number로 변환 (기존 로직 호환용)
  const selectedKolIdNumber = useMemo(() => {
    return selectedKolIdString ? IdConverter.stringToNumber(selectedKolIdString) : null;
  }, [selectedKolIdString]);

  // 새로운 Convex 훅 사용
  const {
    data = [],
    isLoading,
    isError,
  } = useAdminShops({
    kolId: selectedKolIdString || undefined,
  });

  // KOL 선택 핸들러 (string ID 받아서 처리)
  const handleKolSelect = useCallback((kolId: string) => {
    setSelectedKolIdString(kolId);
    setSelectedShopId(null); // Shop 선택 초기화
  }, []);

  // Shop 선택 핸들러 (number ID 그대로 처리)
  const handleShopSelect = useCallback((shopId: number) => {
    setSelectedShopId(shopId);
  }, []);

  return (
    <div className="flex h-full">
      <KolSidebar selectedId={selectedKolIdString} onSelect={handleKolSelect} />
      <ShopSidebar
        kolId={selectedKolIdNumber}
        selectedShopId={selectedShopId}
        onSelect={handleShopSelect}
      />

      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        {selectedShopId ? (
          isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>로딩 중...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-10 text-destructive">
              데이터 로드에 실패했습니다.
            </div>
          ) : (
            <AdminNewShopTable
              data={data.filter(shop => shop.id === selectedShopId)}
              onRowSelect={id => {
                setSelectedShopId(id);
                setDrawerOpen(true);
              }}
              selectedId={selectedShopId}
            />
          )
        ) : (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            {!selectedKolIdString ? (
              <span>KOL을 선택하세요.</span>
            ) : (
              <span>전문점을 선택하세요.</span>
            )}
          </div>
        )}

        <div>
          <NewShopDialog createdBy={1} />
        </div>
      </div>

      {/* Shop Detail Drawer */}
      <ShopDetailDrawer shopId={selectedShopId} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
