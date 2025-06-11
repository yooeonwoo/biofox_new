"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Shop } from "@/lib/hooks/shops";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Props {
  data: Shop[];
}

export default function ShopTable({ data }: Props) {
  const columns = React.useMemo<ColumnDef<Shop>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => row.getValue("id"),
      },
      {
        accessorKey: "shop_name",
        header: "전문점명",
      },
      {
        accessorKey: "kols.name",
        header: "KOL",
        cell: ({ row }) => row.original.kols?.name ?? "-",
      },
      {
        accessorKey: "region",
        header: "지역",
      },
      {
        accessorKey: "status",
        header: "상태",
        cell: ({ row }) => (
          <Badge variant={row.getValue("status") === "active" ? "default" : "secondary"}>
            {row.getValue("status")}
          </Badge>
        ),
      },
      {
        accessorKey: "device_count",
        header: "기기수",
      },
      {
        accessorKey: "latest_allocation",
        header: "최근 배정일",
        cell: ({ row }) =>
          row.original.latest_allocation
            ? format(new Date(row.original.latest_allocation), "yyyy-MM-dd")
            : "-",
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="whitespace-nowrap">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
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
