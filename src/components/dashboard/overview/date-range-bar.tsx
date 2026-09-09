"use client";

// ============================================================
//  نوار انتخاب بازه زمانی
//  ۷ روز، ۲۸ روز، ۳ ماه، ۶ ماه، ۱۲ ماه، ۱۶ ماه و بازه سفارشی
// ============================================================

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarRange, Check } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { faJalaliShort, isoToDate } from "@/lib/format";

// تعریف بازه‌های پیش‌فرض
const PRESETS = [
  { id: "7d", label: "۷ روز", days: 7 },
  { id: "28d", label: "۲۸ روز", days: 28 },
  { id: "3m", label: "۳ ماه", days: 90 },
  { id: "6m", label: "۶ ماه", days: 182 },
  { id: "12m", label: "۱۲ ماه", days: 365 },
  { id: "16m", label: "۱۶ ماه", days: 486 },
] as const;

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DateRangeBar() {
  const { dateRange, setDateRange, compare, setCompare } = useAppStore();
  const [customOpen, setCustomOpen] = React.useState(false);
  const [customStart, setCustomStart] = React.useState(dateRange.start);
  const [customEnd, setCustomEnd] = React.useState(dateRange.end);

  // اعمال بازه پیش‌فرض
  function applyPreset(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const end = new Date();
    end.setDate(end.getDate() - 1); // داده سرچ کنسول تا دیروز کامل است
    const start = new Date();
    start.setDate(start.getDate() - preset.days);
    setDateRange({ preset: presetId as any, start: iso(start), end: iso(end) });
  }

  // اعمال بازه سفارشی
  function applyCustom() {
    if (!customStart || !customEnd || customStart > customEnd) return;
    setDateRange({ preset: "custom", start: customStart, end: customEnd });
    setCustomOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs
        value={dateRange.preset === "custom" ? "custom" : dateRange.preset}
        onValueChange={(v) => (v === "custom" ? setCustomOpen(true) : applyPreset(v))}
      >
        <TabsList className="h-9 flex-wrap">
          {PRESETS.map((p) => (
            <TabsTrigger key={p.id} value={p.id} className="text-xs px-3 h-7">
              {p.label}
            </TabsTrigger>
          ))}
          {/* بازه سفارشی */}
          <Popover open={customOpen} onOpenChange={setCustomOpen} dir="rtl">
            <PopoverTrigger asChild>
              <TabsTrigger value="custom" className="text-xs px-3 h-7 gap-1.5">
                <CalendarRange className="w-3.5 h-3.5" />
                سفارشی
              </TabsTrigger>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-3">
                <p className="font-bold text-sm">انتخاب بازه دلخواه</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">از تاریخ</Label>
                    <Input
                      type="date"
                      value={customStart}
                      max={customEnd}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="h-9 text-xs"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {customStart ? faJalaliShort(isoToDate(customStart)) : "—"}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">تا تاریخ</Label>
                    <Input
                      type="date"
                      value={customEnd}
                      min={customStart}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="h-9 text-xs"
                      dir="ltr"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {customEnd ? faJalaliShort(isoToDate(customEnd)) : "—"}
                    </p>
                  </div>
                </div>
                <Button onClick={applyCustom} className="w-full gap-1.5" size="sm">
                  <Check className="w-4 h-4" />
                  اعمال بازه
                </Button>
                <p className="text-[10px] text-muted-foreground leading-5">
                  تاریخ‌ها میلادی نمایش داده می‌شوند اما در گزارش‌ها با تاریخ شمسی نمایش خواهند شد.
                  حداکثر ۱۶ ماه گذشته قابل انتخاب است.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </TabsList>
      </Tabs>

      {/* کلید مقایسه با بازه قبلی (بخش ۶) */}
      <Button
        variant={compare ? "default" : "outline"}
        size="sm"
        className="h-9 gap-1.5 text-xs"
        onClick={() => setCompare(!compare)}
        title="مقایسه این بازه با بازه قبلی هم‌اندازه"
      >
        مقایسه با بازه قبل
      </Button>
    </div>
  );
}
