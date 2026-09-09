// ============================================================
//  کلاینت Google Search Console API v1 (سمت سرور)
//  لیست سایت‌ها، تحلیل جستجو، نقشه‌های سایت و بازرسی URL
// ============================================================

import { db } from "@/lib/db";
import { refreshAccessToken } from "@/lib/google";
import type {
  GscSite,
  PerformanceTotals,
  DailyRow,
  DimensionRow,
} from "@/lib/types";

// آدرس پایه API سرچ کنسول
const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";

/** دریافت Access Token معتبر؛ در صورت انقضا خودکار تازه‌سازی می‌شود */
export async function getValidAccessToken(userId: string): Promise<string> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("کاربر یافت نشد");
  if (!user.isDemo && !user.accessToken) throw new Error("توکن گوگل در دسترس نیست");

  // بررسی انقضای توکن (با ۵ دقیقه حاشیه امن)
  const expiresSoon =
    !user.tokenExpiresAt || user.tokenExpiresAt.getTime() - 5 * 60 * 1000 < Date.now();

  if (expiresSoon && user.refreshToken && !user.isDemo) {
    // تازه‌سازی خودکار توکن بدون نیاز به ورود مجدد کاربر
    const tokens = await refreshAccessToken(user.refreshToken);
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);
    await db.user.update({
      where: { id: userId },
      data: {
        accessToken: tokens.access_token,
        tokenExpiresAt: newExpiry,
        refreshToken: tokens.refresh_token ?? user.refreshToken,
      },
    });
    return tokens.access_token;
  }

  return user.accessToken!;
}

/** پاک‌سازی آدرس سایت برای نمایش */
export function cleanSiteUrl(siteUrl: string): { displayName: string; type: "DOMAIN" | "URL_PREFIX" } {
  if (siteUrl.startsWith("sc-domain:")) {
    return { displayName: siteUrl.replace("sc-domain:", ""), type: "DOMAIN" };
  }
  return { displayName: siteUrl, type: "URL_PREFIX" };
}

// ساختار پاسخ API لیست سایت‌ها
interface GscApiSite {
  siteUrl: string;
  permissionLevel: string;
}

