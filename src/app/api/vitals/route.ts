import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { mockVitals } from "@/lib/mock-sections";
import type { VitalsResponse } from "@/lib/types";

// GET /api/vitals?site= — Core Web Vitals (بخش ۳.۹)
// نکته: داده CWV از CrUX API قابل دریافت است؛ اینجا نمایشی/برآوردی
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const site = req.nextUrl.searchParams.get("site") || "";
  if (!site) {
    return NextResponse.json({ error: "پارامتر site الزامی است" }, { status: 400 });
  }

  try {
    const { data } = await withCache<VitalsResponse>(
      `vitals:${user.isDemo ? "demo" : user.id}:${site}`,
      async () => mockVitals(site),
      600
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("خطا در /api/vitals:", err);
    return NextResponse.json({ error: "دریافت گزارش Core Web Vitals ناموفق بود" }, { status: 500 });
  }
}
