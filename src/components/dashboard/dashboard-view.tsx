"use client";

// ============================================================
//  نمای داشبورد سایت (بخش ۳) — سایدبار ۱۰ بخش + ناحیه محتوا
//  + نوار بازه زمانی و انتخاب سایت
// ============================================================

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore, type SectionId } from "@/store/app-store";
import { SECTIONS, NavContent } from "./dashboard-sidebar";
import { DateRangeBar } from "./overview/date-range-bar";
import { OverviewSection } from "./overview/overview-section";
import { InspectionSection } from "./inspection-section";
import { IndexingSection } from "./indexing-section";
import { MobileSection } from "./mobile-section";
import { SitemapsSection } from "./sitemaps-section";
import { SecuritySection } from "./security-section";
import { RichResultsSection } from "./rich-results-section";
import { LinksSection } from "./links-section";
import { VitalsSection } from "./vitals-section";
import { RemovalsSection } from "./removals-section";
import { ArrowRight, Menu, ChevronDown, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { GscSite } from "@/lib/types";

// نوار بالای داشبورد: انتخاب سایت + بازه زمانی
function DashboardTopBar() {
  const { selectedSite, properties, selectSite } = useAppStore();

  return (
    <div className="flex flex-wrap items-center gap-3 justify-between pb-4 border-b no-print">
      <div className="flex items-center gap-2 min-w-0">
        {/* انتخاب سایت (تعویض سریع) */}
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 max-w-56">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <span dir="ltr" className="truncate text-xs">{selectedSite?.displayName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {properties.map((p) => (
              <DropdownMenuItem
                key={p.siteUrl}
                onClick={() => p.verified && selectSite(p)}
                disabled={!p.verified}
                className="gap-2"
                dir="ltr"
              >
                <span className="truncate text-xs">{p.siteUrl}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => selectSite(null)} className="gap-2">
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-xs">مدیریت سایت‌ها</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DateRangeBar />
    </div>
  );
}

export function DashboardView() {
  const section = useAppStore((s) => s.section);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { selectedSite, properties, setProperties } = useAppStore();

  // اگر استور خالی بود (مثلاً بعد از رفرش)، لیست سایت‌ها را دوباره پر کن
  const { data: ensureData } = useQuery<{ sites: GscSite[] }>({
    queryKey: ["sites-ensure"],
    enabled: !!selectedSite && properties.length === 0,
    queryFn: async () => {
      const res = await fetch("/api/sites");
      return res.json();
    },
  });
  React.useEffect(() => {
    if (ensureData?.sites?.length) setProperties(ensureData.sites);
  }, [ensureData, setProperties]);

  // رندر بخش فعال
  function renderSection() {
    switch (section) {
      case "overview":
        return <OverviewSection />;
      case "inspection":
        return <InspectionSection />;
      case "indexing":
        return <IndexingSection />;
      case "mobile":
        return <MobileSection />;
      case "sitemaps":
        return <SitemapsSection />;
      case "security":
        return <SecuritySection />;
      case "rich-results":
        return <RichResultsSection />;
      case "links":
        return <LinksSection />;
      case "vitals":
        return <VitalsSection />;
      case "removals":
        return <RemovalsSection />;
      default:
        return <OverviewSection />;
    }
  }

  return (
    <div className="flex lg:gap-5 items-start">
      {/* سایدبار دسکتاپ (سمت راست) */}
      <aside className="hidden lg:block w-60 shrink-0 border rounded-2xl bg-sidebar sticky top-20 h-[calc(100vh-6.5rem)] no-print">
        <NavContent />
      </aside>

      <div className="flex-1 min-w-0 space-y-5">
        {/* نوار موبایل: همبرگر + عنوان بخش */}
        <div className="lg:hidden flex items-center gap-2 no-print">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="w-9 h-9 shrink-0" aria-label="باز کردن منو">
                <Menu className="w-4.5 h-4.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">منوی بخش‌های داشبورد</SheetTitle>
              <NavContent onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-bold text-sm truncate">
            {SECTIONS.find((s) => s.id === section)?.label}
          </span>
        </div>

        <DashboardTopBar />

        {/* محتوای بخش فعال */}
        {renderSection()}
      </div>
    </div>
  );
}