/** واکشی لیست سایت‌های ثبت‌شده کاربر در سرچ کنسول */
export async function listSites(accessToken: string): Promise<GscSite[]> {
  const res = await fetch(`${GSC_API}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`خطا در دریافت سایت‌ها: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { siteEntry?: GscApiSite[] };
  const entries = data.siteEntry ?? [];

  return entries.map((entry) => {
    const { displayName, type } = cleanSiteUrl(entry.siteUrl);
    return {
      siteUrl: entry.siteUrl,
      displayName,
      type,
      // سایت‌هایی با سطح دسترسی siteUnverifiedUser تأیید نشده‌اند
      verified: entry.permissionLevel !== "siteUnverifiedUser",
      permissionLevel: entry.permissionLevel,
    } satisfies GscSite;
  });
}

// ساختار درخواست Search Analytics
interface SearchAnalyticsRequest {
  startDate: string;
  endDate: string;
  dimensions: string[];
  dimensionFilterGroups?: {
    groupType: string;
    filters: {
      dimension: string;
      operator?: string;
      expression?: string;
    }[];
  }[];
  rowLimit?: number;
  dataState?: string;
}

interface SearchAnalyticsResponse {
  rows?: {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
}

/** کوئری تحلیل جستجو (Search Analytics) — قلب بخش عملکرد */
export async function searchAnalytics(
  accessToken: string,
  siteUrl: string,
  body: SearchAnalyticsRequest
): Promise<DimensionRow[]> {
  const encodedSite = encodeURIComponent(siteUrl);
  const res = await fetch(
    `${GSC_API}/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rowLimit: 5000, ...body }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`خطا در تحلیل جستجو: ${res.status} ${text}`);
  }

  const data = (await res.json()) as SearchAnalyticsResponse;
  return (data.rows ?? []).map((row) => ({
    key: row.keys.join("، "),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr * 100, // تبدیل به درصد
    position: row.position,
  }));
}

/** کوئری روزانه برای نمودار خطی */
export async function searchAnalyticsDaily(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  filters?: SearchAnalyticsRequest["dimensionFilterGroups"]
): Promise<DailyRow[]> {
  const rows = await searchAnalytics(accessToken, siteUrl, {
    startDate,
    endDate,
    dimensions: ["date"],
    dimensionFilterGroups: filters,
  });

  return rows.map((r) => {
    // کلید تاریخ به شکل YYYY-MM-DD است
    const [y, m, d] = r.key.split("-");
    return {
      date: `${y}-${m}-${d}`,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    };
  });
}

/** محاسبه جمع معیارها از ردیف‌های روزانه */
export function sumTotals(rows: { clicks: number; impressions: number; ctr: number; position: number }[]): PerformanceTotals {
  const clicks = rows.reduce((a, r) => a + r.clicks, 0);
  const impressions = rows.reduce((a, r) => a + r.impressions, 0);
  const position = rows.length
    ? rows.reduce((a, r) => a + r.position * r.impressions, 0) / Math.max(impressions, 1)
    : 0;
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    position,
  };
}

// ساختار پاسخ API نقشه‌های سایت
interface GscSitemap {
  path: string;
  lastSubmitted?: string;
  lastDownloaded?: string;
  isPending?: boolean;
  isWmProcessed?: boolean;
  type?: string;
  errors?: string | number | null;
  warnings?: string | number | null;
  isSitemapsIndex?: boolean;
  contents?: {
    type: string;
    submitted: string | number;
    indexed: string | number;
  }[];
}

/** لیست نقشه‌های سایت */
export async function listSitemaps(accessToken: string, siteUrl: string) {
  const encodedSite = encodeURIComponent(siteUrl);
  const res = await fetch(`${GSC_API}/sites/${encodedSite}/sitemaps`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`خطا در دریافت نقشه‌های سایت: ${res.status}`);
  }
  const data = (await res.json()) as { sitemap?: GscSitemap[] };
  return (data.sitemap ?? []).map((s) => ({
    path: s.path,
    lastSubmitted: s.lastSubmitted ?? null,
    lastDownloaded: s.lastDownloaded ?? null,
    isPending: s.isPending ?? false,
    isWmProcessed: s.isWmProcessed ?? false,
    type: s.type ?? "web",
    errors: s.errors ? Number(s.errors) : null,
    warnings: s.warnings ? Number(s.warnings) : null,
    urlCount: s.contents?.[0]?.submitted ? Number(s.contents[0].submitted) : null,
    contents: (s.contents ?? []).map((c) => ({
      type: c.type,
      submitted: Number(c.submitted) || 0,
      indexed: Number(c.indexed) || 0,
    })),
  }));
}

/** ارسال نقشه سایت جدید */
export async function submitSitemap(accessToken: string, siteUrl: string, feedpath: string) {
  const encodedSite = encodeURIComponent(siteUrl);
  const encodedFeed = encodeURIComponent(feedpath);
  const res = await fetch(
    `${GSC_API}/sites/${encodedSite}/sitemaps/${encodedFeed}`,
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`خطا در ارسال نقشه سایت: ${res.status} ${text}`);
  }
  return true;
}

/** حذف نقشه سایت */
export async function deleteSitemap(accessToken: string, siteUrl: string, feedpath: string) {
  const encodedSite = encodeURIComponent(siteUrl);
  const encodedFeed = encodeURIComponent(feedpath);
  const res = await fetch(
    `${GSC_API}/sites/${encodedSite}/sitemaps/${encodedFeed}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`خطا در حذف نقشه سایت: ${res.status}`);
  }
  return true;
}

// ساختار پاسخ API بازرسی URL
interface UrlInspectionResponse {
  inspectionResult?: {
    inspectionStatus?: {
      verdict: string;
      state: string;
    };
    indexStatusResult?: {
      coverageState: string;
      crawledAs?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      robotsTxtState?: string;
      indexingVerdict?: string;
      indexingStates?: string[];
    };
    mobileUsabilityResult?: {
      verdict: string;
      issues?: { issueType: string; severity: string }[];
    };
    richResultsResult?: {
      verdict: string;
      detectedItems?: {
        items?: { issues?: { issueType: string; severity: string }[] }[];
        richResultType: string;
      }[];
    };
  };
}

/** بازرسی URL (URL Inspection API) */
export async function inspectUrl(
  accessToken: string,
  siteUrl: string,
  pageUrl: string
) {
  const res = await fetch(
    "https://searchconsole.googleapis.com/v1/urlInspection:inspect",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inspectionUrl: pageUrl,
        siteUrl,
        languageCode: "fa",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`خطا در بازرسی URL: ${res.status} ${text}`);
  }

  const data = (await res.json()) as UrlInspectionResponse;
  return data.inspectionResult ?? null;
}
