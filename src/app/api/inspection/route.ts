import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getValidAccessToken, inspectUrl } from "@/lib/gsc";
import { mockInspectUrl } from "@/lib/mock-sections";
import { INDEX_STATUS_FA } from "@/lib/mock-sections";
import type { InspectionResult } from "@/lib/types";

// GET /api/inspection?site=&url= — بازرسی URL (بخش ۳.۲)
// در حالت واقعی از URL Inspection API گوگل استفاده می‌کند
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "ابتدا وارد شوید" }, { status: 401 });
  }

  const site = req.nextUrl.searchParams.get("site") || "";
  const url = req.nextUrl.searchParams.get("url") || "";

  if (!site || !url) {
    return NextResponse.json({ error: "پارامترهای site و url الزامی هستند" }, { status: 400 });
  }

  // اعتبارسنجی ساده URL
  try {
    if (!url.startsWith("http") && !url.startsWith("/")) {
      return NextResponse.json({ error: "آدرس باید با http یا / شروع شود" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "آدرس نامعتبر است" }, { status: 400 });
  }

  try {
    // --- حالت دمو ---
    if (user.isDemo) {
      // اگر آدرس نسبی بود، به آدرس کامل تبدیل شود
      const fullUrl = url.startsWith("/") ? "https://" + site.replace("sc-domain:", "") + url : url;
      return NextResponse.json(mockInspectUrl(site, fullUrl));
    }

    // --- حالت واقعی: URL Inspection API ---
    const accessToken = await getValidAccessToken(user.id);
    const result = await inspectUrl(accessToken, site, url);

    if (!result) {
      return NextResponse.json({ error: "نتیجه‌ای برای این URL دریافت نشد" }, { status: 404 });
    }

    // تبدیل پاسخ گوگل به ساختار داخلی
    const status = result.inspectionStatus?.state || "NOT_INDEXED";
    const coverage = result.indexStatusResult?.coverageState || "";

    // نگاشت وضعیت‌های گوگل به ساختار داخلی
    const mapStatus: Record<string, InspectionResult["indexStatus"]> = {
      "INDEXED": "INDEXED",
      "NOT_INDEXED": "NOT_INDEXED",
    };

    const inspection: InspectionResult = {
      url,
      indexStatus: mapStatus[status] ?? "NOT_INDEXED",
      lastCrawl: result.indexStatusResult?.lastCrawlTime ?? null,
      indexingMethod: result.indexStatusResult?.crawledAs
        ? ("USER_SELECTED_CANONICAL" as const)
        : null,
      mobileUsable: result.mobileUsabilityResult?.verdict === "PASS",
      mobileIssues: (result.mobileUsabilityResult?.issues ?? []).map((i) => i.issueType),
      richResults: (result.richResultsResult?.detectedItems ?? []).flatMap((item) =>
        (item.items ?? []).flatMap((sub) =>
          (sub.issues ?? []).map((issue) => ({
            type: item.richResultType,
            state: issue.severity === "ERROR" ? "ERROR" : issue.severity === "WARNING" ? "WARNING" : "VALID",
          }))
        )
      ),
      ampStatus: null,
      httpCode: coverage.includes("SERVER_ERROR") ? 500 : 200,
      canonical: null,
      sitemapFound: coverage.includes("SITEMAP"),
      referrerUrls: [],
      demo: false,
    };

    void INDEX_STATUS_FA; // نگاشت فارسی سمت کلاینت انجام می‌شود
    return NextResponse.json(inspection);
  } catch (err) {
    console.error("خطا در /api/inspection:", err);
    return NextResponse.json(
      { error: "بازرسی URL ناموفق بود. آدرس را بررسی و دوباره تلاش کنید." },
      { status: 500 }
    );
  }
}
