"use client";

// ============================================================
//  بخش ۳.۸ — لینک‌ها (Links)
//  خارجی: سایت‌های لینک‌دهنده، صفحات، متن انکر
//  داخلی: صفحات با بیشترین لینک + نمودار میله‌ای
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { DataTable } from "@/components/dashboard/shared/data-table";
import { useAppStore } from "@/store/app-store";
import { faNumber, faCompact } from "@/lib/format";
import type { LinksResponse, LinkRow } from "@/lib/types";
import { Link2, ExternalLink, Repeat, Anchor } from "lucide-react";

// جدول یک لیست لینک
function LinkTable({
  rows,
  searchPlaceholder,
  csvName,
  keyHeader,
}: {
  rows: LinkRow[];
  searchPlaceholder: string;
  csvName: string;
  keyHeader: string;
}) {
  const columns = React.useMemo<ColumnDef<LinkRow>[]>(
    () => [
      {
        accessorKey: "key",
        header: keyHeader,
        cell: ({ row }) => (
          <span dir="ltr" className="block max-w-72 truncate text-start font-medium text-xs" title={row.original.key}>
            {row.original.key}
          </span>
        ),
      },
      {
        accessorKey: "value",
        header: "تعداد لینک",
        cell: ({ row }) => (
          <span className="tabular-fa font-bold text-primary">{faNumber(row.original.value)}</span>
        ),
      },
    ],
    [keyHeader]
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder={searchPlaceholder}
      csvName={csvName}
      csvHeaders={[keyHeader, "تعداد لینک"]}
      csvRow={(r) => [r.key, r.value]}
    />
  );
}

// نمودار میله‌ای ۸ مورد اول
function TopBars({ rows, name }: { rows: LinkRow[]; name: string }) {
  const top = rows.slice(0, 8).map((r) => ({
    key: r.key.replace(/^https?:\/\//, "").slice(0, 22),
    value: r.value,
  }));
  return (
    <div className="h-72" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(v: number) => faCompact(v)} />
          <YAxis type="category" dataKey="key" width={110} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <Tooltip
            formatter={(v: any) => [faNumber(v), name]}
            contentStyle={{ direction: "rtl", fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 6, 6, 0]} name={name} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LinksSection() {
  const site = useAppStore((s) => s.selectedSite);

  const { data, isLoading } = useQuery<LinksResponse>({
    queryKey: ["links", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/links?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<Link2 className="w-5 h-5" />}
        title="لینک‌ها"
        description="چه سایت‌هایی به شما لینک داده‌اند و صفحات شما چطور به هم وصل‌اند"
        help={{
          title: "لینک‌ها چرا مهم‌اند؟",
          body: "لینک خارجی (بک‌لینک) مثل معرفی‌نامه است؛ هرچه سایت‌های معتبرتر به شما لینک بدهند، گوگل شما را معتبرتر می‌داند. لینک داخلی هم مسیرهای داخل سایت شماست که به گوگل کمک می‌کند همه صفحات را ببیند.",
          example: "بک‌لینک مثل وقتی است که یک فرد مشهور صفحه‌بیزی‌نست کارت شما را توصیه می‌کند؛ لینک داخلی مثل تابلوهای راهنما داخل ساختمان شماست.",
        }}
        extra={data?.demo ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">داده نمایشی</Badge> : undefined}
      />

      {/* خلاصه لینک‌های خارجی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/30">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">کل بک‌لینک‌ها</p>
            <p className="text-2xl font-bold text-primary tabular-fa">
              {faCompact(data?.external.totalBacklinks ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">دامنه‌های لینک‌دهنده</p>
            <p className="text-2xl font-bold tabular-fa">{faNumber(data?.external.totalReferringDomains ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">کل لینک‌های داخلی</p>
            <p className="text-2xl font-bold tabular-fa">{faCompact(data?.internal.totalLinks ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">محبوب‌ترین صفحه</p>
            <p dir="ltr" className="text-sm font-bold truncate mt-1.5">
              {data?.external.topLinkedPages[0]?.key ?? "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="external" dir="rtl">
        <TabsList>
          <TabsTrigger value="external" className="gap-1.5 text-xs">
            <ExternalLink className="w-3.5 h-3.5" />
            لینک‌های خارجی
          </TabsTrigger>
          <TabsTrigger value="internal" className="gap-1.5 text-xs">
            <Repeat className="w-3.5 h-3.5" />
            لینک‌های داخلی
          </TabsTrigger>
        </TabsList>

        {/* --- لینک‌های خارجی --- */}
        <TabsContent value="external" className="mt-4 space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary" />
                    سایت‌های لینک‌دهنده (Top Sites)
                  </CardTitle>
                  <HelpTip title="سایت‌های لینک‌دهنده">
                    کدام سایت‌ها بیشترین لینک را به شما داده‌اند. تعداد و کیفیت هر دو مهم‌اند.
                  </HelpTip>
                </div>
              </CardHeader>
              <CardContent>
                <TopBars rows={data?.external.topLinkingSites ?? []} name="تعداد لینک" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1.5">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    صفحات با بیشترین بک‌لینک
                  </CardTitle>
                  <HelpTip title="صفحات محبوب">
                    صفحاتی که بقیه بیشترین به آن‌ها لینک داده‌اند — سرمایه‌های اصلی سایت شما!
                  </HelpTip>
                </div>
              </CardHeader>
              <CardContent>
                <TopBars rows={data?.external.topLinkedPages ?? []} name="تعداد لینک" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Anchor className="w-4 h-4 text-primary" />
                متن‌های انکر رایج (Anchor Text)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinkTable
                rows={data?.external.topAnchorTexts ?? []}
                searchPlaceholder="جستجو در متن انکر..."
                csvName="متن‌های-انکر"
                keyHeader="متن انکر"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- لینک‌های داخلی --- */}
        <TabsContent value="internal" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-primary" />
                  صفحات با بیشترین لینک داخلی
                </CardTitle>
                <HelpTip title="لینک داخلی">
                  صفحاتی که بیشترین لینک از صفحات دیگر سایت شما را گرفته‌اند. صفحات مهم را بیشتر لینک بدهید.
                </HelpTip>
              </div>
            </CardHeader>
            <CardContent>
              <TopBars rows={data?.internal.topLinkedPages ?? []} name="تعداد لینک داخلی" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">جدول کامل لینک‌های داخلی</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkTable
                rows={data?.internal.topLinkedPages ?? []}
                searchPlaceholder="جستجو در صفحات..."
                csvName="لینک‌های-داخلی"
                keyHeader="آدرس صفحه"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
