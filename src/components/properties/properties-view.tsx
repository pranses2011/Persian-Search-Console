"use client";

// ============================================================
//  بخش ۲ — نمای لیست سایت‌های ثبت‌شده (Properties)
//  کارت‌های سایت با فاویکون، نوع، وضعیت تأیید + جستجو و فیلتر
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe, Search, ShieldCheck, ShieldX, ArrowLeft, LayoutGrid,
  CheckCircle2, XCircle, HelpCircle,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { faNumber, faTimeAgo } from "@/lib/format";
import type { GscSite } from "@/lib/types";

// آواتار فاویکون سایت با جایگزین حرف اول
function SiteIcon({ site }: { site: GscSite }) {
  const [failed, setFailed] = React.useState(false);
  const domain = site.siteUrl
    .replace("sc-domain:", "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .split("/")[0];

  // رنگ قطعی بر اساس دامنه
  const hue = React.useMemo(() => {
    let h = 0;
    for (const ch of domain) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }, [domain]);

  if (failed || site.type === "DOMAIN") {
    return (
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
        style={{ backgroundColor: `oklch(0.55 0.14 ${hue})` }}
      >
        {domain[0]?.toUpperCase() || "S"}
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-xl border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
      {/* فاویکون از سرویس گوگل با جایگزین حرف اول */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt={`فاویکون ${domain}`}
        className="w-7 h-7"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function PropertiesView() {
  const { data, isLoading, isError, refetch } = useQuery<{ sites: GscSite[]; demo: boolean }>({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetch("/api/sites");
      if (!res.ok) throw new Error("خطا در دریافت سایت‌ها");
      return res.json();
    },
  });
  const selectSite = useAppStore((s) => s.selectSite);
  const { toast } = useToast();

  // جستجو و فیلتر
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "verified" | "unverified">("all");

  const sites = React.useMemo(() => {
    let out = data?.sites ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((s) => s.siteUrl.toLowerCase().includes(q) || s.displayName.toLowerCase().includes(q));
    }
    if (filter === "verified") out = out.filter((s) => s.verified);
    if (filter === "unverified") out = out.filter((s) => !s.verified);
    return out;
  }, [data, search, filter]);

  // ورود به داشبورد سایت با بررسی تأیید مالکیت
  function handleSiteClick(site: GscSite) {
    if (!site.verified) {
      toast({
        title: "این سایت تأیید نشده است",
        description:
          "مالکیت این Property در گوگل تأیید نشده و داده‌ای برای نمایش ندارد. ابتدا باید آن را در سرچ کنسول تأیید کنید.",
        variant: "destructive",
      });
      return;
    }
    selectSite(site);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-10 w-72" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-16 text-center space-y-4">
          <XCircle className="w-10 h-10 mx-auto text-destructive" />
          <p className="font-medium">دریافت سایت‌ها ناموفق بود</p>
          <Button onClick={() => refetch()} variant="outline">تلاش مجدد</Button>
        </CardContent>
      </Card>
    );
  }

  const allSites = data?.sites ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* عنوان صفحه */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">سایت‌های شما</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {faNumber(allSites.length)} سایت در گوگل سرچ کنسول ثبت شده — روی هر سایت کلیک کنید تا داشبورد آن باز شود
            </p>
          </div>
        </div>
        {data?.demo && (
          <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-300 dark:text-amber-400">
            <HelpCircle className="w-3.5 h-3.5" />
            داده‌های نمایشی
          </Badge>
        )}
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-52 max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجو بین سایت‌ها..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 bg-card"
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              همه
            </TabsTrigger>
            <TabsTrigger value="verified" className="gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              تأییدشده
            </TabsTrigger>
            <TabsTrigger value="unverified" className="gap-1.5">
              <ShieldX className="w-3.5 h-3.5" />
              تأییدنشده
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* شبکه کارت‌های سایت */}
      {sites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground space-y-2">
            <Globe className="w-10 h-10 mx-auto opacity-40" />
            <p>{allSites.length === 0 ? "هیچ سایتی در سرچ کنسول شما ثبت نشده است." : "نتیجه‌ای برای جستجوی شما یافت نشد."}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site, i) => (
            <motion.div
              key={site.siteUrl}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <Card
                className="group h-full cursor-pointer hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                onClick={() => handleSiteClick(site)}
              >
                <CardContent className="p-5 space-y-4 h-full flex flex-col">
                  {/* ردیف بالا: آیکون + آدرس */}
                  <div className="flex items-start gap-3">
                    <SiteIcon site={site} />
                    <div className="min-w-0 flex-1">
                      {/* آدرس کامل سایت */}
                      <div
                        dir="ltr"
                        className="font-medium text-sm truncate text-start"
                        title={site.siteUrl}
                      >
                        {site.siteUrl}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {/* نوع Property */}
                        <Badge variant="secondary" className="text-[11px] gap-1">
                          {site.type === "DOMAIN" ? <Globe className="w-3 h-3" /> : <Search className="w-3 h-3" />}
                          {site.type === "DOMAIN" ? "دامنه (Domain)" : "پیشوند URL"}
                        </Badge>
                        {/* وضعیت تأیید مالکیت */}
                        {site.verified ? (
                          <Badge className="text-[11px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-100">
                            <CheckCircle2 className="w-3 h-3" />
                            تأیید شده
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[11px] gap-1">
                            <XCircle className="w-3 h-3" />
                            تأیید نشده
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* توضیح ساده برای مبتدی‌ها */}
                  <p className="text-xs text-muted-foreground leading-5 flex-1">
                    {site.type === "DOMAIN"
                      ? "تمام آدرس‌ها و زیردامنه‌های این سایت را پوشش می‌دهد؛ شامل http، https، www و بدون www."
                      : "فقط همین آدرس دقیق (با همین پروتکل و پیشوند) پوشش داده می‌شود."}
                  </p>

                  {/* ردیف پایین: ورود به داشبورد */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>
                      {site.verified ? "آخرین به‌روزرسانی: " + faTimeAgo(new Date()) : "بدون دسترسی به داده"}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                      ورود به داشبورد
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
