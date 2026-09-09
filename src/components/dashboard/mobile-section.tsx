"use client";

// ============================================================
//  بخش ۳.۴ — قابلیت استفاده در موبایل (Mobile Usability)
//  مشکلات: متن کوچک، عناصر نزدیک، محتوای عریض، viewport
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { useAppStore } from "@/store/app-store";
import { faNumber, faJalaliShort, isoToDate } from "@/lib/format";
import type { MobileResponse } from "@/lib/types";
import { Smartphone, Type, Hand, MoveHorizontal, Maximize2, Wrench, CheckCircle2 } from "lucide-react";

// آیکون هر نوع مشکل
const ISSUE_ICONS: Record<string, React.ElementType> = {
  small_text: Type,
  tap_elements: Hand,
  wide_content: MoveHorizontal,
  viewport: Maximize2,
};

function PersianTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date as string;
  return (
    <div dir="rtl" className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
      {date && <p className="font-bold">{faJalaliShort(isoToDate(date))}</p>}
      <p className="mt-1">صفحات مشکل‌دار: <b className="tabular-fa">{faNumber(payload[0].value)}</b></p>
    </div>
  );
}

export function MobileSection() {
  const site = useAppStore((s) => s.selectedSite);

  const { data, isLoading } = useQuery<MobileResponse>({
    queryKey: ["mobile", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/mobile?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const totalErrors = data?.issues.reduce((a, i) => a + i.count, 0) ?? 0;
  const allGood = totalErrors === 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<Smartphone className="w-5 h-5" />}
        title="قابلیت استفاده در موبایل"
        description="آیا سایت شما روی گوشی راحت خوانده و کلیک می‌شود؟ بیشتر بازدیدهای ایرانی با موبایل است!"
        help={{
          title: "قابلیت استفاده در موبایل چیست؟",
          body: "گوگل صفحات شما را از نظر راحتی استفاده در گوشی بررسی می‌کند: متن خوانا، دکمه‌های با فاصله مناسب و عدم اسکرول افقی.",
          example: "سایت شما مثل یک مغازه است؛ اگر قفسه‌ها تنگ و برچسب‌ها ریز باشند، مشتری با گوشی راحت خرید نمی‌کند!",
        }}
        extra={data?.demo ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">داده نمایشی</Badge> : undefined}
      />

      {/* وضعیت کلی */}
      <Card className={allGood ? "border-emerald-300 dark:border-emerald-800" : "border-amber-300 dark:border-amber-800"}>
        <CardContent className="p-5 flex items-center gap-4">
          {allGood ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-600 shrink-0" />
          ) : (
            <Smartphone className="w-12 h-12 text-amber-600 shrink-0" />
          )}
          <div>
            <p className="font-bold text-lg">
              {allGood ? "عالی! مشکلی در نسخه موبایل یافت نشد" : `${faNumber(totalErrors)} صفحه در موبایل مشکل دارد`}
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-6">
              {allGood
                ? "همه صفحات سایت شما برای نمایش در موبایل مناسب هستند. کارتان درسته!"
                : "این مشکلات باعث می‌شوند کاربران موبایلی از سایت شما راضی نباشند و زود خارج شوند — روی هر مشکل کلیک کنید تا راه‌حلش را ببینید."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* نمودار روند مشکلات */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base">روند مشکلات موبایل (۱۲ ماه اخیر)</CardTitle>
            <HelpTip title="روند مشکلات">
              تعداد صفحات مشکل‌دار در طول زمان. خط رو به پایین یعنی در حال اصلاح هستید — که خبر خوبی است!
            </HelpTip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56" dir="ltr">
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
                <Line
                  type="monotone"
                  dataKey="errors"
                  name="صفحات مشکل‌دار"
                  stroke="var(--chart-3)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* لیست مشکلات با راه‌حل */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">جزئیات مشکلات و راه‌حل‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {allGood ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              هیچ مشکلی برای نمایش وجود ندارد 🎉
            </p>
          ) : (
            <Accordion type="multiple" dir="rtl" className="space-y-2">
              {(data?.issues ?? []).map((issue, i) => {
                const Icon = ISSUE_ICONS[issue.id] ?? Smartphone;
                return (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <AccordionItem value={issue.id} className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline py-3.5">
                        <div className="flex items-center gap-3 text-start flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${issue.severity === "error" ? "bg-red-100 text-red-600 dark:bg-red-950/40" : "bg-amber-100 text-amber-600 dark:bg-amber-950/40"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm">{issue.title}</p>
                            <p className="text-xs text-muted-foreground truncate leading-5">{issue.description}</p>
                          </div>
                          <Badge variant={issue.severity === "error" ? "destructive" : "outline"} className="shrink-0 tabular-fa">
                            {faNumber(issue.count)} صفحه
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 space-y-3">
                        {/* راه‌حل */}
                        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 space-y-1.5">
                          <p className="text-xs font-bold flex items-center gap-1.5 text-primary">
                            <Wrench className="w-3.5 h-3.5" />
                            راه‌حل
                          </p>
                          <p className="text-xs leading-6 text-muted-foreground">{issue.solution}</p>
                        </div>
                        {/* صفحات مشکل‌دار */}
                        {issue.sampleUrls.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold text-muted-foreground">نمونه صفحات مشکل‌دار:</p>
                            <div className="max-h-32 overflow-y-auto rounded-lg border bg-muted/40 divide-y">
                              {issue.sampleUrls.map((u) => (
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
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
