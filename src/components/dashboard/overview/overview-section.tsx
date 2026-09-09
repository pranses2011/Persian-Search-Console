"use client";

// ============================================================
//  بخش ۳.۱ — نمای کلی: عملکرد جستجو (Search Performance)
//  ۴ کارت KPI + نمودار خطی تعاملی + جدول‌های ۶ بعد + فیلترها
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { KpiCard } from "@/components/dashboard/shared/kpi-card";
import { PerformanceChart } from "./performance-chart";
import { DimensionTables } from "./dimension-tables";
import { AdvancedFilters } from "./advanced-filters";
import { useAppStore } from "@/store/app-store";
import { faCompact, faPercent, faNumber } from "@/lib/format";
import type { PerformanceResponse } from "@/lib/types";
import { MousePointerClick, Eye, Percent, Trophy, TrendingUp } from "lucide-react";

/** درصد تغییر بین دو عدد */
function delta(current: number, previous?: number): number | undefined {
  if (previous === undefined || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
}

export function OverviewSection() {
  const site = useAppStore((s) => s.selectedSite);
  const dateRange = useAppStore((s) => s.dateRange);
  const compare = useAppStore((s) => s.compare);
  const filters = useAppStore((s) => s.filters);

  // واکشی داده عملکرد (برای KPI و نمودار)
  const { data, isLoading } = useQuery<PerformanceResponse>({
    queryKey: ["performance-overview", site?.siteUrl, dateRange.start, dateRange.end, compare, filters],
    enabled: !!site,
    queryFn: async () => {
      const params = new URLSearchParams({
        site: site!.siteUrl,
        start: dateRange.start,
        end: dateRange.end,
        dimension: "date",
        compare: String(compare),
      });
      if (filters.query) params.set("query", filters.query);
      if (filters.page) params.set("page", filters.page);
      if (filters.country) params.set("country", filters.country);
      if (filters.device) params.set("device", filters.device);
      if (filters.searchAppearance) params.set("searchAppearance", filters.searchAppearance);
      const res = await fetch(`/api/performance?${params}`);
      if (!res.ok) throw new Error("خطا در دریافت عملکرد");
      return res.json();
    },
  });

  const t = data?.totals;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<TrendingUp className="w-5 h-5" />}
        title="عملکرد جستجو"
        description="چگونه سایت شما در نتایج جستجوی گوگل دیده و کلیک می‌شود — به زبان ساده"
        help={{
          title: "عملکرد جستجو چیست؟",
          body: "این بخش نشان می‌دهد سایت شما چقدر در گوگل «دیده» شده و چقدر «کلیک» خورده است. مثل ویترین مغازه: چند نفر رد شدند و دیدند (نمایش) و چند نفر وارد شدند (کلیک).",
          example: "فرض کنید روزی ۱۰۰۰ نفر تابلوی مغازه شما را می‌بینند و ۳۰ نفر وارد می‌شوند. یعنی نمایش = ۱۰۰۰، کلیک = ۳۰ و نرخ کلیک = ۳٪.",
        }}
      />

      {/* ۴ کارت معیار اصلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          loading={isLoading}
          title="کلیک‌ها"
          value={t ? faCompact(t.clicks) : "—"}
          icon={<MousePointerClick className="w-4 h-4" />}
          iconClass="bg-chart-1/15 text-chart-1"
          delta={compare ? delta(t?.clicks ?? 0, data?.previousTotals?.clicks) : undefined}
          help={{
            title: "کلیک چیست؟",
            body: "تعداد دفعاتی که کاربران روی لینک سایت شما در نتایج گوگل کلیک کرده و وارد سایت شما شده‌اند.",
            example: "اگر امروز ۵۰۰ نفر از گوگل وارد سایت شما شده باشند، یعنی ۵۰۰ کلیک داشته‌اید.",
          }}
        />
        <KpiCard
          loading={isLoading}
          title="نمایش‌ها"
          value={t ? faCompact(t.impressions) : "—"}
          icon={<Eye className="w-4 h-4" />}
          iconClass="bg-chart-2/15 text-chart-2"
          delta={compare ? delta(t?.impressions ?? 0, data?.previousTotals?.impressions) : undefined}
          help={{
            title: "نمایش چیست؟",
            body: "تعداد دفعاتی که لینک سایت شما در نتایج جستجوی گوگل دیده شده است — حتی اگر روی آن کلیک نشده باشد.",
            example: "اگر سایت شما در نتایج جستجوی ۲۰۰ نفر نمایش داده شده باشد، ۲۰۰ نمایش داشته‌اید.",
          }}
        />
        <KpiCard
          loading={isLoading}
          title="نرخ کلیک (CTR)"
          value={t ? faPercent(t.ctr) : "—"}
          icon={<Percent className="w-4 h-4" />}
          iconClass="bg-chart-3/15 text-chart-3"
          delta={compare ? delta(t?.ctr ?? 0, data?.previousTotals?.ctr) : undefined}
          help={{
            title: "نرخ کلیک (CTR) چیست؟",
            body: "درصد افرادی که سایت شما را در نتایج دیدند و روی آن کلیک کردند. هرچه بالاتر باشد یعنی عنوان و توضیحات سایت شما جذاب‌تر است.",
            example: "از ۱۰۰۰ نفر که سایت شما را دیدند، ۴۰ نفر کلیک کردند = نرخ کلیک ۴٪.",
          }}
        />
        <KpiCard
          loading={isLoading}
          title="جایگاه میانگین"
          value={t ? faNumber(t.position, 1) : "—"}
          icon={<Trophy className="w-4 h-4" />}
          iconClass="bg-chart-4/15 text-chart-4"
          delta={compare ? delta(t?.position ?? 0, data?.previousTotals?.position) : undefined}
          invertDelta
          help={{
            title: "جایگاه میانگین چیست؟",
            body: "میانگین رتبه سایت شما در نتایج جستجوی گوگل. عدد کوچک‌تر بهتر است — جایگاه ۱ یعنی اولین نتیجه صفحه اول!",
            example: "اگر معمولاً بین نتیجه سوم تا هفتم هستید، جایگاه میانگین حدود ۵ است. کاهش این عدد خبر خوبی است.",
          }}
        />
      </div>

      {/* فیلترهای پیشرفته */}
      <AdvancedFilters />

      {/* نمودار روند */}
      <PerformanceChart data={data?.daily ?? []} loading={isLoading} />

      {/* جدول‌های تفکیکی ۶ بعد */}
      <DimensionTables />
    </div>
  );
}
