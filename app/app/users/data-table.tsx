"use client";

import * as React from "react";
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  params: {
    page: number;
    pageSize: number;
    search: string | null;
    sortBy: string;
    sortOrder: string;
  };
  onParamsChange: (values: Partial<{
    page: number;
    pageSize: number;
    search: string | null;
    sortBy: string;
    sortOrder: string;
  }>) => void;
  isPending?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  params,
  onParamsChange,
  isPending,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' 
        ? updater([{ id: params.sortBy, desc: params.sortOrder === "desc" }])
        : updater;
      
      if (newSorting.length > 0) {
        onParamsChange({ 
          sortBy: newSorting[0].id, 
          sortOrder: newSorting[0].desc ? "desc" : "asc" 
        });
      }
    },
    state: {
      pagination: {
        pageIndex: params.page - 1,
        pageSize: params.pageSize,
      },
      sorting: [{ id: params.sortBy, desc: params.sortOrder === "desc" }],
      columnVisibility,
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  React.useEffect(() => {
    const currentPage = pageIndex + 1;

    if (currentPage !== params.page) {
      onParamsChange({ page: currentPage });
    }
  }, [pageIndex, params.page, onParamsChange]);

  React.useEffect(() => {
    if (pageSize !== params.pageSize) {
      onParamsChange({ pageSize, page: 1 });
    }
  }, [pageSize, params.pageSize, onParamsChange]);

  const handleSearchChange = (value: string) => {
    onParamsChange({ search: value || null, page: 1 });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search users..."
          value={params.search ?? ""}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <DataTableViewOptions table={table} />
      </div>
      <div
        className="overflow-hidden rounded-md border"
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
