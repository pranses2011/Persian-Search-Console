import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { mockRichResults } from "@/lib/mock-sections";
import type { RichResultsResponse } from "@/lib/types";

// GET /api/rich-results?site= — نتایج غنی (بخش ۳.۷)
// نکته: گزارش Enhancements در API عمومی گوگل موجود نیست؛ داده نمایشی/برآوردی
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
    const { data } = await withCache<RichResultsResponse>(
      `rich:${user.isDemo ? "demo" : user.id}:${site}`,
      async () => mockRichResults(site),
      600
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("خطا در /api/rich-results:", err);
    return NextResponse.json({ error: "دریافت گزارش نتایج غنی ناموفق بود" }, { status: 500 });
  }
}
