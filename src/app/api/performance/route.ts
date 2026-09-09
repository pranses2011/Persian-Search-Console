import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getValidAccessToken, searchAnalytics, searchAnalyticsDaily, sumTotals } from "@/lib/gsc";
import { dailyRange, dimensionRows, totalsOf, previousRange, fullDailySeries } from "@/lib/mock-engine";
import { withCache } from "@/lib/cache";
import type {
  PerformanceResponse,
  PerformanceTotals,
  DailyRow,
  DimensionRow,
  PerformanceFilters,
} from "@/lib/types";

// تبدیل نام‌های لاتین گوگل به فارسی
const COUNTRY_FA: Record<string, string> = {
  irn: "ایران", usa: "ایالات متحده", deu: "آلمان", can: "کانادا",
  are: "امارات متحده عربی", tur: "ترکیه", gbr: "بریتانیا", aus: "استرالیا",
  nld: "هلند", swe: "سوئد", fra: "فرانسه", qat: "قطر", afq: "افغانستان",
};
const DEVICE_FA: Record<string, string> = {
  mobile: "موبایل", desktop: "دسکتاپ", tablet: "تبلت",
};
const APPEARANCE_FA: Record<string, string> = {
  web: "نتایج وب", image: "نتایج تصویری", video: "نتایج ویدیویی",
  news: "نتایج خبری", discover: "گوگل دیسکاور", rich_result: "نتیجه غنی",
};

// GET /api/performance?site=&start=&end=&dimension=&query=&page=&country=&device=&searchAppearance=&compare=
// داده‌های عملکرد جستجو: جمع معیارها + سری روزانه + جدول بعد انتخابی
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  // پارامترهای درخواست
  const sp = req.nextUrl.searchParams;
  const site = sp.get("site") || "";
  const start = sp.get("start") || "";
  const end = sp.get("end") || "";
  const dimension = sp.get("dimension") || "query";
  const compare = sp.get("compare") === "true";
  const filters: PerformanceFilters = {
    query: sp.get("query") || undefined,
    page: sp.get("page") || undefined,
    country: sp.get("country") || undefined,
    device: sp.get("device") || undefined,
    searchAppearance: sp.get("searchAppearance") || undefined,
  };

  if (!site || !start || !end) {
    return NextResponse.json({ error: "پارامترهای site، start و end الزامی هستند" }, { status: 400 });
  }

  // کلید کش یکتا بر اساس همه پارامترها
  const cacheKey = `perf:${user.isDemo ? "demo" : user.id}:${site}:${start}:${end}:${dimension}:${compare}:${JSON.stringify(filters)}`;

  try {
    const { data } = await withCache<PerformanceResponse>(cacheKey, async () => {
      // ---------------------------------------------
      // حالت دمو: موتور داده نمایشی
      // ---------------------------------------------
      if (user.isDemo) {
        const daily = dailyRange(site, start, end);
        const totals = totalsOf(daily);
        const rows = dimensionRows(site, dimension, start, end, filters);

        // مقایسه با بازه قبلی هم‌اندازه
        let previousTotals: PerformanceTotals | undefined;
        if (compare) {
          const prev = previousRange(start, end);
          const prevDaily = dailyRange(site, prev.start, prev.end);
          previousTotals = totalsOf(prevDaily);
        }

        return { totals, previousTotals, daily, rows, dimension, demo: true };
      }

      // ---------------------------------------------
      // حالت واقعی: فراخوانی Search Analytics API گوگل
      // ---------------------------------------------
      const accessToken = await getValidAccessToken(user.id);

      // ساخت فیلترهای گوگل
      const gscFilters = Object.entries(filters)
        .filter(([, v]) => v)
        .map(([k, v]) => ({
          dimension: k,
          operator: "contains",
          expression: v,
        }));

      const filterGroups = gscFilters.length
        ? [{ groupType: "and", filters: gscFilters }]
        : undefined;

      // سری روزانه (searchAnalyticsDaily خروجی DailyRow دارد)
      const daily: DailyRow[] = await searchAnalyticsDaily(
        accessToken, site, start, end, filterGroups
      );

      // جدول بعد انتخابی
      const rawRows = await searchAnalytics(accessToken, site, {
        startDate: start,
        endDate: end,
        dimensions: [dimension],
        dimensionFilterGroups: filterGroups,
      });

      // ترجمه برچسب‌های لاتین به فارسی
      const rows: DimensionRow[] = rawRows.map((r) => {
        let key = r.key;
        if (dimension === "country") key = COUNTRY_FA[r.key.toLowerCase()] ?? r.key;
        else if (dimension === "device") key = DEVICE_FA[r.key.toLowerCase()] ?? r.key;
        else if (dimension === "searchAppearance")
          key = APPEARANCE_FA[r.key.toLowerCase()] ?? r.key;
        return { ...r, key };
      });

      // جمع کل (اگر API بعد date بود از ردیف‌ها؛ وگرنه کوئری جدا بدون بعد)
      let totals: PerformanceTotals;
      if (daily.length > 0) {
        totals = sumTotals(daily);
      } else {
        const totalRows = await searchAnalytics(accessToken, site, {
          startDate: start,
          endDate: end,
          dimensions: [],
          dimensionFilterGroups: filterGroups,
        });
        totals = totalRows[0]
          ? {
              clicks: totalRows[0].clicks,
              impressions: totalRows[0].impressions,
              ctr: totalRows[0].ctr,
              position: totalRows[0].position,
            }
          : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      }

      // مقایسه با بازه قبلی
      let previousTotals: PerformanceTotals | undefined;
      if (compare) {
        const prev = previousRange(start, end);
        const prevDaily = await searchAnalyticsDaily(
          accessToken,
          site,
          prev.start,
          prev.end,
          filterGroups
        );
        previousTotals = prevDaily.length
          ? sumTotals(prevDaily)
          : undefined;
      }

      return { totals, previousTotals, daily, rows, dimension, demo: false };
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("خطا در /api/performance:", err);
    return NextResponse.json(
      { error: "دریافت داده‌های عملکرد جستجو ناموفق بود." },
      { status: 500 }
    );
  }
}
