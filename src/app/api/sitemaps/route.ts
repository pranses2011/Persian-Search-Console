import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getValidAccessToken, listSitemaps, submitSitemap, deleteSitemap } from "@/lib/gsc";
import { mockSitemaps, demoAddSitemap, demoRemoveSitemap } from "@/lib/mock-sections";

// GET /api/sitemaps?site= — لیست نقشه‌های سایت (بخش ۳.۵)
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
    // --- حالت دمو ---
    if (user.isDemo) {
      return NextResponse.json({ sitemaps: mockSitemaps(site), demo: true });
    }

    // --- حالت واقعی: Sitemaps API گوگل ---
    const accessToken = await getValidAccessToken(user.id);
    const sitemaps = await listSitemaps(accessToken, site);
    return NextResponse.json({ sitemaps, demo: false });
  } catch (err) {
    console.error("خطا در GET /api/sitemaps:", err);
    return NextResponse.json({ error: "دریافت نقشه‌های سایت ناموفق بود" }, { status: 500 });
  }
}

// POST /api/sitemaps — ارسال (ثبت) نقشه سایت جدید
// body: { site, feedpath }
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { site, feedpath } = body as { site: string; feedpath: string };

    if (!site || !feedpath) {
      return NextResponse.json({ error: "site و feedpath الزامی هستند" }, { status: 400 });
    }

    // اعتبارسنجی ساده آدرس نقشه سایت
    if (!feedpath.startsWith("http") || !feedpath.endsWith(".xml")) {
      return NextResponse.json(
        { error: "آدرس نقشه سایت باید کامل و با پسوند xml باشد — مثال: https://example.ir/sitemap.xml" },
        { status: 400 }
      );
    }

    // --- حالت دمو ---
    if (user.isDemo) {
      const item = demoAddSitemap(site, feedpath);
      return NextResponse.json({ ok: true, item, demo: true });
    }

    // --- حالت واقعی ---
    const accessToken = await getValidAccessToken(user.id);
    await submitSitemap(accessToken, site, feedpath);
    return NextResponse.json({ ok: true, demo: false });
  } catch (err) {
    console.error("خطا در POST /api/sitemaps:", err);
    return NextResponse.json({ error: "ارسال نقشه سایت ناموفق بود" }, { status: 500 });
  }
}

// DELETE /api/sitemaps?site=&feedpath= — حذف نقشه سایت
export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const site = req.nextUrl.searchParams.get("site") || "";
  const feedpath = req.nextUrl.searchParams.get("feedpath") || "";

  if (!site || !feedpath) {
    return NextResponse.json({ error: "site و feedpath الزامی هستند" }, { status: 400 });
  }

  try {
    // --- حالت دمو ---
    if (user.isDemo) {
      demoRemoveSitemap(site, feedpath);
      return NextResponse.json({ ok: true, demo: true });
    }

    // --- حالت واقعی ---
    const accessToken = await getValidAccessToken(user.id);
    await deleteSitemap(accessToken, site, feedpath);
    return NextResponse.json({ ok: true, demo: false });
  } catch (err) {
    console.error("خطا در DELETE /api/sitemaps:", err);
    return NextResponse.json({ error: "حذف نقشه سایت ناموفق بود" }, { status: 500 });
  }
}
