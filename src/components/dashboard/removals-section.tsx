"use client";

// ============================================================
//  بخش ۳.۱۰ — حذف موقت URLها (Removals)
//  لیست درخواست‌ها + ارسال درخواست جدید + لغو
// ============================================================

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { faJalaliDate, isoToDate } from "@/lib/format";
import type { RemovalItem } from "@/lib/types";
import { Trash2, Plus, XCircle, Loader2, Clock, CheckCircle2, AlertTriangle, Hourglass } from "lucide-react";

// برچسب و بج وضعیت درخواست
const STATUS_META: Record<RemovalItem["status"], { label: string; badge: string; icon: React.ElementType }> = {
  PENDING: { label: "در انتظار بررسی", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Hourglass },
  PROCESSING: { label: "در حال پردازش", badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", icon: Clock },
  EXPIRED: { label: "منقضی شده", badge: "bg-muted text-muted-foreground", icon: AlertTriangle },
  CANCELED: { label: "لغو شده", badge: "bg-muted text-muted-foreground", icon: XCircle },
};

// برچسب نوع درخواست
const TYPE_FA: Record<RemovalItem["type"], string> = {
  REMOVE_SINGLE_URL: "حذف یک آدرس",
  REMOVE_PREFIX: "حذف با پیشوند (پوشه)",
  CLEAR_CACHE_90DAYS: "پاک‌سازی کش ۹۰ روزه",
};

export function RemovalsSection() {
  const site = useAppStore((s) => s.selectedSite);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // فرم درخواست جدید
  const [url, setUrl] = React.useState("");
  const [type, setType] = React.useState<RemovalItem["type"]>("REMOVE_SINGLE_URL");
  const [submitting, setSubmitting] = React.useState(false);

  // واکشی لیست
  const { data, isLoading } = useQuery<{ items: RemovalItem[]; demo: boolean }>({
    queryKey: ["removals", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/removals?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  // ثبت درخواست حذف جدید
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = url.trim();
    if (!clean) {
      toast({ title: "آدرس صفحه را وارد کنید", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/removals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: site!.siteUrl, url: clean, type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({
        title: "درخواست حذف ثبت شد",
        description: "حدود ۲۴ ساعت طول می‌کشد تا اعمال شود و حدود ۹۰ روز معتبر است.",
      });
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["removals", site?.siteUrl] });
    } catch (err) {
      toast({
        title: "خطا در ثبت درخواست",
        description: err instanceof Error ? err.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // لغو درخواست
  async function handleCancel(item: RemovalItem) {
    try {
      const res = await fetch(
        `/api/removals?site=${encodeURIComponent(site!.siteUrl)}&url=${encodeURIComponent(item.url)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "درخواست لغو شد" });
      queryClient.invalidateQueries({ queryKey: ["removals", site?.siteUrl] });
    } catch (err) {
      toast({
        title: "خطا در لغو",
        description: err instanceof Error ? err.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<Trash2 className="w-5 h-5" />}
        title="حذف موقت URLها (Removals)"
        description="پنهان‌سازی موقت صفحات از نتایج گوگل — ابکری برای مواقع اضطراری"
        help={{
          title: "حذف موقت چیست؟",
          body: "اگر محتوایی فاش شده که نباید عمومی باشد (مثل اطلاعات شخصی)، با این ابزار سریع از نتایج گوگل پنهانش می‌کنید تا فرصت اصلاح دائمی پیدا کنید. حداکثر ۹۰ روز اعتبار دارد.",
          example: "مثل برچسب «موقتاً تعطیل» روی در مغازه — مشکل اصلی را باید جداگانه حل کنید!",
        }}
        extra={data?.demo ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">داده نمایشی</Badge> : undefined}
      />

      {/* فرم درخواست جدید */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            درخواست حذف جدید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-[1fr_200px_auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">آدرس صفحه</Label>
              <Input
                dir="ltr"
                placeholder="مثال: /private-page یا https://example.ir/private"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-10 text-sm text-start font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نوع درخواست</Label>
              <Select value={type} onValueChange={(v) => setType(v as RemovalItem["type"])} dir="rtl">
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMOVE_SINGLE_URL">حذف یک آدرس</SelectItem>
                  <SelectItem value="REMOVE_PREFIX">حذف با پیشوند (پوشه)</SelectItem>
                  <SelectItem value="CLEAR_CACHE_90DAYS">پاک‌سازی کش ۹۰ روزه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="h-10 gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              ثبت درخواست
            </Button>
          </form>
          <p className="text-[11px] text-muted-foreground mt-3 leading-5">
            ⚠️ حذف موقت فقط «مؤقت» است؛ برای حذف دائمی از گوگل باید صفحه واقعاً حذف شود یا
            noindex بگیرد.
          </p>
        </CardContent>
      </Card>

      {/* لیست درخواست‌ها */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">درخواست‌های فعلی و گذشته</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : (data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              درخواست حذفی ثبت نشده است.
            </p>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">آدرس</TableHead>
                    <TableHead className="text-xs">نوع</TableHead>
                    <TableHead className="text-xs">وضعیت</TableHead>
                    <TableHead className="text-xs">تاریخ درخواست</TableHead>
                    <TableHead className="text-xs">انقضا</TableHead>
                    <TableHead className="text-xs text-center">لغو</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.items.map((item) => {
                    const meta = STATUS_META[item.status];
                    return (
                      <TableRow key={item.url + item.requestedAt} className="text-sm">
                        <TableCell dir="ltr" className="text-start font-mono text-xs max-w-52 truncate" title={item.url}>
                          {item.url}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{TYPE_FA[item.type]}</TableCell>
                        <TableCell>
                          <Badge className={`text-[11px] gap-1 ${meta.badge} hover:${meta.badge}`}>
                            <meta.icon className="w-3 h-3" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs tabular-fa whitespace-nowrap">
                          {faJalaliDate(isoToDate(item.requestedAt), { withYear: true })}
                        </TableCell>
                        <TableCell className="text-xs tabular-fa whitespace-nowrap">
                          {faJalaliDate(isoToDate(item.expiresAt), { withYear: true })}
                        </TableCell>
                        <TableCell className="text-center">
                          {(item.status === "PENDING" || item.status === "PROCESSING") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="لغو این درخواست"
                              onClick={() => handleCancel(item)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
