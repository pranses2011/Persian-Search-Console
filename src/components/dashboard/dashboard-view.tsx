"use client";

// ============================================================
//  نمای داشبورد سایت (بخش ۳) — جایگاه اولیه در این کامیت
//  از کامیت بعدی با ۱۰ بخش کامل داشبورد پر می‌شود
// ============================================================

import { useAppStore } from "@/store/app-store";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";

export function DashboardView() {
  const site = useAppStore((s) => s.selectedSite);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">داشبورد سایت</h1>
          <p className="text-sm text-muted-foreground" dir="ltr">{site?.siteUrl}</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <LayoutDashboard className="w-10 h-10 mx-auto mb-4 opacity-40" />
          بخش‌های داشبورد در کامیت‌های بعدی اضافه می‌شوند
        </CardContent>
      </Card>
    </div>
  );
}
