"use client";

// ============================================================
//  جدول‌های تفکیکی عملکرد جستجو (بخش ۳.۱)
//  ۶ تب: کلمات کلیدی، صفحات، کشورها، دستگاه‌ها، نوع نمایش، تاریخ‌ها
//  هر جدول: صفحه‌بندی + مرتب‌سازی + جستجو + خروجی CSV
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { useAppStore } from "@/store/app-store";
import { faNumber, faPercent, faJalaliShort, isoToDate } from "@/lib/format";
import type { PerformanceResponse, DimensionRow } from "@/lib/types";
import {
  KeySquare, FileText, Globe2, MonitorSmartphone, Sparkles, CalendarDays,
} from "lucide-react";

// تعریف تب‌های ۶گانه
const DIMENSIONS = [
  { id: "query", label: "کلمات کلیدی", icon: KeySquare, placeholder: "جستجو در کلمات کلیدی...", csv: "کلمات-کلیدی" },
  { id: "page", label: "صفحات", icon: FileText, placeholder: "جستجو در صفحات...", csv: "صفحات" },
  { id: "country", label: "کشورها", icon: Globe2, placeholder: "جستجو در کشورها...", csv: "کشورها" },
  { id: "device", label: "دستگاه‌ها", icon: MonitorSmartphone, placeholder: "جستجو در دستگاه‌ها...", csv: "دستگاه‌ها" },
  { id: "searchAppearance", label: "نوع نمایش", icon: Sparkles, placeholder: "جستجو در نوع نمایش...", csv: "نوع-نمایش" },
  { id: "date", label: "تاریخ‌ها", icon: CalendarDays, placeholder: "جستجو در تاریخ‌ها...", csv: "تاریخ‌ها" },
] as const;

// ستون‌های مشترک جدول‌ها
function useColumns(dimension: string): ColumnDef<DimensionRow>[] {
  return React.useMemo(
    () => [
      {
        accessorKey: "key",
        header: dimension === "query" ? "کلمه کلیدی" : dimension === "page" ? "آدرس صفحه" : dimension === "date" ? "تاریخ" : "عنوان",
        cell: ({ row }) => {
          const v = row.getValue("key") as string;
          // نمایش تاریخ به شمسی
          if (dimension === "date") {
            return <span className="tabular-fa">{faJalaliShort(isoToDate(v))}</span>;
          }
          // آدرس صفحات LTR
          if (dimension === "page") {
            return (
              <span dir="ltr" className="block max-w-64 truncate text-start font-medium" title={v}>
                {v}
              </span>
            );
          }
          return <span className="font-medium">{v}</span>;
        },
      },
      {
        accessorKey: "clicks",
        header: "کلیک‌ها",
        cell: ({ row }) => <span className="tabular-fa font-bold text-primary">{faNumber(row.original.clicks)}</span>,
      },
      {
        accessorKey: "impressions",
        header: "نمایش‌ها",
        cell: ({ row }) => <span className="tabular-fa">{faNumber(row.original.impressions)}</span>,
      },
      {
        accessorKey: "ctr",
        header: "نرخ کلیک",
        cell: ({ row }) => <span className="tabular-fa">{faPercent(row.original.ctr)}</span>,
      },
      {
        accessorKey: "position",
        header: "جایگاه",
        cell: ({ row }) => <span className="tabular-fa">{faNumber(row.original.position, 1)}</span>,
      },
    ],
    [dimension]
  );
}

// محتوای یک تب
function DimensionTable({ dimension }: { dimension: string }) {
  const site = useAppStore((s) => s.selectedSite);
  const dateRange = useAppStore((s) => s.dateRange);
  const filters = useAppStore((s) => s.filters);
  const columns = useColumns(dimension);
  const dim = DIMENSIONS.find((d) => d.id === dimension)!;

  const { data, isLoading } = useQuery<PerformanceResponse>({
    queryKey: ["performance", site?.siteUrl, dateRange.start, dateRange.end, dimension, filters],
    enabled: !!site,
    queryFn: async () => {
      const params = new URLSearchParams({
        site: site!.siteUrl,
        start: dateRange.start,
        end: dateRange.end,
        dimension,
      });
      // اعمال فیلترهای پیشرفته
      if (filters.query && dimension !== "query") params.set("query", filters.query);
      if (filters.page && dimension !== "page") params.set("page", filters.page);
      if (filters.country && dimension !== "country") params.set("country", filters.country);
      if (filters.device && dimension !== "device") params.set("device", filters.device);
      if (filters.searchAppearance && dimension !== "searchAppearance")
        params.set("searchAppearance", filters.searchAppearance);
      const res = await fetch(`/api/performance?${params}`);
      if (!res.ok) throw new Error("خطا در دریافت داده");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={data?.rows ?? []}
      searchPlaceholder={dim.placeholder}
      csvName={`${dim.csv}-${dateRange.start}-تا-${dateRange.end}`}
      csvHeaders={["عنوان", "کلیک‌ها", "نمایش‌ها", "نرخ کلیک (٪)", "جایگاه"]}
      csvRow={(r) => [
        dimension === "date" ? faJalaliShort(isoToDate(r.key)) : r.key,
        r.clicks,
        r.impressions,
        r.ctr.toFixed(2),
        r.position.toFixed(1),
      ]}
      emptyText="موردی یافت نشد"
    />
  );
}

export function DimensionTables() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-base">جزئیات تفکیکی</CardTitle>
          <HelpTip
            title="جدول‌های تفکیکی"
            example="مثل گزارش مغازه: چه کسایی (کشور)، با چه دستگاهی، از کدام قفسه (صفحه) خرید کردند."
          >
            داده‌های نمودار بالا را از زوایای مختلف ببینید: کلماتی که مردم سرچ می‌کنند، صفحاتی که
            بازدید می‌گیرند، کشورها و دستگاه‌ها و نوع نمایش در نتایج گوگل. روی هر ستون کلیک کنید
            تا مرتب شود؛ از دکمه «خروجی CSV» هم می‌توانید برای اکسل دانلود کنید.
          </HelpTip>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="query" dir="rtl">
          <TabsList className="flex-wrap h-auto">
            {DIMENSIONS.map((d) => (
              <TabsTrigger key={d.id} value={d.id} className="text-xs gap-1.5 flex-1 sm:flex-none">
                <d.icon className="w-3.5 h-3.5" />
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {DIMENSIONS.map((d) => (
            <TabsContent key={d.id} value={d.id} className="mt-4">
              <DimensionTable dimension={d.id} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
