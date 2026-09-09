"use client";

// ============================================================
//  بخش ۳.۷ — نتایج غنی (Rich Results / Enhancements)
//  انواع: FAQ، مقاله، محصول، مسیر راهنما، نظر، ویدیو، ...
//  با تعداد معتبر/خطا/هشدار + روند + صفحات مشکل‌دار
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { useAppStore } from "@/store/app-store";
import { faNumber, faJalaliShort, isoToDate } from "@/lib/format";
import type { RichResultsResponse, RichResultType } from "@/lib/types";
import { Sparkles, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

function PersianTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date as string;
  return (
    <div dir="rtl" className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl space-y-1">
      {date && <p className="font-bold">{faJalaliShort(isoToDate(date))}</p>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
            {p.name}:
          </span>
          <span className="font-bold tabular-fa">{faNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// کارت یک نوع نتیجه غنی
function RichResultCard({ item, index }: { item: RichResultType; index: number }) {
  const total = item.valid + item.warnings + item.errors;
  const validShare = total > 0 ? (item.valid / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm truncate">{item.title}</p>
            {item.errors > 0 ? (
              <Badge variant="destructive" className="text-[10px] shrink-0">خطا</Badge>
            ) : item.warnings > 0 ? (
              <Badge variant="outline" className="text-[10px] shrink-0 text-amber-600 border-amber-300">هشدار</Badge>
            ) : (
              <Badge className="text-[10px] shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">سالم</Badge>
            )}
          </div>

          {/* سهم معتبر */}
          <div className="space-y-1.5">
            <Progress value={validShare} className="h-2" />
            <p className="text-[11px] text-muted-foreground tabular-fa">
              {faNumber(item.valid)} از {faNumber(total)} صفحه معتبر ({faNumber(validShare)}٪)
            </p>
          </div>

          {/* آمار سه‌گانه */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2">
              <div className="flex items-center justify-center gap-1 text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[10px]">معتبر</span>
              </div>
              <p className="font-bold text-sm tabular-fa text-emerald-600">{faNumber(item.valid)}</p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2">
              <div className="flex items-center justify-center gap-1 text-amber-600">
                <AlertTriangle className="w-3 h-3" />
                <span className="text-[10px]">هشدار</span>
              </div>
              <p className="font-bold text-sm tabular-fa text-amber-600">{faNumber(item.warnings)}</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-2">
              <div className="flex items-center justify-center gap-1 text-red-600">
                <XCircle className="w-3 h-3" />
                <span className="text-[10px]">خطا</span>
              </div>
              <p className="font-bold text-sm tabular-fa text-red-600">{faNumber(item.errors)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// جزئیات یک نوع (روند + صفحات مشکل‌دار)
function RichResultDetail({ item }: { item: RichResultType }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* نمودار روند */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">روند «{item.title}» (۱۲ ماه اخیر)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-52" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={item.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => faJalaliShort(isoToDate(v)).slice(3, 8)}
                  tick={{ fontSize: 10 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(v: number) => faNumber(v)} />
                <Tooltip content={<PersianTooltip />} />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{v}</span>} />
                <Line type="monotone" dataKey="valid" name="معتبر" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="warnings" name="هشدار" stroke="var(--chart-2)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="errors" name="خطا" stroke="var(--chart-3)" strokeWidth={1.5} strokeDasharray="2 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* صفحات مشکل‌دار */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">صفحات مشکل‌دار</CardTitle>
        </CardHeader>
        <CardContent>
          {item.problemPages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              صفحه مشکل‌داری در این نوع ثبت نشده 🎉
            </p>
          ) : (
            <div className="max-h-52 overflow-y-auto rounded-lg border divide-y">
              {item.problemPages.map((p, i) => (
                <div key={i} className="p-2.5 space-y-1">
                  <p dir="ltr" className="text-xs font-mono text-start truncate" title={p.url}>
                    {p.url}
                  </p>
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    <XCircle className="w-3 h-3 shrink-0" />
                    {p.issue}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function RichResultsSection() {
  const site = useAppStore((s) => s.selectedSite);

  const { data, isLoading } = useQuery<RichResultsResponse>({
    queryKey: ["rich-results", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/rich-results?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-80" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const types = data?.types ?? [];
  const totalValid = types.reduce((a, t) => a + t.valid, 0);
  const totalErrors = types.reduce((a, t) => a + t.errors, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<Sparkles className="w-5 h-5" />}
        title="نتایج غنی (Rich Results)"
        description="صفحاتی که با نمایش ویژه و چشمگیر در نتایج گوگل ظاهر می‌شوند — مثل ستاره امتیاز و سوالات متداول"
        help={{
          title: "نتیجه غنی چیست؟",
          body: "وقتی ساختار داده صفحات را استاندارد (Schema) کنید، گوگل آن‌ها را خاص نمایش می‌دهد: ستاره امتیاز برای محصول، سوالات بازشو، مسیر راهنما و... نتیجه‌های غنی کلیک بیشتری می‌گیرند!",
          example: "در نتایج جستجو، رستورانی که ستاره ۴٫۸ و عکس دارد، جلب توجهش از رستوران ساده بیشتر است — آن ستاره یک «نتیجه غنی» است.",
        }}
        extra={data?.demo ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">داده نمایشی</Badge> : undefined}
      />

      {/* خلاصه */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-emerald-300 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">کل صفحات با نتیجه غنی معتبر</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-fa">{faNumber(totalValid)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-300 dark:border-red-900">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">کل صفحات با خطا</p>
            <p className="text-2xl font-bold text-red-600 tabular-fa">{faNumber(totalErrors)}</p>
          </CardContent>
        </Card>
      </div>

      {/* کارت انواع */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((t, i) => (
          <RichResultCard key={t.id} item={t} index={i} />
        ))}
      </div>

      {/* جزئیات هر نوع در تب */}
      {types.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-base">جزئیات روند و صفحات مشکل‌دار</CardTitle>
              <HelpTip title="جزئیات نتایج غنی">
                برای هر نوع نتیجه غنی، روند ۱۲ ماهه و فهرست صفحاتی که خطا یا هشدار دارند را ببینید.
              </HelpTip>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={types[0].id} dir="rtl">
              <TabsList className="flex-wrap h-auto max-w-full">
                {types.map((t) => (
                  <TabsTrigger key={t.id} value={t.id} className="text-[11px]">
                    {t.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {types.map((t) => (
                <TabsContent key={t.id} value={t.id} className="mt-4">
                  <RichResultDetail item={t} />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
