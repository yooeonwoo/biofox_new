'use client';

import { useAdminShops } from '@/lib/hooks/adminNewShops-convex';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';

interface Props {
  kolId: number | null;
  selectedShopId: number | null;
  onSelect: (id: number) => void;
}

export default function ShopSidebar({ kolId, selectedShopId, onSelect }: Props) {
  // 애니메이션을 위한 상태
  const [isVisible, setIsVisible] = useState(false);
  const [previousDataLength, setPreviousDataLength] = useState(0);

  // KOL ID 변환: number → string (Convex 호환)
  const kolIdString = useMemo(() => {
    if (!kolId) return undefined;
    // number를 Convex 호환 string ID로 변환
    return `k${Math.abs(kolId)}`;
  }, [kolId]);

  const {
    data = [],
    isLoading,
    isError,
  } = useAdminShops({
    kolId: kolIdString,
  });

  // 데이터 변경 시 애니메이션 트리거
  useEffect(() => {
    if (!isLoading && data.length > 0) {
      // 새로운 데이터가 로드되거나 변경되었을 때
      if (data.length !== previousDataLength) {
        setIsVisible(false);
        const timer = setTimeout(() => {
          setIsVisible(true);
          setPreviousDataLength(data.length);
        }, 50);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(true);
      }
    }
  }, [data, isLoading, previousDataLength]);

  // KOL 변경 시 애니메이션 리셋
  useEffect(() => {
    setIsVisible(false);
    setPreviousDataLength(0);
  }, [kolId]);

  if (!kolId) {
    return (
      <aside className="flex w-56 items-center justify-center border-r bg-gray-50 text-sm text-muted-foreground transition-all duration-300">
        KOL 선택
      </aside>
    );
  }

  return (
    <aside className="w-56 overflow-y-auto border-r bg-white transition-all duration-300">
      {isLoading ? (
        <div className="flex animate-pulse justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : isError ? (
        <div className="animate-fade-in p-2 text-sm text-destructive">로드 실패</div>
      ) : data.length === 0 ? (
        <div className="animate-fade-in p-2 text-sm text-muted-foreground">전문점 없음</div>
      ) : (
        <ul
          className={`space-y-1 p-2 transition-all duration-500 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          {data.map((shop, index) => (
            <li
              key={shop.id}
              className="animate-fade-in"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: 'both',
              }}
            >
              <Button
                variant={shop.id === selectedShopId ? 'default' : 'ghost'}
                size="sm"
                className={`w-full transform justify-start transition-all duration-200 hover:scale-[1.02] ${
                  shop.id === selectedShopId ? 'scale-[1.01] shadow-sm' : 'hover:shadow-sm'
                }`}
                onClick={() => onSelect(shop.id)}
              >
                <span className="truncate">{shop.shopName}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* 실시간 업데이트 인디케이터 (선택사항) */}
      {!isLoading && !isError && data.length > 0 && (
        <div className="animate-pulse px-2 py-1 text-xs text-muted-foreground opacity-0">
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 animate-ping rounded-full bg-green-500"></div>
            <span>실시간 동기화</span>
          </div>
        </div>
      )}
    </aside>
  );
}
