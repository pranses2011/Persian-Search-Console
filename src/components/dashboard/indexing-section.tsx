"use client";

// ============================================================
//  بخش ۳.۳ — ایندکس‌گذاری صفحات (Page Indexing / Coverage)
//  نمودار دایره‌ای + روند خطی + دسته‌های عدم ایندکس با راهنما
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { useAppStore } from "@/store/app-store";
import { faNumber, faPercent, faJalaliShort, isoToDate } from "@/lib/format";
import type { IndexingResponse } from "@/lib/types";
import { FileStack, CheckCircle2, XCircle, Wrench, ChevronDown } from "lucide-react";

// رنگ‌های دسته‌ها بر اساس شدت
const SEVERITY_COLORS: Record<string, string> = {
  good: "var(--chart-1)",
  warning: "var(--chart-2)",
  error: "var(--chart-3)",
  info: "var(--chart-5)",
};

// tooltip فارسی
function PersianTooltip({ active, payload, label }: any) {
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

export function IndexingSection() {
  const site = useAppStore((s) => s.selectedSite);

  const { data, isLoading } = useQuery<IndexingResponse>({
    queryKey: ["indexing", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/indexing?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-72" />
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const indexedShare = data ? (data.indexed / data.total) * 100 : 0;
  const pieData = [
    { name: "ایندکس‌شده", value: data?.indexed ?? 0, color: "var(--chart-1)" },
    { name: "ایندکس‌نشده", value: data?.notIndexed ?? 0, color: "var(--chart-3)" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<FileStack className="w-5 h-5" />}
        title="ایندکس‌گذاری صفحات"
        description="کدام صفحات سایت شما در گوگل ثبت شده‌اند و چرا بعضی‌ها ثبت نشده‌اند"
        help={{
          title: "ایندکس‌گذاری چیست؟",
          body: "صفحات شما باید اول در «بانک اطلاعاتی» گوگل ثبت (ایندکس) شوند تا در نتایج جستجو ظاهر شوند. صفحه‌ای که ایندکس نشده، انگار وجود ندارد!",
          example: "مثل عضویت در لیست شرکت‌کننده‌های قرعه‌کشی؛ تا اسم‌تان ثبت نشود، شانسی در بردن ندارید.",
        }}
        extra={data?.demo ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">داده نمایشی</Badge> : undefined}
      />

      {/* خلاصه آماری */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">کل صفحات شناسایی‌شده</p>
            <p className="text-2xl font-bold tabular-fa">{faNumber(data?.total ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-300 dark:border-emerald-800">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground">صفحات ایندکس‌شده</p>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 tabular-fa">
              {faNumber(data?.indexed ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-300 dark:border-red-900">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <p className="text-xs text-muted-foreground">ایندکس‌نشده</p>
              <XCircle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600 tabular-fa">
              {faNumber(data?.notIndexed ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* نمودارها */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* نمودار دایره‌ای */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-base">سهم ایندکس</CardTitle>
              <HelpTip title="نمودار دایره‌ای ایندکس">
                نسبت صفحات ثبت‌شده به ثبت‌نشده. هدف این است که بیشترِ صفحات ارزشمند شما سبز باشند.
              </HelpTip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, n: any) => [faNumber(v), n]}
                    contentStyle={{ direction: "rtl", fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-14 mb-8">
              <p className="text-3xl font-bold text-emerald-600 tabular-fa">{faPercent(indexedShare, 1)}</p>
              <p className="text-xs text-muted-foreground">صفحات شما ایندکس شده</p>
            </div>
            <div className="flex justify-center gap-4 text-xs">
              {pieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name} ({faNumber(d.value)})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* نمودار روند */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-base">روند ایندکس‌گذاری (۱۲ ماه اخیر)</CardTitle>
              <HelpTip title="روند ایندکس">
                این خط نشان می‌دهد تعداد صفحات ثبت‌شده‌ی شما در طول زمان چطور تغییر کرده. خط سبز بالاتر = بهتر.
              </HelpTip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => faJalaliShort(isoToDate(v)).slice(3, 8)}
                    tick={{ fontSize: 10 }}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(v: number) => faNumber(v)} />
                  <Tooltip content={<PersianTooltip />} />
                  <Legend
                    formatter={(v) => <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{v}</span>}
                  />
                  <Line type="monotone" dataKey="indexed" name="ایندکس‌شده" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="notIndexed" name="ایندکس‌نشده" stroke="var(--chart-3)" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* دسته‌های عدم ایندکس با راهنمای رفع */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base">چرا صفحات ایندکس نشده‌اند؟</CardTitle>
            <HelpTip
              title="دلایل عدم ایندکس"
              example="مثل پزشکی که دلیل رد شدن از معاینه را توضیح می‌دهد — هر دلیل با راه درمانش آمده."
            >
              گوگل برای کنار گذاشتن هر صفحه دلیلی دارد. هر دسته زیر شامل توضیح ساده و راه‌حل است. روی هر دسته کلیک کنید تا نمونه صفحاتش را ببینید.
            </HelpTip>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" dir="rtl" className="space-y-2">
            {(data?.categories ?? [])
              .filter((c) => c.count > 0)
              .sort((a, b) => b.count - a.count)
              .map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <AccordionItem value={cat.id} className="border rounded-xl px-4">
                    <AccordionTrigger className="hover:no-underline py-3.5">
                      <div className="flex items-center gap-3 text-start flex-1 min-w-0">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm tabular-fa"
                          style={{ background: SEVERITY_COLORS[cat.severity] }}
                        >
                          {faNumber(cat.count)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm">{cat.title}</p>
                          <p className="text-xs text-muted-foreground truncate leading-5">
                            {cat.description}
                          </p>
                        </div>
                        <Badge
                          variant={cat.severity === "error" ? "destructive" : cat.severity === "warning" ? "outline" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {cat.severity === "error" ? "بحرانی" : cat.severity === "warning" ? "نیاز به بررسی" : "اطلاعاتی"}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 space-y-3">
                      {/* راهنمای رفع */}
                      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-1.5">
                        <p className="text-xs font-bold flex items-center gap-1.5 text-primary">
                          <Wrench className="w-3.5 h-3.5" />
                          راهنمای رفع مشکل
                        </p>
                        <p className="text-xs leading-6 text-muted-foreground">{cat.fixGuide}</p>
                      </div>
                      {/* نمونه URLها */}
                      {cat.sampleUrls.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-muted-foreground">نمونه صفحات:</p>
                          <div className="max-h-32 overflow-y-auto rounded-lg border bg-muted/40 divide-y">
                            {cat.sampleUrls.map((u) => (
                              <div key={u} dir="ltr" className="px-3 py-1.5 text-xs font-mono text-start truncate">
                                {u}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
