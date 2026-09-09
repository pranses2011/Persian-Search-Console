import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { mockMobile } from "@/lib/mock-sections";
import type { MobileResponse } from "@/lib/types";

// GET /api/mobile?site= — گزارش قابلیت استفاده در موبایل (بخش ۳.۴)
// نکته: گزارش Mobile Usability در API عمومی گوگل موجود نیست؛ داده نمایشی/برآوردی
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
    const { data } = await withCache<MobileResponse>(
      `mobile:${user.isDemo ? "demo" : user.id}:${site}`,
      async () => mockMobile(site),
      600
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("خطا در /api/mobile:", err);
    return NextResponse.json({ error: "دریافت گزارش موبایل ناموفق بود" }, { status: 500 });
  }
}
