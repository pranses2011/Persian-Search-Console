"use client";

// ============================================================
//  بخش ۳.۵ — نقشه‌های سایت (Sitemaps)
//  لیست + ارسال + حذف نقشه سایت
// ============================================================

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { faNumber, faJalaliDate, isoToDate } from "@/lib/format";
import type { SitemapItem } from "@/lib/types";
import { Map, Send, Trash2, CheckCircle2, AlertTriangle, Clock, Loader2, Globe } from "lucide-react";

// وضعیت پردازش نقشه سایت
function SitemapStatus({ s }: { s: SitemapItem }) {
  if (s.isPending) {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] text-sky-600 border-sky-300">
        <Clock className="w-3 h-3" />
        در انتظار پردازش
      </Badge>
    );
  }
  if ((s.errors ?? 0) > 0) {
    return (
      <Badge variant="destructive" className="gap-1 text-[11px]">
        <AlertTriangle className="w-3 h-3" />
        خطا در {faNumber(s.errors ?? 0)} آدرس
      </Badge>
    );
  }
  if ((s.warnings ?? 0) > 0) {
    return (
      <Badge variant="outline" className="gap-1 text-[11px] text-amber-600 border-amber-300">
        <AlertTriangle className="w-3 h-3" />
        {faNumber(s.warnings ?? 0)} هشدار
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 text-[11px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300">
      <CheckCircle2 className="w-3 h-3" />
      موفق
    </Badge>
  );
}

export function SitemapsSection() {
  const site = useAppStore((s) => s.selectedSite);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // فرم ارسال نقشه جدید
  const [feedpath, setFeedpath] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  // واکشی لیست
  const { data, isLoading } = useQuery<{ sitemaps: SitemapItem[]; demo: boolean }>({
    queryKey: ["sitemaps", site?.siteUrl],
    enabled: !!site,
    queryFn: async () => {
      const res = await fetch(`/api/sitemaps?site=${encodeURIComponent(site!.siteUrl)}`);
      if (!res.ok) throw new Error("خطا");
      return res.json();
    },
  });

  // ارسال نقشه سایت جدید
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = feedpath.trim();
    if (!clean) {
      toast({ title: "آدرس نقشه سایت را وارد کنید", variant: "destructive" });
      return;
    }
    if (!clean.startsWith("http") || !clean.endsWith(".xml")) {
      toast({
        title: "آدرس نامعتبر است",
        description: "آدرس باید کامل و با پسوند xml باشد — مثال: https://example.ir/sitemap.xml",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sitemaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: site!.siteUrl, feedpath: clean }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({
        title: "نقشه سایت ارسال شد",
        description: "گوگل آن را بررسی می‌کند؛ وضعیتش به‌زودی مشخص می‌شود.",
      });
      setFeedpath("");
      queryClient.invalidateQueries({ queryKey: ["sitemaps", site?.siteUrl] });
    } catch (err) {
      toast({
        title: "خطا در ارسال",
        description: err instanceof Error ? err.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // حذف نقشه سایت
  async function handleDelete(path: string) {
    setDeleting(path);
    try {
      const res = await fetch(
        `/api/sitemaps?site=${encodeURIComponent(site!.siteUrl)}&feedpath=${encodeURIComponent(path)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: "نقشه سایت حذف شد" });
      queryClient.invalidateQueries({ queryKey: ["sitemaps", site?.siteUrl] });
    } catch (err) {
      toast({
        title: "خطا در حذف",
        description: err instanceof Error ? err.message : "دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<Map className="w-5 h-5" />}
        title="نقشه‌های سایت (Sitemap)"
        description="فایل‌هایی که همه صفحات مهم سایت را به گوگل معرفی می‌کنند"
        help={{
          title: "نقشه سایت چیست؟",
          body: "فایلی XML که فهرست صفحات سایت شماست. گوگل با کمک آن سریع‌تر و کامل‌تر صفحات شما را پیدا و ایندکس می‌کند. برای سایت‌های بزرگ یا تازه‌تأسیس خیلی مهم است.",
          example: "مثل فهرست مطالب یک کتاب: به گوگل می‌گوید «صفحات من اینها هستند، بیا بخوانشان».",
        }}
        extra={data?.demo ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">داده نمایشی</Badge> : undefined}
      />

      {/* فرم ارسال نقشه جدید */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            ارسال نقشه سایت جدید
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                dir="ltr"
                placeholder={site ? `https://${site.displayName}/sitemap.xml` : "https://example.ir/sitemap.xml"}
                value={feedpath}
                onChange={(e) => setFeedpath(e.target.value)}
                className="ps-9 h-11 text-sm text-start font-mono"
              />
            </div>
            <Button type="submit" className="h-11 px-6 gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              ارسال به گوگل
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* لیست نقشه‌های سایت */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">نقشه‌های ثبت‌شده ({faNumber(data?.sitemaps.length ?? 0)})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : (data?.sitemaps.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              هنوز نقشه سایتی ثبت نشده است — اولین مورد را از فرم بالا ارسال کنید.
            </p>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">آدرس نقشه</TableHead>
                    <TableHead className="text-xs">آخرین ارسال</TableHead>
                    <TableHead className="text-xs">آخرین دانلود</TableHead>
                    <TableHead className="text-xs">وضعیت</TableHead>
                    <TableHead className="text-xs">تعداد آدرس</TableHead>
                    <TableHead className="text-xs text-center">حذف</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.sitemaps.map((s) => (
                    <TableRow key={s.path} className="text-sm">
                      <TableCell dir="ltr" className="text-start font-mono text-xs max-w-56 truncate" title={s.path}>
                        {s.path}
                      </TableCell>
                      <TableCell className="text-xs tabular-fa whitespace-nowrap">
                        {s.lastSubmitted ? faJalaliDate(isoToDate(s.lastSubmitted), { withYear: true }) : "—"}
                      </TableCell>
                      <TableCell className="text-xs tabular-fa whitespace-nowrap">
                        {s.lastDownloaded ? faJalaliDate(isoToDate(s.lastDownloaded), { withYear: true }) : "—"}
                      </TableCell>
                      <TableCell>
                        <SitemapStatus s={s} />
                      </TableCell>
                      <TableCell className="text-xs tabular-fa font-bold">
                        {s.urlCount !== null ? faNumber(s.urlCount) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="حذف این نقشه سایت"
                              disabled={deleting === s.path}
                            >
                              {deleting === s.path ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف نقشه سایت؟</AlertDialogTitle>
                              <AlertDialogDescription dir="rtl" className="leading-6">
                                این کار فقط نقشه <span dir="ltr" className="font-mono text-xs">{s.path}</span> را از
                                گوگل حذف می‌کند؛ صفحات سایت شما حذف نمی‌شوند و ایندکس‌ها باقی می‌مانند.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row gap-2">
                              <AlertDialogAction className="flex-1">انصراف</AlertDialogAction>
                              <AlertDialogAction
                                onClick={() => handleDelete(s.path)}
                                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                بله، حذف کن
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
