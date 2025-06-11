"use client";

import { useState } from "react";
import KolSidebar from "@/components/admin_new/kols/KolSidebar";
import ShopSidebar from "@/components/admin_new/shops/ShopSidebar";
import AdminNewShopTable from "@/components/admin_new/shops/ShopTable";
import NewShopDialog from "@/components/admin_new/shops/NewShopDialog";
import { useAdminNewShops } from "@/lib/hooks/adminNewShops";
import { Loader2 } from "lucide-react";

export default function AdminNewShopListPage() {
  const [selectedKolId, setSelectedKolId] = useState<number | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  const { data = [], isLoading, isError } = useAdminNewShops(
    selectedKolId ? { kolId: String(selectedKolId) } : {}
  );

  return (
    <div className="flex h-full">
      <KolSidebar selectedId={selectedKolId} onSelect={(id) => { setSelectedKolId(id); setSelectedShopId(null); }} />
      <ShopSidebar kolId={selectedKolId} selectedShopId={selectedShopId} onSelect={setSelectedShopId} />

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
        {selectedShopId ? (
          isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            </div>
          ) : (
            <AdminNewShopTable data={data.filter((s) => s.id === selectedShopId)} />
          )
        ) : (
          <div className="text-muted-foreground">전문점을 선택하세요.</div>
        )}

        <div>
          <NewShopDialog createdBy={1} />
        </div>
      </div>
    </div>
  );
}
