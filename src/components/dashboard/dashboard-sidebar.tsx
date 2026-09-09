"use client";

// ============================================================
//  منوی کناری داشبورد — ۱۰ بخش گزارش + دکمه بازگشت به سایت‌ها
//  نسخه دسکتاپ: ستون ثابت سمت راست (RTL)
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAppStore, type SectionId } from "@/store/app-store";
import { faJalaliShort } from "@/lib/format";
import {
  TrendingUp, SearchCheck, FileStack, Smartphone, Map,
  ShieldAlert, Sparkles, Link2, Gauge, Trash2,
} from "lucide-react";

// تعریف ۱۰ بخش داشبورد
export const SECTIONS: {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  { id: "overview", label: "عملکرد جستجو", icon: TrendingUp, desc: "کلیک، نمایش، نرخ کلیک و جایگاه" },
  { id: "inspection", label: "بازرسی URL", icon: SearchCheck, desc: "بررسی وضعیت یک صفحه در گوگل" },
  { id: "indexing", label: "ایندکس‌گذاری صفحات", icon: FileStack, desc: "کدام صفحات در گوگل ثبت شده‌اند" },
  { id: "mobile", label: "قابلیت استفاده موبایل", icon: Smartphone, desc: "مشکلات نمایش در موبایل" },
  { id: "sitemaps", label: "نقشه‌های سایت", icon: Map, desc: "فهرست صفحات معرفی‌شده به گوگل" },
  { id: "security", label: "امنیت و اقدامات دستی", icon: ShieldAlert, desc: "هشدارهای امنیتی و پنالتی" },
  { id: "rich-results", label: "نتایج غنی", icon: Sparkles, desc: "نمایش ویژه در نتایج گوگل" },
  { id: "links", label: "لینک‌ها", icon: Link2, desc: "لینک‌های خارجی و داخلی" },
  { id: "vitals", label: "Core Web Vitals", icon: Gauge, desc: "سرعت و تجربه کاربر" },
  { id: "removals", label: "حذف موقت URL", icon: Trash2, desc: "پنهان‌سازی موقت از نتایج" },
];

// محتوای مشترک منو (دسکتاپ و موبایل)
export function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { section, setSection } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      {/* آیتم‌های بخش‌ها */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="بخش‌های داشبورد">
        {SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setSection(s.id);
                onNavigate?.();
              }}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all text-start",
                active
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <s.icon className={cn("w-4.5 h-4.5 shrink-0", active ? "" : "opacity-80")} />
              <div className="min-w-0 flex-1">
                <div className="truncate leading-tight">{s.label}</div>
                {!active && (
                  <div className="text-[10px] opacity-70 truncate leading-tight mt-0.5">{s.desc}</div>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* تاریخ امروز شمسی */}
      <div className="p-3 border-t text-[11px] text-muted-foreground text-center tabular-fa">
        امروز: {faJalaliShort(new Date())}
      </div>
    </div>
  );
}
