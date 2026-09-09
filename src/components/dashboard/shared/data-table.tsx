"use client";

// ============================================================
//  جدول داده عمومی داشبورد
//  صفحه‌بندی + مرتب‌سازی + جستجو + خروجی CSV (بخش ۳.۱ و ۳.۸)
// ============================================================

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronLeft,
  Search, FileDown, Inbox,
} from "lucide-react";
import { downloadCsv } from "@/lib/csv";
import { faNumber, toFaDigits } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // عنوان جستجو — مثل «جستجو در کلمات کلیدی...»
  searchPlaceholder?: string;
  // نام فایل خروجی CSV
  csvName?: string;
  // هدر CSV فارسی (به همان ترتیب ستون‌ها)
  csvHeaders?: string[];
  // تابع تبدیل ردیف به آرایه CSV
  csvRow?: (row: TData) => (string | number)[];
  // ارتفاع حداکثر با اسکرول برای لیست‌های بلند
  maxHeight?: string;
  // متن نمایشی وقتی داده خالی است
  emptyText?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "جستجو...",
  csvName = "خروجی",
  csvHeaders,
  csvRow,
  maxHeight = "max-h-[430px]",
  emptyText = "داده‌ای برای نمایش نیست",
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: "includesString",
  });

  // خروجی CSV از داده فیلترشده
  function handleExport() {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) {
      toast({ title: "داده‌ای برای خروجی گرفتن وجود ندارد", variant: "destructive" });
      return;
    }
    if (csvHeaders && csvRow) {
      downloadCsv(
        csvName,
        csvHeaders,
        rows.map((r) => csvRow(r.original))
      );
    } else {
      // خروجی خام از ستون‌های قابل دسترس
      const headers = table.getVisibleFlatColumns().map((c) => String(c.id));
      downloadCsv(
        csvName,
        headers,
        rows.map((r) =>
          table.getVisibleFlatColumns().map((c) => {
            const v = r.getValue(c.id);
            return v == null ? "" : String(v);
          })
        )
      );
    }
    toast({
      title: "خروجی CSV آماده شد",
      description: `${faNumber(rows.length)} ردیف دانلود شد — با اکسل باز می‌شود.`,
    });
  }

  return (
    <div className="space-y-3">
      {/* نوار بالا: جستجو + خروجی */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-44 max-w-xs">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="ps-8 h-9 text-sm"
          />
        </div>
        {csvRow && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 gap-1.5"
            title="دانلود خروجی CSV (قابل باز شدن در اکسل)"
          >
            <FileDown className="w-4 h-4" />
            خروجی CSV
          </Button>
        )}
        <span className="text-xs text-muted-foreground ms-auto tabular-fa">
          {faNumber(table.getFilteredRowModel().rows.length)} ردیف
        </span>
      </div>

      {/* جدول */}
      <div className={`rounded-xl border bg-card overflow-hidden ${maxHeight}`}>
        <div className="overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <TableHead key={header.id} className="h-10">
                        {header.isPlaceholder ? null : (
                          <button
                            className="flex items-center gap-1 font-bold text-xs hover:text-primary transition-colors"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ArrowUp className="w-3 h-3 text-primary" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="w-3 h-3 text-primary" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <Inbox className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="text-sm">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* صفحه‌بندی */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>تعداد ردیف در صفحه</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {faNumber(n)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            aria-label="صفحه قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-fa px-2">
            صفحه {faNumber(table.getState().pagination.pageIndex + 1)} از{" "}
            {faNumber(Math.max(table.getPageCount(), 1))}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            aria-label="صفحه بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
