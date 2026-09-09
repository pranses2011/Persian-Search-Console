"use client";

// ============================================================
//  خلاصه وضعیت کلی سایت + خروجی PDF (بخش ۶)
//  کارت امتیاز سلامت + متن خلاصه ساده + دکمه گزارش PDF
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { faNumber, faCompact, faPercent, faDelta, faJalaliDate, isoToDate } from "@/lib/format";
import type { SummaryResponse } from "@/lib/types";
import { Activity, FileText } from "lucide-react";

// گزارش چاپی (PDF) — ناحیه مخفی که موقع چاپ نمایان می‌شود
function PrintReport({ data, siteUrl, start, end }: {
  data: SummaryResponse;
  siteUrl: string;
  start: string;
  end: string;
}) {
  return (
    <div id="print-area" className="hidden print:block fixed inset-0 z-50 bg-white text-black p-6 overflow-y-auto">
      <div style={{ direction: "rtl", fontFamily: "Vazirmatn, Tahoma, sans-serif" }}>
        {/* سربرگ گزارش */}
        <div className="border-b-2 pb-3 mb-4" style={{ borderColor: "#10b981" }}>
          <h1 className="text-xl font-bold">گزارش عملکرد سایت — کنسول جستجوی فارسی</h1>
          <p className="text-xs mt-1">سایت: {siteUrl}</p>
          <p className="text-xs">
            بازه گزارش: {faJalaliDate(isoToDate(start))} تا {faJalaliDate(isoToDate(end))}
          </p>
          <p className="text-xs">تاریخ تولید: {faJalaliDate(new Date())}</p>
        </div>

        {/* امتیاز و خلاصه */}
        <div className="mb-5">
          <h2 className="font-bold text-sm mb-1">خلاصه وضعیت (امتیاز: {faNumber(data.score)} از ۱۰۰)</h2>
          <p className="text-xs leading-6">{data.summary}</p>
        </div>

        {/* معیارها */}
        <table className="w-full text-xs border-collapse mb-5">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-right">معیار</th>
              <th className="border p-2 text-right">مقدار</th>
              <th className="border p-2 text-right">تغییر نسبت به بازه قبل</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">کلیک‌ها</td>
              <td className="border p-2">{faNumber(data.totals?.clicks ?? 0)}</td>
              <td className="border p-2">
                {data.totals?.deltaClicks !== undefined ? faDelta(data.totals.deltaClicks) : "—"}
              </td>
            </tr>
            <tr>
              <td className="border p-2">نمایش‌ها</td>
              <td className="border p-2">{faNumber(data.totals?.impressions ?? 0)}</td>
              <td className="border p-2">
                {data.totals?.deltaImpressions !== undefined ? faDelta(data.totals.deltaImpressions) : "—"}
              </td>
            </tr>
            <tr>
              <td className="border p-2">نرخ کلیک</td>
              <td className="border p-2">{faPercent(data.totals?.ctr ?? 0)}</td>
              <td className="border p-2">—</td>
            </tr>
            <tr>
              <td className="border p-2">جایگاه میانگین</td>
              <td className="border p-2">{faNumber(data.totals?.position ?? 0, 1)}</td>
              <td className="border p-2">—</td>
            </tr>
          </tbody>
        </table>

        {/* نوتیفیکیشن‌ها */}
        <div>
          <h2 className="font-bold text-sm mb-2">نکات و هشدارهای مهم</h2>
          <ul className="text-xs space-y-2">
            {data.notifications.map((n) => (
              <li key={n.id} className="border-r-2 pr-2" style={{ borderColor: n.severity === "error" ? "#ef4444" : n.severity === "warning" ? "#f59e0b" : "#10b981" }}>
                <b>{n.title}:</b> {n.description}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[10px] mt-6 text-gray-500">
          این گزارش توسط کنسول جستجوی فارسی (Persian Search Console) تولید شده است.
          {data.demo && " داده‌های این گزارش در حالت نمایشی تولید شده‌اند."}
        </p>
      </div>
    </div>
  );
}

export function SiteSummaryCard() {
  const site = useAppStore((s) => s.selectedSite);
  const dateRange = useAppStore((s) => s.dateRange);
  const { toast } = useToast();
  const [printData, setPrintData] = React.useState<SummaryResponse | null>(null);

  const { data, isLoading } = useQuery<SummaryResponse>({
    queryKey: ["summary", site?.siteUrl, dateRange.start, dateRange.end],
    enabled: !!site,
    queryFn: async () => {
      const params = new URLSearchParams({
        site: site!.siteUrl,
        start: dateRange.start,
        end: dateRange.end,
      });
      const res = await fetch(`/api/summary?${params}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  // خروجی PDF: باز شدن پنجره چاپ مرورگر (ذخیره به PDF)
  function handlePrintPdf() {
    if (!data) return;
    setPrintData(data);
    // کمی تأخیر تا ناحیه چاپ رندر شود
    setTimeout(() => {
      window.print();
      // بعد از چاپ ناحیه چاپی را پاک کن
      setTimeout(() => setPrintData(null), 500);
    }, 100);
    toast({
      title: "پنجره چاپ باز شد",
      description: "برای ذخیره PDF، مقصد «Save as PDF» را انتخاب کنید.",
    });
  }

  if (isLoading || !site) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const score = data?.score ?? 0;
  const scoreColor =
    score >= 80 ? "text-emerald-600" : score >= 55 ? "text-amber-600" : "text-red-600";
  const ringColor =
    score >= 80 ? "border-emerald-400" : score >= 55 ? "border-amber-400" : "border-red-400";

  return (
    <>
      <Card className="border-primary/20 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* امتیاز سلامت */}
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center shrink-0 ${ringColor}`}
              >
                <div className="text-center">
                  <div className={`text-xl font-bold tabular-fa leading-none ${scoreColor}`}>
                    {faNumber(score)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">از ۱۰۰</div>
                </div>
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-bold text-sm mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  خلاصه وضعیت کلی سایت
                </p>
                <p className="text-xs text-muted-foreground leading-5 line-clamp-2">
                  {data?.summary}
                </p>
              </div>
            </div>

            {/* آمار سریع + دکمه PDF */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">کلیک‌ها</p>
                  <p className="text-sm font-bold tabular-fa">{faCompact(data?.totals?.clicks ?? 0)}</p>
                  {data?.totals?.deltaClicks !== undefined && (
                    <p className={`text-[10px] tabular-fa ${(data.totals.deltaClicks ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {faDelta(data.totals.deltaClicks)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">نمایش‌ها</p>
                  <p className="text-sm font-bold tabular-fa">{faCompact(data?.totals?.impressions ?? 0)}</p>
                  {data?.totals?.deltaImpressions !== undefined && (
                    <p className={`text-[10px] tabular-fa ${(data.totals.deltaImpressions ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {faDelta(data.totals.deltaImpressions)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 no-print"
                onClick={handlePrintPdf}
                title="خروجی PDF از گزارش این بازه"
              >
                <FileText className="w-4 h-4" />
                خروجی PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ناحیه چاپی (فقط هنگام چاپ دیده می‌شود) */}
      {printData && site && (
        <PrintReport
          data={printData}
          siteUrl={site.siteUrl}
          start={dateRange.start}
          end={dateRange.end}
        />
      )}
    </>
  );
}
