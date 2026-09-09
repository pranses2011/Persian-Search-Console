import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { mockIndexing } from "@/lib/mock-sections";
import type { IndexingResponse } from "@/lib/types";

// GET /api/indexing?site= — وضعیت ایندکس‌گذاری صفحات (بخش ۳.۳)
// نکته: گزارش Coverage کامل در API عمومی گوگل موجود نیست؛
// داده از موتور نمایشی/برآوردی تأمین می‌شود (در UI اعلان می‌شود)
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
    // داده ایندکس‌گذاری از موتور نمایشی (گوگل API عمومی برای Coverage ندارد)
    const { data } = await withCache<IndexingResponse>(
      `indexing:${user.isDemo ? "demo" : user.id}:${site}`,
      async () => mockIndexing(site),
      600 // کش ۱۰ دقیقه
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error("خطا در /api/indexing:", err);
    return NextResponse.json({ error: "دریافت گزارش ایندکس‌گذاری ناموفق بود" }, { status: 500 });
  }
}
