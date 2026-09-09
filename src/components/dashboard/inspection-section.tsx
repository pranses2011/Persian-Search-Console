"use client";

// ============================================================
//  بخش ۳.۲ — بازرسی URL (URL Inspection)
//  ورودی آدرس + نمایش وضعیت با آیکون رنگی و راهنمای فارسی
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionHeader } from "@/components/dashboard/shared/section-header";
import { HelpTip } from "@/components/dashboard/shared/help-tip";
import { useAppStore } from "@/store/app-store";
import { faJalaliDate, isoToDate, toFaDigits } from "@/lib/format";
import type { InspectionResult } from "@/lib/types";
import {
  SearchCheck, Search, CheckCircle2, AlertTriangle, XCircle, Info,
  Smartphone, FileCode2, Link2, Map, Sparkles, Zap, Loader2, Clock,
} from "lucide-react";
import { INDEX_STATUS_FA } from "@/lib/mock-sections";

// ردیف وضعیت با آیکون رنگی
function StatusRow({
  icon: Icon,
  label,
  value,
  state,
  help,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  state: "good" | "warning" | "error" | "info" | "neutral";
  help: { title: string; body: React.ReactNode; example?: string };
}) {
  const colors = {
    good: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
    error: "text-red-600 bg-red-50 dark:bg-red-950/40",
    info: "text-sky-600 bg-sky-50 dark:bg-sky-950/40",
    neutral: "text-muted-foreground bg-muted",
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl border">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors[state]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{label}</span>
            <HelpTip title={help.title} example={help.example}>
              {help.body}
            </HelpTip>
          </div>
        </div>
      </div>
      <div className="text-sm font-bold shrink-0 text-end">{value}</div>
    </div>
  );
}

