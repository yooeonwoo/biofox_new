"use client";

import { useAdminNewShops } from "@/lib/hooks/adminNewShops";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  kolId: number | null;
  selectedShopId: number | null;
  onSelect: (id: number) => void;
}

export default function ShopSidebar({ kolId, selectedShopId, onSelect }: Props) {
  const { data = [], isLoading } = useAdminNewShops(kolId ? { kolId: String(kolId) } : {});

  if (!kolId) {
    return <aside className="w-56 border-r bg-gray-50 flex items-center justify-center text-sm text-muted-foreground">KOL 선택</aside>;
  }

  return (
    <aside className="w-56 border-r bg-white overflow-y-auto">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="p-2 text-sm">전문점 없음</div>
      ) : (
        <ul className="p-2 space-y-1">
          {data.map((s) => (
            <li key={s.id}>
              <Button
                variant={s.id === selectedShopId ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => onSelect(s.id)}
              >
                {s.shopName}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
} 