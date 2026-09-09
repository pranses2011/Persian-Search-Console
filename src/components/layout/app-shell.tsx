"use client";

// ============================================================
//  پوسته اصلی برنامه — هدر بالا + ناحیه محتوا + پاورقی چسبان
// ============================================================

import * as React from "react";
import { Search } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAppStore } from "@/store/app-store";
import { toFaDigits } from "@/lib/format";

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const view = useAppStore((s) => s.view);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* هدر ثابت بالا */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* لوگو و نام برنامه */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Search className="w-4.5 h-4.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="font-bold text-sm leading-tight truncate">کنسول جستجوی فارسی</div>
              <div className="text-[10px] text-muted-foreground leading-tight truncate">
                Persian Search Console
              </div>
            </div>
          </div>

          {/* سمت دیگر هدر: تم + کاربر */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {user && <UserMenu />}
          </div>
        </div>
      </header>

      {/* ناحیه محتوای اصلی */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* پاورقی چسبان پایین */}
      <footer className="mt-auto border-t bg-background no-print">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-12 flex items-center justify-between text-xs text-muted-foreground">
          <span>کنسول جستجوی فارسی — داشبورد مدیریت گوگل سرچ کنسول</span>
          <span>
            {view === "dashboard" ? "نسخه " + toFaDigits("۱.۰") : "© " + toFaDigits("۱۴۰۴")}
          </span>
        </div>
      </footer>
    </div>
  );
}
