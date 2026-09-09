import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { mockSecurity } from "@/lib/mock-sections";
import type { SecurityResponse } from "@/lib/types";

// GET /api/security?site= — امنیت و اقدامات دستی (بخش ۳.۶)
// نکته: این گزارش‌ها در API عمومی گوگل موجود نیستند؛ داده نمایشی/برآوردی
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
    const { data } = await withCache<SecurityResponse>(
      `security:${user.isDemo ? "demo" : user.id}:${site}`,
      async () => mockSecurity(site),
      900 // کش ۱۵ دقیقه
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("خطا در /api/security:", err);
    return NextResponse.json({ error: "دریافت گزارش امنیت ناموفق بود" }, { status: 500 });
  }
}
