"use client";

// ============================================================
//  بخش ۳.۶ — امنیت و اقدامات دستی (Security & Manual Actions)
//  پنالتی‌ها و مشکلات امنیتی: بدافزار، فیشینگ، هک
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { useAppStore } from "@/store/app-store";
import type { SecurityResponse } from "@/lib/types";
import {
  ShieldAlert, ShieldCheck, Wrench, Bug, Fish, FileWarning, AlertOctagon,
} from "lucide-react";

// آیکون نوع مشکل امنیتی
const SEC_ICONS: Record<string, React.ElementType> = {
  MALWARE: Bug,
  PHISHING: Fish,
  SOCIAL_ENGINEERING: Fish,
  HACKED: AlertOctagon,
};

export function SecuritySection() {
  const site = useAppStore((s) => s.selectedSite);

  const { data, isLoading } = useQuery<SecurityResponse>({
    queryKey: ["security", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/security?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const ma = data?.manualActions ?? [];
  const si = data?.securityIssues ?? [];
  const allClean = ma.length === 0 && si.length === 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<ShieldAlert className="w-5 h-5" />}
        title="امنیت و اقدامات دستی"
        description="پنالتی‌های گوگل و مشکلات امنیتی سایت — مهم‌ترین بخش برای سلامت سایت"
        help={{
          title: "امنیت و اقدامات دستی چیست؟",
          body: "«اقدام دستی» یعنی گوگل به‌صورت انسانی سایت شما را جریمه کرده (پنالتی) و «مشکلات امنیتی» یعنی سایت خطرناک است برای بازدیدکنندگان. هر دو حذف کامل نتایج شما را در بر دارند تا رفع شوند.",
          example: "مثل اخراج از مسابقه (پنالتی) یا قرنطینه سلامت (مشکل امنیتی) — تا رفع نشود، شرکت در بازی ممنوع!",
        }}
        extra={data?.demo ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">داده نمایشی</Badge> : undefined}
      />

      {/* وضعیت کلی */}
      <Card className={allClean ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"}>
        <CardContent className="p-6 flex items-center gap-4">
          {allClean ? (
            <>
              <ShieldCheck className="w-14 h-14 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">
                  آفرین! هیچ مشکلی پیدا نشد 🎉
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-6">
                  سایت شما نه پنالتی (اقدام دستی) دارد و نه مشکل امنیتی. گوگل از وضعیت فعلی شما
                  راضی است. وضعیت‌ها را به‌صورت دوره‌ای همین‌جا بررسی کنید.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertOctagon className="w-14 h-14 text-red-600 shrink-0" />
              <div>
                <p className="font-bold text-lg text-red-600">
                  هشدار! سایت شما مشکل فعال دارد
                </p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-6">
                  {ma.length > 0 && `${ma.length} اقدام دستی (پنالتی) فعال است. `}
                  {si.length > 0 && `${si.length} مشکل امنیتی شناسایی شده. `}
                  تا زمان رفع، رتبه و نمایش سایت شما به‌شدت آسیب می‌بیند. راهنمای رفع در پایین آمده است.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* اقدامات دستی (پنالتی) */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-amber-600" />
            <p className="font-bold">اقدامات دستی (پنالتی)</p>
          </div>
          {ma.length === 0 ? (
            <p className="text-sm text-muted-foreground">هیچ اقدام دستی روی سایت شما فعال نیست.</p>
          ) : (
            ma.map((action) => (
              <Alert key={action.id} variant="destructive" dir="rtl">
                <AlertOctagon className="w-4 h-4" />
                <AlertTitle>{action.title}</AlertTitle>
                <AlertDescription className="space-y-3 mt-2">
                  <p className="leading-6">{action.reason}</p>
                  <div>
                    <p className="text-xs font-bold mb-1">صفحات درگیر:</p>
                    <p className="text-xs">{action.affectedPages.join("، ")}</p>
                  </div>
                  <div className="rounded-lg bg-background/80 border p-3 space-y-1.5">
                    <p className="text-xs font-bold flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      راهنمای رفع و درخواست بازبینی
                    </p>
                    <p className="text-xs leading-6">{action.fixGuide}</p>
                  </div>
                </AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      {/* مشکلات امنیتی */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-600" />
            <p className="font-bold">مشکلات امنیتی</p>
          </div>
          {si.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              هیچ مشکل امنیتی (بدافزار، فیشینگ، هک) روی سایت شما یافت نشده.
            </p>
          ) : (
            si.map((issue) => {
              const Icon = SEC_ICONS[issue.type] ?? Bug;
              return (
                <Alert key={issue.id} variant="destructive" dir="rtl">
                  <Icon className="w-4 h-4" />
                  <AlertTitle>{issue.title}</AlertTitle>
                  <AlertDescription className="space-y-3 mt-2">
                    <p className="leading-6">{issue.details}</p>
                    <div>
                      <p className="text-xs font-bold mb-1">صفحات درگیر:</p>
                      <ul className="list-disc ps-5 text-xs font-mono" dir="ltr">
                        {issue.affectedPages.map((p) => (
                          <li key={p} className="text-start">{p}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg bg-background/80 border p-3 space-y-1.5">
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        راهنمای رفع
                      </p>
                      <p className="text-xs leading-6">
                        صفحات درگیر را فوراً پاک‌سازی یا حذف کنید، با هاست بررسی کنید هکر دسترسی
                        نداشته باشد، سپس در سرچ کنسول «درخواست بازبینی» بدهید. معمولاً چند روز تا
                        چند هفته طول می‌کشد.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