export function InspectionSection() {
  const site = useAppStore((s) => s.selectedSite);
  const [url, setUrl] = React.useState("");
  const [submittedUrl, setSubmittedUrl] = React.useState("");
  const [error, setError] = React.useState("");

  // کوئری بازرسی
  const { data, isLoading, isFetching } = useQuery<InspectionResult>({
    queryKey: ["inspection", site?.siteUrl, submittedUrl],
    enabled: !!submittedUrl,
    queryFn: async () => {
      const params = new URLSearchParams({ site: site!.siteUrl, url: submittedUrl });
      const res = await fetch(`/api/inspection?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "خطا در بازرسی");
      return json;
    },
    retry: false,
  });

  // اجرای بازرسی
  function inspect(e: React.FormEvent) {
    e.preventDefault();
    const clean = url.trim();
    if (!clean) {
      setError("لطفاً آدرس صفحه را وارد کنید");
      return;
    }
    if (!clean.startsWith("http") && !clean.startsWith("/")) {
      setError("آدرس باید با http یا / شروع شود — مثال: /blog/seo-guide");
      return;
    }
    setError("");
    setSubmittedUrl(clean);
  }

  const status = data ? INDEX_STATUS_FA[data.indexStatus] : null;

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        icon={<SearchCheck className="w-5 h-5" />}
        title="بازرسی URL"
        description="وضعیت هر صفحه از نظر گوگل را بررسی کنید — آیا ایندکس شده؟ آخرین بار کی خوانده شده؟"
        help={{
          title: "بازرسی URL چیست؟",
          body: "مثل پرونده پزشکی برای هر صفحه! وارد می‌کنید و گوگل وضعیت کامل آن صفحه را نشان می‌دهد: ایندکس شده یا نه، چه زمانی خوانده شده، در موبایل درست نمایش داده می‌شود و...",
          example: "مثل وقتی که شماره مرسوله پستی را در سایت پست وارد می‌کنید تا وضعیت آن را ببینید.",
        }}
      />

      {/* فرم ورودی آدرس */}
      <Card>
        <CardContent className="p-5">
          <form onSubmit={inspect} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                dir="ltr"
                placeholder={site ? `مثال: https://${site.displayName}/blog/seo-guide` : "https://example.ir/page"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="ps-9 h-11 text-sm text-start font-mono"
              />
            </div>
            <Button type="submit" className="h-11 px-6 gap-2" disabled={isFetching}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchCheck className="w-4 h-4" />}
              بررسی وضعیت
            </Button>
          </form>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-3 leading-5">
            آدرس دقیق همان صفحه را وارد کنید. می‌توانید مسیر نسبی مثل <span dir="ltr">/blog/post-1</span> هم بنویسید.
          </p>
        </CardContent>
      </Card>

      {/* خطای کوئری */}
      {error === "" && data === undefined && submittedUrl && isLoading === false && (
        <Alert variant="destructive">
          <XCircle className="w-4 h-4" />
          <AlertTitle>بازرسی ناموفق بود</AlertTitle>
          <AlertDescription>آدرس را بررسی کنید و دوباره تلاش کنید.</AlertDescription>
        </Alert>
      )}

      {/* اسکلتون لودینگ */}
      {isLoading && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-8 w-64" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* نتیجه بازرسی */}
      <AnimatePresence mode="wait">
        {data && !isLoading && (
          <motion.div
            key={data.url}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {/* خلاصه وضعیت کلی */}
            <Card className={status?.severity === "good" ? "border-emerald-300 dark:border-emerald-800" : ""}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {status?.severity === "good" ? (
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 shrink-0" />
                    ) : status?.severity === "error" ? (
                      <XCircle className="w-10 h-10 text-red-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-amber-600 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-lg">{status?.label}</p>
                      <p dir="ltr" className="text-xs text-muted-foreground truncate text-start font-mono">
                        {data.url}
                      </p>
                    </div>
                  </div>
                  {data.demo && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                      داده نمایشی
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* جزئیات وضعیت */}
            <div className="grid md:grid-cols-2 gap-3">
              <StatusRow
                icon={FileCode2}
                label="وضعیت ایندکس"
                value={status?.label ?? "—"}
                state={status?.severity === "good" ? "good" : status?.severity === "info" ? "info" : status?.severity === "warning" ? "warning" : "error"}
                help={{
                  title: "وضعیت ایندکس",
                  body: "آیا این صفحه در بانک اطلاعاتی گوگل ثبت شده یا نه؟ ثبت‌شده یعنی شانس نمایش در نتایج جستجو را دارد.",
                  example: "مثل ثبت‌نام در یک مسابقه: ثبت‌شده = شرکت می‌کند؛ ثبت‌نشده = اصلاً در لیست بازی نیست.",
                }}
              />
              <StatusRow
                icon={Clock}
                label="آخرین خزش گوگل"
                value={data.lastCrawl ? faJalaliDate(isoToDate(data.lastCrawl)) : "هنوز خزش نشده"}
                state={data.lastCrawl ? "info" : "warning"}
                help={{
                  title: "خزش (Crawl) چیست؟",
                  body: "روبات گوگل مثل بازرس، صفحه را می‌خواند و تاریخ آخرین بازرسی را ثبت می‌کند. صفحات پرطرفدار بیشتر خوانده می‌شوند.",
                  example: "مثل ناظم مدرسه که هر از چندی سر کلاس را می‌زند؛ هرچه کلاس مهم‌تر، سر زدن بیشتر!",
                }}
              />
              <StatusRow
                icon={Link2}
                label="روش ایندکس"
                value={
                  data.indexingMethod === "USER_SELECTED_CANONICAL"
                    ? "کانونیکال شما"
                    : data.indexingMethod === "GOOGLE_SELECTED_CANONICAL"
                      ? "کانونیکال گوگل"
                      : data.indexingMethod === "DUPLICATE"
                        ? "صفحه تکراری"
                        : "—"
                }
                state={data.indexingMethod === "DUPLICATE" ? "warning" : "neutral"}
                help={{
                  title: "روش ایندکس / کانونیکال",
                  body: "وقتی چند نسخه از یک محتوا وجود دارد، گوگل یکی را «اصلی» انتخاب می‌کند. اگر خودتان با برچسب canonical انتخاب کرده باشید بهتر است.",
                  example: "مثل چند کپی از یک سند — گوگل می‌گوید «این نسخه نسخه اصلی است، بقیه را نادیده می‌گیرم».",
                }}
              />
              <StatusRow
                icon={Smartphone}
                label="وضعیت موبایل"
                value={data.mobileUsable ? "مناسب برای موبایل" : data.mobileIssues.length + " مشکل دارد"}
                state={data.mobileUsable ? "good" : "warning"}
                help={{
                  title: "سازگاری با موبایل",
                  body: "آیا صفحه در گوشی درست و خوانا نمایش داده می‌شود؟ بیشتر کاربران ایرانی با موبایل وارد می‌شوند.",
                  example: "اگر متن صفحه در گوشی ریز و ناخوانا باشد، کاربر فرار می‌کند و گوگل این را نمی‌پسندد.",
                }}
              />
              <StatusRow
                icon={Zap}
                label="کد HTTP"
                value={data.httpCode ? toFaDigits(data.httpCode) : "—"}
                state={
                  data.httpCode && data.httpCode < 300
                    ? "good"
                    : data.httpCode && data.httpCode < 400
                      ? "info"
                      : "error"
                }
                help={{
                  title: "کد HTTP",
                  body: "پاسخ سرور هنگام باز کردن صفحه: ۲۰۰ یعنی موفق، ۳۰۱ یعنی منتقل شده، ۴۰۴ یعنی پیدا نشد، ۵۰۰ یعنی خطای سرور.",
                  example: "مثل چراغ راهنما: سبز (۲۰۰) برو، زرد (۳۰۱) مسیر عوض شد، قرمز (۴۰۴/۵۰۰) راه بسته!",
                }}
              />
              <StatusRow
                icon={Map}
                label="در نقشه سایت"
                value={data.sitemapFound ? "پیدا شد" : "یافت نشد"}
                state={data.sitemapFound ? "good" : "warning"}
                help={{
                  title: "نقشه سایت (Sitemap)",
                  body: "فایلی است که همه صفحات مهم سایت را به گوگل معرفی می‌کند. بودن صفحه در آن یعنی گوگل راحت‌تر پیدایش می‌کند.",
                  example: "مثل فهرست مطالب کتاب — به گوگل می‌گوید «همه صفحات مهم من اینها هستند».",
                }}
              />
            </div>

            {/* نتایج غنی صفحه */}
            {data.richResults.length > 0 && (
              <Card>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="font-bold text-sm">نتایج غنی این صفحه</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.richResults.map((r, i) => (
                      <Badge
                        key={i}
                        variant={r.state === "VALID" ? "default" : r.state === "WARNING" ? "outline" : "destructive"}
                        className="gap-1.5"
                      >
                        <Sparkles className="w-3 h-3" />
                        {r.type}
                        {r.state !== "VALID" && (r.state === "WARNING" ? " (هشدار)" : " (خطا)")}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* مشکلات موبایل */}
            {!data.mobileUsable && data.mobileIssues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>مشکلات نمایش در موبایل</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc ps-5 space-y-1 mt-1">
                    {data.mobileIssues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* جعبه راهنمای وضعیت */}
            {status && status.severity !== "good" && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>راهنمای این وضعیت</AlertTitle>
                <AlertDescription className="leading-6">
                  {status.severity === "warning" && data.indexStatus === "CRAWLED_NOT_INDEXED" &&
                    "گوگل صفحه را دیده اما ارزش ایندکس را در محتوای فعلی ندیده است. محتوا را غنی‌تر و یکتا کنید و لینک داخلی بیشتری به آن بدهید."}
                  {status.severity === "warning" && data.indexStatus === "DISCOVERED_NOT_INDEXED" &&
                    "صفحه در صف خواندن گوگل است. اگر تازه است چند هفته صبر کنید؛ لینک داخلی به آن سرعت بخشید."}
                  {status.severity === "error" && data.indexStatus === "BLOCKED_BY_ROBOTS" &&
                    "فایل robots.txt سایت شما این مسیر را مسدود کرده. اگر ایندکس شدنش را می‌خواهید، آن را در robots.txt آزاد کنید."}
                  {status.severity === "error" && data.indexStatus === "NOINDEX" &&
                    "تگ noindex در این صفحه هست. برای ایندکس شدن باید آن را حذف کنید (معمولاً در تنظیمات قالب یا افزونه سئو)."}
                  {status.severity === "info" && data.indexStatus === "REDIRECT" &&
                    "این آدرس به آدرس دیگری منتقل می‌شود؛ به‌جای آن آدرس مقصد را بازرسی کنید."}
                  {status.severity === "error" && (data.indexStatus === "NOT_INDEXED" || data.indexStatus === "NOT_FOUND" || data.indexStatus === "SERVER_ERROR") &&
                    "این صفحه در وضعیت مناستی نیست. صفحه را باز کنید، خطا را برطرف و دوباره بازرسی کنید."}
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
