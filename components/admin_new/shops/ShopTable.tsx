/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { AdminNewShopRow } from '@/lib/hooks/adminNewShops';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Props {
  data: AdminNewShopRow[];
  onRowSelect?: (id: number) => void;
  selectedId?: number | null;
}

export default function AdminNewShopTable({ data, onRowSelect, selectedId }: Props) {
  const columns = React.useMemo<ColumnDef<AdminNewShopRow>[]>(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'shopName', header: '전문점명' },
      { accessorKey: 'kolName', header: 'KOL' },
      { accessorKey: 'region', header: '지역' },
      {
        accessorKey: 'status',
        header: '상태',
        cell: ({ row }: { row: any }) => (
          <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
            {row.original.status}
          </Badge>
        ),
      },
      { accessorKey: 'deviceCnt', header: '기기수' },
      {
        accessorKey: 'contractDate',
        header: '계약일',
        cell: ({ row }: { row: any }) =>
          row.original.contractDate
            ? format(new Date(row.original.contractDate), 'yyyy-MM-dd')
            : '-',
      },
    ],
    []
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg: any) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header: any) => (
                <TableHead key={header.id} className="whitespace-nowrap">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row: any) => (
              <TableRow
                key={row.id}
                className={`${row.original.id === selectedId ? 'bg-gray-100' : 'cursor-pointer hover:bg-gray-50'}`}
                onClick={() => onRowSelect?.(row.original.id)}
              >
                {row.getVisibleCells().map((cell: any) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                조회 결과가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
