import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { mockSummary } from "@/lib/mock-sections";
import { getValidAccessToken, searchAnalyticsDaily, sumTotals } from "@/lib/gsc";
import { previousRange } from "@/lib/mock-engine";
import type { SummaryResponse } from "@/lib/types";

// GET /api/summary?site=&start=&end= — خلاصه وضعیت کلی + نوتیفیکیشن هوشمند (بخش ۶)
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const site = req.nextUrl.searchParams.get("site") || "";
  const start = req.nextUrl.searchParams.get("start") || "";
  const end = req.nextUrl.searchParams.get("end") || "";

  if (!site || !start || !end) {
    return NextResponse.json({ error: "site، start و end الزامی هستند" }, { status: 400 });
  }

  try {
    // --- حالت دمو: محاسبه از موتور نمایشی ---
    if (user.isDemo) {
      const { data } = await withCache<SummaryResponse>(
        `summary:demo:${site}:${start}:${end}`,
        async () => mockSummary(site, start, end),
        300
      );
      return NextResponse.json(data);
    }

    // --- حالت واقعی: محاسبه از داده گوگل ---
    const accessToken = await getValidAccessToken(user.id);

    const daily = await searchAnalyticsDaily(accessToken, site, start, end);
    const totals = daily.length ? sumTotals(daily) : { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    // بازه قبلی برای مقایسه
    const prev = previousRange(start, end);
    const prevDaily = await searchAnalyticsDaily(accessToken, site, prev.start, prev.end);
    const prevTotals = prevDaily.length
      ? sumTotals(prevDaily)
      : undefined;

    // نوتیفیکیشن‌های هوشمند بر اساس تغییرات
    const notifications = [];
    const clicksDelta = prevTotals?.clicks
      ? ((totals.clicks - prevTotals.clicks) / prevTotals.clicks) * 100
      : 0;
    if (clicksDelta <= -15) {
      notifications.push({
        id: "perf-drop",
        severity: "error",
        title: "افت کلیک‌ها",
        description: `کلیک‌ها نسبت به بازه قبل ${Math.abs(clicksDelta).toFixed(0)}٪ کاهش داشته است.`,
        date: end,
      });
    } else if (clicksDelta >= 20) {
      notifications.push({
        id: "perf-rise",
        severity: "success",
        title: "رشد کلیک‌ها",
        description: `کلیک‌ها ${clicksDelta.toFixed(0)}٪ رشد کرده است!`,
        date: end,
      });
    }

    const score = Math.min(
      100,
      Math.round(50 + Math.min(50, (totals.impressions / 100000) * 50) + (clicksDelta > 0 ? 10 : 0))
    );

    return NextResponse.json({
      score,
      summary:
        `در این بازه سایت شما ${totals.clicks} کلیک و ${totals.impressions} نمایش در گوگل داشته است.`,
      notifications,
      totals: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: totals.ctr,
        position: totals.position,
        deltaClicks: prevTotals?.clicks
          ? ((totals.clicks - prevTotals.clicks) / prevTotals.clicks) * 100
          : undefined,
        deltaImpressions: prevTotals?.impressions
          ? ((totals.impressions - prevTotals.impressions) / prevTotals.impressions) * 100
          : undefined,
      },
      demo: false,
    });
  } catch (err) {
    console.error("خطا در /api/summary:", err);
    return NextResponse.json({ error: "محاسبه خلاصه وضعیت ناموفق بود" }, { status: 500 });
  }
}
