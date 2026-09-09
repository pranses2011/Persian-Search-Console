"use client";

// ============================================================
//  نوتیفیکیشن هوشمند (بخش ۶)
//  زنگ هشدار در هدر با نکات قابل‌اقدام از داده‌های سایت
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/store/app-store";
import { faJalaliDate, isoToDate, faNumber } from "@/lib/format";
import type { SummaryResponse } from "@/lib/types";
import { Bell, Check, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

// آیکون بر اساس شدت
const SEV_ICONS = {
  info: { icon: Info, class: "text-sky-600 bg-sky-50 dark:bg-sky-950/40" },
  success: { icon: CheckCircle2, class: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
  warning: { icon: AlertTriangle, class: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
  error: { icon: XCircle, class: "text-red-600 bg-red-50 dark:bg-red-950/40" },
};

export function NotificationsBell() {
  const site = useAppStore((s) => s.selectedSite);
  const dateRange = useAppStore((s) => s.dateRange);
  const notifRead = useAppStore((s) => s.notifRead);
  const setNotifRead = useAppStore((s) => s.setNotifRead);
  const [open, setOpen] = React.useState(false);

  // نوتیفیکیشن فقط در داشبورد معنا دارد
  const enabled = !!site;

  const { data } = useQuery<SummaryResponse>({
    queryKey: ["summary", site?.siteUrl, dateRange.start, dateRange.end],
    enabled,
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

  const notifications = data?.notifications ?? [];
  const unread = notifRead ? 0 : notifications.length;

  // باز شدن پاپ‌اور نوتیفیکیشن‌ها را خوانده شده علامت می‌زند
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setTimeout(() => setNotifRead(true), 1500);
  }

  if (!site) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 rounded-full"
          title="نوتیفیکیشن‌های هوشمند"
          aria-label="نوتیفیکیشن‌ها"
        >
          <Bell className="h-4.5 w-4.5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center px-1 font-bold tabular-fa">
              {faNumber(unread)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0" dir="rtl">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-bold text-sm flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-primary" />
            نوتیفیکیشن‌های هوشمند
          </p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1" onClick={() => setNotifRead(true)}>
              <Check className="w-3 h-3" />
              علامت‌گذاری خوانده‌شده
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                فعلاً نوتیفیکیشنی نیست — همه چیز مرتب است!
              </p>
            ) : (
              notifications.map((n) => {
                const meta = SEV_ICONS[n.severity];
                return (
                  <div key={n.id} className="flex items-start gap-3 p-3.5 hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.class}`}>
                      <meta.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-5">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-5 mt-0.5">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1 tabular-fa">
                        {faJalaliDate(isoToDate(n.date))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {data && (
          <div className="p-3 border-t bg-muted/40 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">امتیاز سلامت کلی:</span>
            <Badge
              className={
                data.score >= 80
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : data.score >= 55
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }
              variant="secondary"
            >
              {faNumber(data.score)} از ۱۰۰
            </Badge>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
