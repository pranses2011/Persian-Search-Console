import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { mockRemovals, demoAddRemoval, demoCancelRemoval } from "@/lib/mock-sections";
import type { RemovalItem } from "@/lib/types";

// GET /api/removals?site= — لیست درخواست‌های حذف موقت (بخش ۳.۱۰)
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
    return NextResponse.json({ items: mockRemovals(site), demo: true });
  } catch (err) {
    console.error("خطا در GET /api/removals:", err);
    return NextResponse.json({ error: "دریافت درخواست‌های حذف ناموفق بود" }, { status: 500 });
  }
}

// POST /api/removals — ثبت درخواست حذف جدید
// body: { site, url, type }
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  try {
    const { site, url, type } = (await req.json()) as {
      site: string;
      url: string;
      type: RemovalItem["type"];
    };

    if (!site || !url || !type) {
      return NextResponse.json({ error: "site، url و type الزامی هستند" }, { status: 400 });
    }
    if (!url.startsWith("/") && !url.startsWith("http")) {
      return NextResponse.json({ error: "آدرس باید با http یا / شروع شود" }, { status: 400 });
    }

    // در حالت واقعی API عمومی برای Removals وجود ندارد؛ دمو ثبت می‌کند
    const item = demoAddRemoval(site, url, type);
    return NextResponse.json({ ok: true, item, demo: true });
  } catch (err) {
    console.error("خطا در POST /api/removals:", err);
    return NextResponse.json({ error: "ثبت درخواست حذف ناموفق بود" }, { status: 500 });
  }
}

// DELETE /api/removals?site=&url= — لغو درخواست حذف
export async function DELETE(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const site = req.nextUrl.searchParams.get("site") || "";
  const url = req.nextUrl.searchParams.get("url") || "";

  if (!site || !url) {
    return NextResponse.json({ error: "site و url الزامی هستند" }, { status: 400 });
  }

  try {
    demoCancelRemoval(site, url);
    return NextResponse.json({ ok: true, demo: true });
  } catch (err) {
    console.error("خطا در DELETE /api/removals:", err);
    return NextResponse.json({ error: "لغو درخواست ناموفق بود" }, { status: 500 });
  }
}
