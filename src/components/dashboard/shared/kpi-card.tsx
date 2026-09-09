"use client";

// ============================================================
//  کارت معیار کلیدی (KPI) — با آیکون، رنگ، روند و راهنما
//  نمایش درصد تغییرات هنگام فعال بودن حالت مقایسه (بخش ۶)
// ============================================================

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTip } from "./help-tip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { faDelta } from "@/lib/format";

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  // رنگ تاکیدی (کلاس tailwind)
  iconClass?: string;
  help: { title: string; body: React.ReactNode; example?: string };
  // درصد تغییرات نسبت به بازه قبلی (اختیاری)
  delta?: number;
  // برای معیارهای «کمتر بهتر است» مثل جایگاه
  invertDelta?: boolean;
  loading?: boolean;
}

export function KpiCard({
  title,
  value,
  icon,
  iconClass = "bg-primary/10 text-primary",
  help,
  delta,
  invertDelta = false,
  loading = false,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  // محاسبه جهت تغییر: مثبت خوب یا بد؟
  let trend: "up" | "down" | "flat" = "flat";
  let good = false;
  if (delta !== undefined && isFinite(delta) && delta !== 0) {
    trend = delta > 0 ? "up" : "down";
    good = invertDelta ? delta < 0 : delta > 0;
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
              {icon}
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <HelpTip title={help.title} example={help.example}>
            {help.body}
          </HelpTip>
        </div>

        {/* مقدار اصلی */}
        <div className="text-2xl font-bold tabular-fa">{value}</div>

        {/* درصد تغییرات نسبت به بازه قبل */}
        {delta !== undefined && isFinite(delta) && (
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {trend === "up" ? (
              <TrendingUp className={`w-3.5 h-3.5 ${good ? "text-emerald-600" : "text-red-500"}`} />
            ) : trend === "down" ? (
              <TrendingDown className={`w-3.5 h-3.5 ${good ? "text-emerald-600" : "text-red-500"}`} />
            ) : (
              <Minus className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className={good ? "text-emerald-600" : "text-red-500"}>{faDelta(delta)}</span>
            <span className="text-muted-foreground">نسبت به بازه قبلی</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
