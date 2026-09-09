import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getValidAccessToken, listSites } from "@/lib/gsc";
import type { GscSite } from "@/lib/types";

// GET /api/sites — لیست سایت‌های ثبت‌شده کاربر در سرچ کنسول
// در حالت دمو لیست نمایشی فارسی برمی‌گرداند
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  try {
    // --- حالت نمایشی (دمو): سایت‌های نمونه ---
    if (user.isDemo) {
      const demoSites: GscSite[] = [
        {
          siteUrl: "sc-domain:digiblog.ir",
          displayName: "digiblog.ir",
          type: "DOMAIN",
          verified: true,
          permissionLevel: "siteOwner",
        },
        {
          siteUrl: "https://shop.digiblog.ir/",
          displayName: "https://shop.digiblog.ir",
          type: "URL_PREFIX",
          verified: true,
          permissionLevel: "siteOwner",
        },
        {
          siteUrl: "https://devnotes.io/",
          displayName: "https://devnotes.io",
          type: "URL_PREFIX",
          verified: true,
          permissionLevel: "siteOwner",
        },
        {
          siteUrl: "sc-domain:tourism-hub.ir",
          displayName: "tourism-hub.ir",
          type: "DOMAIN",
          verified: true,
          permissionLevel: "siteOwner",
        },
        {
          siteUrl: "https://test.newsite.ir/",
          displayName: "https://test.newsite.ir",
          type: "URL_PREFIX",
          verified: false,
          permissionLevel: "siteUnverifiedUser",
        },
      ];
      return NextResponse.json({ sites: demoSites, demo: true });
    }

    // --- حالت واقعی: فراخوانی API گوگل ---
    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser?.googleId) {
      return NextResponse.json({ sites: [], demo: false });
    }

    const accessToken = await getValidAccessToken(user.id);
    const sites = await listSites(accessToken);
    return NextResponse.json({ sites, demo: false });
  } catch (err) {
    console.error("خطا در /api/sites:", err);
    return NextResponse.json(
      { error: "دریافت سایت‌ها از گوگل ناموفق بود. اتصال یا توکن را بررسی کنید." },
      { status: 500 }
    );
  }
}
