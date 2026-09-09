"use client";

// ============================================================
//  پنل فیلترهای پیشرفته عملکرد جستجو (بخش ۳.۱)
//  فیلتر کلمه کلیدی، صفحه، کشور، دستگاه، نوع جستجو + ترکیب فیلترها
// ============================================================

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { useAppStore } from "@/store/app-store";
import { Filter, X, RotateCcw } from "lucide-react";
import type { PerformanceFilters } from "@/lib/types";

const COUNTRIES = ["ایران", "ایالات متحده", "آلمان", "کانادا", "امارات متحده عربی", "ترکیه", "بریتانیا"];
const DEVICES = ["موبایل", "دسکتاپ", "تبلت"];
const APPEARANCES = ["نتایج وب", "نتایج تصویری", "نتایج ویدیویی", "نتایج خبری", "گوگل دیسکاور"];

export function AdvancedFilters() {
  const { filters, setFilters } = useAppStore();
  const [local, setLocal] = React.useState<PerformanceFilters>(filters);

  // همگام‌سازی با استور
  React.useEffect(() => setLocal(filters), [filters]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  // اعمال فیلترها (ترکیب چند فیلتر)
  function apply() {
    setFilters({
      query: local.query?.trim() || undefined,
      page: local.page?.trim() || undefined,
      country: local.country || undefined,
      device: local.device || undefined,
      searchAppearance: local.searchAppearance || undefined,
    });
  }

  // پاک‌کردن همه فیلترها
  function reset() {
    setLocal({});
    setFilters({});
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              فیلترهای پیشرفته
            </CardTitle>
            <HelpTip
              title="فیلترهای پیشرفته"
              example="مثل قلاب‌های جستجو در دیجی‌کالا: فقط کفش نایکی، فقط سایز ۴۲، فقط رنگ مشکی."
            >
              داده‌ها را محدود کنید تا فقط بخش مورد نظرتان را ببینید. مثلاً فقط بازدید‌های
              موبایلی از کشور ایران. چند فیلتر با هم ترکیب می‌شوند.
            </HelpTip>
          </div>
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="text-[11px]">
                {activeCount} فیلتر فعال
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={reset}
              >
                <RotateCcw className="w-3 h-3" />
                حذف همه
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">کلمه کلیدی شامل</Label>
            <Input
              dir="rtl"
              placeholder="مثلاً: گوشی"
              value={local.query ?? ""}
              onChange={(e) => setLocal({ ...local, query: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">صفحه شامل</Label>
            <Input
              dir="ltr"
              placeholder="مثلاً: /blog/"
              value={local.page ?? ""}
              onChange={(e) => setLocal({ ...local, page: e.target.value })}
              className="h-9 text-sm text-start"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">کشور</Label>
            <Select
              value={local.country ?? "all"}
              onValueChange={(v) => setLocal({ ...local, country: v === "all" ? undefined : v })}
              dir="rtl"
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="همه کشورها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه کشورها</SelectItem>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">دستگاه</Label>
            <Select
              value={local.device ?? "all"}
              onValueChange={(v) => setLocal({ ...local, device: v === "all" ? undefined : v })}
              dir="rtl"
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="همه دستگاه‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دستگاه‌ها</SelectItem>
                {DEVICES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">نوع نمایش در جستجو</Label>
            <Select
              value={local.searchAppearance ?? "all"}
              onValueChange={(v) => setLocal({ ...local, searchAppearance: v === "all" ? undefined : v })}
              dir="rtl"
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="همه انواع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                {APPEARANCES.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={apply} className="h-9 flex-1 gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              اعمال فیلترها
            </Button>
            {activeCount > 0 && (
              <Button
                variant="outline"
                onClick={reset}
                className="h-9 gap-1"
                title="حذف همه فیلترها"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
