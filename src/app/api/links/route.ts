import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { mockLinks } from "@/lib/mock-sections";
import type { LinksResponse } from "@/lib/types";

// GET /api/links?site= — لینک‌های خارجی و داخلی (بخش ۳.۸)
// نکته: گزارش Links در API عمومی گوگل موجود نیست؛ داده نمایشی/برآوردی
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
    const { data } = await withCache<LinksResponse>(
      `links:${user.isDemo ? "demo" : user.id}:${site}`,
      async () => mockLinks(site),
      600
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("خطا در /api/links:", err);
    return NextResponse.json({ error: "دریافت گزارش لینک‌ها ناموفق بود" }, { status: 500 });
  }
}
