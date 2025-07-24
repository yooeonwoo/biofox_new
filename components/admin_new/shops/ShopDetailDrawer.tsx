'use client';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAdminShopDetail, useShopAllocations } from '@/lib/hooks/adminShopDetail'; // TODO: Convex 전환은 향후 데이터 구조 통일 후 진행
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Fragment } from 'react';

interface Props {
  shopId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShopDetailDrawer({ shopId, open, onOpenChange }: Props) {
  const { data: shop, isLoading: isShopLoading, isError: isShopError } = useAdminShopDetail(shopId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] overflow-y-auto sm:w-[540px]">
        {isShopLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 로딩 중...
          </div>
        ) : isShopError || !shop ? (
          <div className="flex flex-col items-center justify-center py-10 text-destructive">
            <AlertCircle className="mb-2 h-5 w-5" />
            상세 정보를 불러오지 못했습니다.
          </div>
        ) : (
          <div className="space-y-4 p-2">
            {/* 상단 카드 */}
            <div className="space-y-2 rounded-md border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{shop.shop_name}</h2>
                <Badge variant={shop.status === 'active' ? 'default' : 'secondary'}>
                  {shop.status}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted-foreground">KOL</dt>
                <dd>{shop.kol_name ?? '-'}</dd>
                <dt className="text-muted-foreground">대표자</dt>
                <dd>{shop.owner_name ?? '-'}</dd>
                <dt className="text-muted-foreground">지역</dt>
                <dd>{shop.region ?? '-'}</dd>
                <dt className="text-muted-foreground">계약일</dt>
                <dd>
                  {shop.contract_date ? format(new Date(shop.contract_date), 'yyyy-MM-dd') : '-'}
                </dd>
                <dt className="text-muted-foreground">총 보급 기기수</dt>
                <dd>{shop.device_cnt ?? 0}</dd>
              </dl>
              {shop.smart_place_link && (
                <Button asChild variant="link" size="sm" className="px-0">
                  <a href={shop.smart_place_link} target="_blank" rel="noreferrer">
                    스마트플레이스 링크 열기 ↗
                  </a>
                </Button>
              )}
            </div>

            {/* 탭 */}
            <Tabs defaultValue="allocations">
              <TabsList>
                <TabsTrigger value="allocations">기기 내역</TabsTrigger>
                {/* 향후 다른 탭 추가 가능 */}
              </TabsList>
              <TabsContent value="allocations">
                <AllocationTabContent shopId={shopId} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AllocationTabContent({ shopId }: { shopId: number | null }) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useShopAllocations(shopId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 로딩 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-destructive">
        <AlertCircle className="mb-2 h-5 w-5" />
        데이터를 불러오지 못했습니다.
      </div>
    );
  }

  const rows = data?.pages.flatMap(p => p.rows) || [];

  if (rows.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">내역이 없습니다.</div>;
  }

  return (
    <Fragment>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>보급일</TableHead>
              <TableHead>고정급</TableHead>
              <TableHead>공제</TableHead>
              <TableHead>지급액</TableHead>
              <TableHead>비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{format(new Date(r.allocated_at), 'yyyy-MM-dd')}</TableCell>
                <TableCell className="text-right">{r.tier_fixed_amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.user_input_deduct.toLocaleString()}</TableCell>
                <TableCell className="text-right">{r.pay_to_kol.toLocaleString()}</TableCell>
                <TableCell>{r.note ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasNextPage && (
        <div className="flex justify-center py-3">
          <Button size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 불러오는 중...
              </>
            ) : (
              '더 보기'
            )}
          </Button>
        </div>
      )}
    </Fragment>
  );
}
