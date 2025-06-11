"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminNewShopTable from "@/components/admin_new/shops/ShopTable";
import { useAdminNewShops } from "@/lib/hooks/adminNewShops";
import { Loader2 } from "lucide-react";

export default function AdminNewShopListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
    }),
    [search, status]
  );

  const { data = [], isLoading, isError } = useAdminNewShops(params);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="전문점명 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />

        <Select value={status ?? ""} onValueChange={(v) => setStatus(v === "" ? undefined : v)}>
          <SelectTrigger className="w-36" size="sm">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            <SelectItem value="active">활성</SelectItem>
            <SelectItem value="paused">중지</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 로딩 중...
        </div>
      ) : isError ? (
        <div className="text-destructive">데이터 로딩 중 오류가 발생했습니다.</div>
      ) : (
        <AdminNewShopTable data={data} />
      )}
    </div>
  );
}
