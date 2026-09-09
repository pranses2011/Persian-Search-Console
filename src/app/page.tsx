"use client";

// ============================================================
//  صفحه اصلی برنامه — اسپلت تک‌صفحه‌ای (SPA)
//  جریان: ورود → لیست سایت‌ها → داشبورد سایت
// ============================================================

import * as React from "react";
import { useAppStore } from "@/store/app-store";
import { LoginView } from "@/components/auth/login-view";
import { AppShell } from "@/components/layout/app-shell";
import { PropertiesView } from "@/components/properties/properties-view";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppUser } from "@/lib/types";

// چیدمان لودینگ اولیه (اسکلتون)
function LoadingView() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

function AppInner() {
  const { view, setUser, googleConfigured } = useAppStore();

  // بررسی وضعیت ورود کاربر هنگام بارگذاری برنامه
  React.useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user: AppUser | null; googleConfigured: boolean }) => {
        if (!mounted) return;
        setUser(data.user, data.googleConfigured);
      })
      .catch(() => {
        if (mounted) setUser(null, googleConfigured);
      });
    return () => {
      mounted = false;
    };
  }, [setUser, googleConfigured, setUser]);

  switch (view) {
    case "loading":
      return <LoadingView />;
    case "login":
      return <LoginView />;
    case "properties":
      return (
        <AppShell>
          <PropertiesView />
        </AppShell>
      );
    case "dashboard":
      return (
        <AppShell>
          <DashboardView />
        </AppShell>
      );
    default:
      return <LoadingView />;
  }
}

export default function Home() {
  return (
    <React.Suspense fallback={<LoadingView />}>
      <AppInner />
    </React.Suspense>
  );
}
