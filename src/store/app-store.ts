"use client";

// ============================================================
//  استور سراسری برنامه (Zustand)
//  وضعیت کاربر، سایت انتخابی، بخش فعال، بازه زمانی و فیلترها
// ============================================================

import { create } from "zustand";
import type { AppUser, GscSite, PerformanceFilters } from "@/lib/types";

// شناسه بخش‌های داشبورد
export type SectionId =
  | "overview" // ۳.۱ عملکرد جستجو
  | "inspection" // ۳.۲ بازرسی URL
  | "indexing" // ۳.۳ ایندکس‌گذاری
  | "mobile" // ۳.۴ موبایل
  | "sitemaps" // ۳.۵ نقشه‌های سایت
  | "security" // ۳.۶ امنیت
  | "rich-results" // ۳.۷ نتایج غنی
  | "links" // ۳.۸ لینک‌ها
  | "vitals" // ۳.۹ Core Web Vitals
  | "removals"; // ۳.۱۰ حذف موقت

export type ViewMode = "loading" | "login" | "properties" | "dashboard";

// بازه‌های زمانی پیش‌فرض
export type PresetRange = "7d" | "28d" | "3m" | "6m" | "12m" | "16m" | "custom";

interface DateRange {
  preset: PresetRange;
  start: string; // ISO
  end: string; // ISO
}

interface AppState {
  // --- وضعیت کاربر ---
  user: AppUser | null;
  googleConfigured: boolean;
  view: ViewMode;
  setUser: (user: AppUser | null, googleConfigured?: boolean) => void;
  setView: (view: ViewMode) => void;

  // --- سایت‌ها ---
  properties: GscSite[];
  selectedSite: GscSite | null;
  setProperties: (props: GscSite[]) => void;
  selectSite: (site: GscSite | null) => void;

  // --- بخش فعال داشبورد ---
  section: SectionId;
  setSection: (section: SectionId) => void;

  // --- بازه زمانی ---
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;

  // --- فیلترهای عملکرد جستجو ---
  filters: PerformanceFilters;
  setFilters: (filters: PerformanceFilters) => void;

  // --- حالت مقایسه با بازه قبلی ---
  compare: boolean;
  setCompare: (v: boolean) => void;

  // --- نوتیفیکیشن‌ها ---
  notifRead: boolean;
  setNotifRead: (v: boolean) => void;
}

// تاریخ امروز و پیش‌فرض ۲۸ روز اخیر
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 27);
  return { preset: "28d", start: isoDate(start), end: isoDate(end) };
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  googleConfigured: false,
  view: "loading",
  setUser: (user, googleConfigured) =>
    set((s) => ({
      user,
      googleConfigured: googleConfigured ?? s.googleConfigured,
      view: user ? (s.view === "loading" ? "properties" : s.view) : "login",
    })),
  setView: (view) => set({ view }),

  properties: [],
  selectedSite: null,
  setProperties: (props) => set({ properties: props }),
  selectSite: (site) =>
    set({
      selectedSite: site,
      view: site ? "dashboard" : "properties",
      // با تغییر سایت به بخش نمای کلی برمی‌گردیم
      section: "overview",
    }),

  section: "overview",
  setSection: (section) => set({ section }),

  dateRange: defaultRange(),
  setDateRange: (range) => set({ dateRange: range }),

  filters: {},
  setFilters: (filters) => set({ filters }),

  compare: false,
  setCompare: (v) => set({ compare: v }),

  notifRead: false,
  setNotifRead: (v) => set({ notifRead: v }),
}));
