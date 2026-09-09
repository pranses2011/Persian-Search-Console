"use client";

// ============================================================
//  بخش ۳.۹ — Core Web Vitals / Page Experience
//  LCP، INP، CLS با تفکیک موبایل/دسکتاپ + دسته‌بندی رنگی
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { useAppStore } from "@/store/app-store";
import { faNumber, faSeconds, faJalaliShort, isoToDate } from "@/lib/format";
import type { VitalsResponse, VitalMetric } from "@/lib/types";
import { Gauge, Smartphone, Monitor, TrendingUp } from "lucide-react";

// برچسب‌های فارسی وضعیت
const CLS_LABEL: Record<VitalMetric["classification"], { label: string; color: string; badge: string }> = {
  good: { label: "خوب", color: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  ni: { label: "نیاز به بهبود", color: "text-amber-600", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  poor: { label: "ضعیف", color: "text-red-600", badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

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
          <span className="font-bold tabular-fa">
            {p.dataKey === "CLS" ? faNumber(p.value, 2) : faSeconds(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// کارت یک معیار
function VitalCard({ metric, index }: { metric: VitalMetric; index: number }) {
  const cls = CLS_LABEL[metric.classification];
  const format = (v: number) => (metric.id === "CLS" ? faNumber(v, 3) : faSeconds(v));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5 space-y-4">
          {/* عنوان و بج */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-bold text-sm truncate">{metric.title}</p>
              <HelpTip title={metric.title} example={metric.description}>
                {metric.description}
              </HelpTip>
            </div>
            <Badge className={`text-[11px] shrink-0 ${cls.badge}`}>{cls.label}</Badge>
          </div>

          {/* مقدار اصلی */}
          <div>
            <div className={`text-3xl font-bold tabular-fa ${cls.color}`}>{format(metric.value)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">میانگین کلی سایت</p>
          </div>

          {/* تفکیک موبایل/دسکتاپ */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/60 p-2.5 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">موبایل</p>
                <p className="text-sm font-bold tabular-fa truncate">{format(metric.mobile)}</p>
              </div>
            </div>
            <div className="rounded-lg bg-muted/60 p-2.5 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">دسکتاپ</p>
                <p className="text-sm font-bold tabular-fa truncate">{format(metric.desktop)}</p>
              </div>
            </div>
          </div>

          {/* توزیع ترافیک */}
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">تجربه کاربران:</p>
            <div className="h-2.5 rounded-full overflow-hidden flex" dir="ltr">
              <div className="bg-emerald-500" style={{ width: `${metric.good}%` }} title={`خوب: ${metric.good}%`} />
              <div className="bg-amber-400" style={{ width: `${metric.needsImprovement}%` }} title={`نیاز به بهبود: ${metric.needsImprovement}%`} />
              <div className="bg-red-500" style={{ width: `${metric.poor}%` }} title={`ضعیف: ${metric.poor}%`} />
            </div>
            <div className="flex justify-between text-[10px] tabular-fa">
              <span className="text-emerald-600">خوب {faNumber(metric.good)}٪</span>
              <span className="text-amber-600">بهبود {faNumber(metric.needsImprovement)}٪</span>
              <span className="text-red-600">ضعیف {faNumber(metric.poor)}٪</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function VitalsSection() {
  const site = useAppStore((s) => s.selectedSite);

  const { data, isLoading } = useQuery<VitalsResponse>({
    queryKey: ["vitals", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/vitals?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-80" />
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const allGood = (data?.metrics ?? []).every((m) => m.classification === "good");

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<Gauge className="w-5 h-5" />}
        title="Core Web Vitals — سرعت و تجربه کاربر"
        description="گوگل می‌سنجد سایت شما چقدر سریع و روان برای بازدیدکننده‌هاست"
        help={{
          title: "Core Web Vitals چیست؟",
          body: "سه معیار کلیدی سرعت و راحتی سایت: LCP (سرعت نمایش محتوای اصلی)، INP (سرعت واکنش به کلیک) و CLS (عدم پرش عناصر صفحه). این اعداد بخشی از رتبه‌بندی گوگل هستند!",
          example: "مثل رستوران: چقدر سریع غذا می‌آید (LCP)، چقدر سریع گارسون جواب می‌دهد (INP)، و میز وسط غذا جابه‌جا نمی‌شود (CLS)!",
        }}
        extra={
          <Badge
            className={allGood ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"}
          >
            {allGood ? "وضعیت کلی: خوب" : "وضعیت کلی: نیاز به بهبود"}
          </Badge>
        }
      />

      {/* سه کارت معیار */}
      <div className="grid md:grid-cols-3 gap-4">
        {(data?.metrics ?? []).map((m, i) => (
          <VitalCard key={m.id} metric={m} index={i} />
        ))}
      </div>

      {/* نمودار روند */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              روند بهبود در ۱۲ ماه اخیر
            </CardTitle>
            <HelpTip title="روند Core Web Vitals">
              خطوط پایین‌تر (برای LCP و INP) بهترند. خط CLS به‌سمت صفر بهتر است.
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
                <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" tickFormatter={(v: number) => faNumber(v / 100) + "ه"} />
                <Tooltip content={<PersianTooltip />} />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{v}</span>} />
                <Line type="monotone" dataKey="LCP" name="LCP (میلی‌ثانیه)" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="INP" name="INP (میلی‌ثانیه)" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="CLS" name="CLS (×۱۰۰)" stroke="var(--chart-3)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
