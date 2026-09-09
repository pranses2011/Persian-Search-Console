"use client";

// ============================================================
//  نمودار خطی تعاملی عملکرد جستجو (بخش ۳.۱)
//  ۴ معیار با کلید فعال/غیرفعال + tooltip فارسی + رنگ مجزا
// ============================================================

import * as React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  YAxis,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { faNumber, faPercent, faJalaliShort, isoToDate } from "@/lib/format";
import type { DailyRow } from "@/lib/types";
import { MousePointerClick, Eye, Percent, Trophy } from "lucide-react";

// تعریف معیارها: نام، رنگ، آیکون، فعال پیش‌فرض
const METRICS = [
  { id: "clicks", label: "کلیک‌ها", color: "var(--chart-1)", active: true },
  { id: "impressions", label: "نمایش‌ها", color: "var(--chart-2)", active: true },
  { id: "ctr", label: "نرخ کلیک (CTR)", color: "var(--chart-3)", active: false },
  { id: "position", label: "جایگاه میانگین", color: "var(--chart-4)", active: false },
] as const;

type MetricId = (typeof METRICS)[number]["id"];

// tooltip فارسی سفارشی
function PersianTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date as string;
  return (
    <div
      dir="rtl"
      className="rounded-lg border bg-popover px-3 py-2.5 text-xs shadow-xl space-y-1.5"
    >
      <p className="font-bold">{date ? faJalaliShort(isoToDate(date)) : label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}:
          </span>
          <span className="font-bold tabular-fa">
            {p.dataKey === "ctr"
              ? faPercent(p.value)
              : p.dataKey === "position"
                ? faNumber(p.value, 1)
                : faNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface PerformanceChartProps {
  data: DailyRow[];
  loading?: boolean;
}

export function PerformanceChart({ data, loading }: PerformanceChartProps) {
  // وضعیت فعال بودن هر معیار
  const [metrics, setMetrics] = React.useState<{ id: MetricId; active: boolean }[]>(
    METRICS.map((m) => ({ id: m.id, active: m.active }))
  );

  const toggle = (id: MetricId) =>
    setMetrics((ms) =>
      // حداقل یک معیار باید فعال بماند
      ms.filter((m) => m.active).length > 1 || !ms.find((m) => m.id === id)?.active
        ? ms.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
        : ms
    );

  const activeMetrics = metrics.filter((m) => m.active);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base">روند عملکرد در گوگل</CardTitle>
            <HelpTip
              title="نمودار روند عملکرد"
              example="مثل نمودار دمای هوا در طول ماه — بالا رفتن خط یعنی وضعیت بهتر، پایین اومدن یعنی افت."
            >
              این نمودار نشان می‌دهد عملکرد سایت شما در طول زمان چطور تغییر کرده. با کلیک روی
              نام هر معیار بالای نمودار، می‌توانید آن را روشن یا خاموش کنید.
            </HelpTip>
          </div>
        </div>

        {/* کلیدهای فعال/غیرفعال کردن معیارها */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {METRICS.map((m) => {
            const state = metrics.find((x) => x.id === m.id)!;
            return (
              <Button
                key={m.id}
                size="sm"
                variant={state.active ? "default" : "outline"}
                className="h-7 text-xs gap-1.5 rounded-full px-3 transition-all"
                style={
                  state.active
                    ? { backgroundColor: m.color, color: "white", borderColor: m.color }
                    : { color: "var(--muted-foreground)" }
                }
                onClick={() => toggle(m.id)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border"
                  style={{ backgroundColor: state.active ? "white" : m.color }}
                />
                {m.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 w-full flex items-center justify-center text-muted-foreground text-sm animate-pulse-soft">
            در حال بارگذاری نمودار...
          </div>
        ) : data.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Eye className="w-8 h-8 opacity-40" />
            <p className="text-sm">در این بازه داده‌ای ثبت نشده است</p>
          </div>
        ) : (
          <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => faJalaliShort(isoToDate(v)).slice(3)}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                  stroke="var(--muted-foreground)"
                />
                {/* محور راست برای جایگاه (معکوس: پایین خوب است) */}
                {activeMetrics.some((m) => m.id === "position") && (
                  <YAxis
                    yAxisId="position"
                    orientation="right"
                    reversed
                    tick={{ fontSize: 10 }}
                    stroke="var(--chart-4)"
                    tickFormatter={(v: number) => faNumber(v)}
                    label={{
                      value: "جایگاه",
                      angle: 90,
                      position: "insideRight",
                      style: { fontSize: 10, fill: "var(--muted-foreground)" },
                    }}
                  />
                )}
                {/* محور اصلی کلیک/نمایش */}
                <YAxis
                  yAxisId="main"
                  tick={{ fontSize: 10 }}
                  stroke="var(--muted-foreground)"
                  tickFormatter={(v: number) => (v >= 1000 ? faNumber(Math.round(v / 1000)) + "ه" : faNumber(v))}
                  width={50}
                />
                <Tooltip content={<PersianTooltip />} />
                {activeMetrics.map((m) => {
                  const metric = METRICS.find((x) => x.id === m.id)!;
                  if (m.id === "clicks") {
                    return (
                      <Area
                        key={m.id}
                        yAxisId="main"
                        type="monotone"
                        dataKey="clicks"
                        name="کلیک‌ها"
                        stroke={metric.color}
                        fill={metric.color}
                        fillOpacity={0.12}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    );
                  }
                  return (
                    <Line
                      key={m.id}
                      yAxisId={m.id === "position" ? "position" : "main"}
                      type="monotone"
                      dataKey={m.id}
                      name={metric.label}
                      stroke={metric.color}
                      strokeWidth={2}
                      strokeDasharray={m.id === "ctr" || m.id === "position" ? "5 3" : undefined}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  );
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
