"use client";

// ============================================================
//  نمای لیست سایت‌ها (بخش ۲) — در این کامیت جایگاه اولیه
//  در کامیت بعدی با کارت‌ها، جستجو و فیلتر کامل می‌شود
// ============================================================

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Search, Loader2 } from "lucide-react";
import type { GscSite } from "@/lib/types";

export function PropertiesView() {
  // واکشی لیست سایت‌ها از سرچ کنسول
  const { data, isLoading } = useQuery<{ sites: GscSite[]; demo: boolean }>({
    queryKey: ["sites"],
    queryFn: async () => {
      const res = await fetch("/api/sites");
      if (!res.ok) throw new Error("خطا در دریافت سایت‌ها");
      return res.json();
    },
  });

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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const sites = data?.sites ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* عنوان صفحه */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">سایت‌های شما</h1>
          <p className="text-sm text-muted-foreground">
            سایت‌هایی که در گوگل سرچ کنسول ثبت کرده‌اید — روی هر سایت کلیک کنید تا داشبورد آن باز شود
          </p>
        </div>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />
            در حال دریافت سایت‌ها از گوگل...
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <Card key={site.siteUrl} className="hover:shadow-lg transition-all cursor-pointer hover:-translate-y-0.5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm font-medium" dir="ltr">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  {site.siteUrl}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
