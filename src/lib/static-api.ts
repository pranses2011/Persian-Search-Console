"use client";

// ============================================================
//  نسخه استاتیک (cPanel) — موتور API سمت مرورگر
//  ------------------------------------------------------------
//  این ماژول فقط در بیلد استاتیک (NEXT_PUBLIC_STATIC_MODE=true)
//  فعال می‌شود و تمام درخواست‌های /api/* را به‌جای سرور،
//  در خود مرورگر پاسخ می‌دهد:
//    • حالت نمایشی: موتور داده mock (کاملاً آفلاین)
//    • حالت واقعی: فراخوانی مستقیم Google Search Console API
//      با توکن Google Identity Services (GIS) در مرورگر
//  نتیجه: برنامه بدون هیچ سروری روی هاست اشتراکی cPanel اجرا می‌شود.
// ============================================================

import type {
  AppUser,
  GscSite,
  DailyRow,
  DimensionRow,
  PerformanceTotals,
  PerformanceFilters,
  InspectionResult,
} from "@/lib/types";

// آیا این بیلد، نسخه استاتیک cPanel است؟ (مقدار در زمان بیلد درج می‌شود)
export const IS_STATIC_BUILD = process.env.NEXT_PUBLIC_STATIC_MODE === "true";

// کلیدهای حافظه مرورگر
const KEY_USER = "psc.user";
const KEY_TOKEN = "psc.gtoken";
const KEY_CLIENT_ID = "psc.gcid";
const KEY_DEMO_SITEMAPS = "psc.demo.sitemaps"; // تغییرات کاربر در دمو
const KEY_DEMO_REMOVALS = "psc.demo.removals";

// دامنه‌های دسترسی (Scope) مطابق نسخه سرور + پروفایل برای نمایش نام و ایمیل
const GSC_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
  "openid",
  "email",
  "profile",
].join(" ");

// آدرس پایه API سرچ کنسول گوگل
const GSC_API = "https://searchconsole.googleapis.com/webmasters/v3";

// ------------------------------------------------------------
// ابزارهای حافظه مرورگر
// ------------------------------------------------------------

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* حافظه پر است — نادیده بگیر */
  }
}
function lsDel(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

/** کاربر ذخیره‌شده (دمو یا گوگل) */
export function getStoredUser(): AppUser | null {
  return lsGet<AppUser>(KEY_USER);
}

/** Client ID گوگل که کاربر از تنظیمات وارد کرده است */
export function getStaticClientId(): string {
  return (lsGet<string>(KEY_CLIENT_ID) as string) || "";
}
export function setStaticClientId(id: string) {
  lsSet(KEY_CLIENT_ID, id.trim());
}

/** پاسخ JSON شبیه‌سازی‌شده سرور */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function errorJson(message: string, status: number): Response {
  return json({ error: message }, status);
}

// ------------------------------------------------------------
// ورود گوگل با Google Identity Services (GIS)
// ------------------------------------------------------------

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: Record<string, unknown>) => {
            requestAccessToken: (opts?: Record<string, unknown>) => void;
          };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

/** بارگذاری اسکریپت GIS گوگل */
async function loadGis(): Promise<NonNullable<Window["google"]>> {
  if (window.google?.accounts?.oauth2) return window.google;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () =>
      reject(new Error("بارگذاری سرویس ورود گوگل ناموفق بود — اتصال اینترنت را بررسی کنید"));
    document.head.appendChild(s);
  });
  // چند میلی‌ثانیه صبر تا شیء google ساخته شود
  for (let i = 0; i < 50 && !window.google?.accounts?.oauth2; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!window.google?.accounts?.oauth2) {
    throw new Error("سرویس ورود گوگل آماده نشد");
  }
  return window.google;
}

/** درخواست توکن از گوگل (نمایش پنجره رضایت در صورت نیاز) */
async function requestGoogleToken(prompt: string): Promise<string> {
  const clientId = getStaticClientId();
  if (!clientId) throw new Error("ابتدا شناسه کاربری گوگل (Client ID) را از دکمه تنظیمات وارد کنید");

  const google = await loadGis();
  const tokenResp = await new Promise<{ access_token: string; expires_in?: number }>(
    (resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GSC_SCOPES,
        callback: (resp: { access_token: string; expires_in?: number }) => resolve(resp),
        error_callback: (err: { type?: string }) =>
          reject(
            new Error(
              err?.type === "popup_closed"
                ? "پنجره ورود گوگل بسته شد"
                : "خطا در دریافت توکن از گوگل"
            )
          ),
      });
      client.requestAccessToken({ prompt });
    }
  );

  const expiresIn = (tokenResp.expires_in ?? 3600) * 1000;
  sessionStorage.setItem(
    KEY_TOKEN,
    JSON.stringify({ token: tokenResp.access_token, expiresAt: Date.now() + expiresIn })
  );
  return tokenResp.access_token;
}

/** ورود کامل با گوگل: توکن + پروفایل */
export async function staticGoogleLogin(): Promise<AppUser> {
  const token = await requestGoogleToken("consent");

  // دریافت پروفایل کاربر (نام، ایمیل، آواتار)
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("دریافت اطلاعات حساب گوگل ناموفق بود");
  const info = (await res.json()) as {
    sub: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  const user: AppUser = {
    id: "google-" + info.sub,
    email: info.email ?? "",
    name: info.name ?? null,
    avatarUrl: info.picture ?? null,
    isDemo: false,
  };
  lsSet(KEY_USER, user);
  return user;
}

/** توکن معتبر فعلی یا null */
function getStoredToken(): string | null {
  try {
    const raw = sessionStorage.getItem(KEY_TOKEN);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: number };
    if (!token || expiresAt - 60_000 < Date.now()) return null;
    return token;
  } catch {
    return null;
  }
}

/** توکن معتبر؛ در صورت انقضا تلاش برای تمدید بی‌صدا */
async function ensureGoogleToken(): Promise<string> {
  const existing = getStoredToken();
  if (existing) return existing;
  // تمدید بی‌صدا (کاربر قبلاً رضایت داده؛ معمولاً بدون پنجره)
  try {
    return await requestGoogleToken("");
  } catch {
    throw new Error("نشست گوگل منقضی شده است — دوباره وارد شوید");
  }
}

/** خروج کامل: پاک‌کردن توکن و کاربر */
export async function staticLogout() {
  const raw = sessionStorage.getItem(KEY_TOKEN);
  if (raw) {
    try {
      const { token } = JSON.parse(raw) as { token: string };
      window.google?.accounts.oauth2.revoke(token, () => undefined);
    } catch {
      /* noop */
    }
  }
  sessionStorage.removeItem(KEY_TOKEN);
  lsDel(KEY_USER);
}

// ------------------------------------------------------------
// فراخوانی‌های Google Search Console API از مرورگر
// (بازنویسی دقیق منطق src/lib/gsc.ts بدون وابستگی سرور)
// ------------------------------------------------------------

/** لیست سایت‌های ثبت‌شده کاربر */
async function googleListSites(token: string): Promise<GscSite[]> {
  const res = await fetch(`${GSC_API}/sites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`خطا در دریافت سایت‌ها از گوگل (${res.status})`);
  const data = (await res.json()) as {
    siteEntry?: { siteUrl: string; permissionLevel: string }[];
  };
  return (data.siteEntry ?? []).map((entry) => ({
    siteUrl: entry.siteUrl,
    displayName: entry.siteUrl.replace("sc-domain:", ""),
    type: entry.siteUrl.startsWith("sc-domain:") ? ("DOMAIN" as const) : ("URL_PREFIX" as const),
    verified: entry.permissionLevel !== "siteUnverifiedUser",
    permissionLevel: entry.permissionLevel,
  }));
}

/** کوئری تحلیل جستجو — ردیف‌های یک بعد */
async function googleSearchAnalytics(
  token: string,
  site: string,
  body: Record<string, unknown>
): Promise<DimensionRow[]> {
  const encoded = encodeURIComponent(site);
  const res = await fetch(`${GSC_API}/sites/${encoded}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ rowLimit: 5000, ...body }),
  });
  if (!res.ok) throw new Error(`خطا در تحلیل جستجو (${res.status})`);
  const data = (await res.json()) as {
    rows?: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[];
  };
  return (data.rows ?? []).map((row) => ({
    key: row.keys.join("، "),
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr * 100,
    position: row.position,
  }));
}

/** سری روزانه برای نمودار */
async function googleDaily(
  token: string,
  site: string,
  start: string,
  end: string,
  filters?: { groupType: string; filters: unknown[] }[]
): Promise<DailyRow[]> {
  const rows = await googleSearchAnalytics(token, site, {
    startDate: start,
    endDate: end,
    dimensions: ["date"],
    dimensionFilterGroups: filters,
  });
  return rows.map((r) => ({
    date: r.key,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));
}

/** جمع معیارها از ردیف‌های روزانه */
function sumTotals(rows: DailyRow[]): PerformanceTotals {
  const clicks = rows.reduce((a, r) => a + r.clicks, 0);
  const impressions = rows.reduce((a, r) => a + r.impressions, 0);
  const position = rows.length
    ? rows.reduce((a, r) => a + r.position * r.impressions, 0) / Math.max(impressions, 1)
    : 0;
  return { clicks, impressions, ctr: impressions > 0 ? (clicks / impressions) * 100 : 0, position };
}

// ------------------------------------------------------------
// پایدارسازی تغییرات دمو (نقشه‌ها و حذف‌ها) در localStorage
// ------------------------------------------------------------

interface SitemapChange {
  site: string;
  added: string[];
  removed: string[];
}
interface RemovalChange {
  site: string;
  added: { url: string; type: string }[];
  canceled: string[];
}

// سایت‌هایی که تغییراتشان یک بار بازیابی شده (جلوگیری از تکرار)
const replayedSites = new Set<string>();

/** بازیابی تغییرات ذخیره‌شده کاربر به حافظه موتور دمو */
async function replayDemoChanges(site: string) {
  if (replayedSites.has(site)) return;
  replayedSites.add(site);

  const mock = await import("./mock-sections");

  const sitemapChanges = lsGet<SitemapChange[]>(KEY_DEMO_SITEMAPS) ?? [];
  const sm = sitemapChanges.find((c) => c.site === site);
  if (sm) {
    sm.added.forEach((p) => mock.demoAddSitemap(site, p));
    sm.removed.forEach((p) => mock.demoRemoveSitemap(site, p));
  }

  const removalChanges = lsGet<RemovalChange[]>(KEY_DEMO_REMOVALS) ?? [];
  const rm = removalChanges.find((c) => c.site === site);
  if (rm) {
    rm.added.forEach((a) => mock.demoAddRemoval(site, a.url, a.type as never));
    rm.canceled.forEach((u) => mock.demoCancelRemoval(site, u));
  }
}

// ------------------------------------------------------------
// روتر مجازی API — قلب نسخه استاتیک
// ------------------------------------------------------------

async function handleApi(
  method: string,
  pathname: string,
  params: URLSearchParams,
  body: Record<string, unknown> | null
): Promise<Response> {
  const user = getStoredUser();

  // ---------- احراز هویت ----------
  if (pathname === "/api/auth/me" && method === "GET") {
    return json({
      user,
      googleConfigured: !!getStaticClientId(),
    });
  }

  if (pathname === "/api/auth/demo" && method === "POST") {
    const demoUser: AppUser = {
      id: "static-demo-user",
      email: "demo@persian-search-console.ir",
      name: "کاربر نمایشی",
      avatarUrl: null,
      isDemo: true,
    };
    lsSet(KEY_USER, demoUser);
    return json({ user: demoUser });
  }

  if (pathname === "/api/auth/logout" && method === "POST") {
    await staticLogout();
    return json({ ok: true });
  }

  // ---------- محافظت نشست ----------
  if (!user) {
    return errorJson("ابتدا وارد شوید", 401);
  }

  // ---------- سایت‌ها ----------
  if (pathname === "/api/sites" && method === "GET") {
    if (user.isDemo) {
      const demoSites: GscSite[] = [
        { siteUrl: "sc-domain:digiblog.ir", displayName: "digiblog.ir", type: "DOMAIN", verified: true, permissionLevel: "siteOwner" },
        { siteUrl: "https://shop.digiblog.ir/", displayName: "https://shop.digiblog.ir", type: "URL_PREFIX", verified: true, permissionLevel: "siteOwner" },
        { siteUrl: "https://devnotes.io/", displayName: "https://devnotes.io", type: "URL_PREFIX", verified: true, permissionLevel: "siteOwner" },
        { siteUrl: "sc-domain:tourism-hub.ir", displayName: "tourism-hub.ir", type: "DOMAIN", verified: true, permissionLevel: "siteOwner" },
        { siteUrl: "https://test.newsite.ir/", displayName: "https://test.newsite.ir", type: "URL_PREFIX", verified: false, permissionLevel: "siteUnverifiedUser" },
      ];
      return json({ sites: demoSites, demo: true });
    }
    try {
      const token = await ensureGoogleToken();
      const sites = await googleListSites(token);
      return json({ sites, demo: false });
    } catch (err) {
      return errorJson(err instanceof Error ? err.message : "خطا در دریافت سایت‌ها", 500);
    }
  }

  // ---------- عملکرد جستجو ----------
  if (pathname === "/api/performance" && method === "GET") {
    const site = params.get("site") || "";
    const start = params.get("start") || "";
    const end = params.get("end") || "";
    const dimension = params.get("dimension") || "query";
    const compare = params.get("compare") === "true";
    const filters: PerformanceFilters = {
      query: params.get("query") || undefined,
      page: params.get("page") || undefined,
      country: params.get("country") || undefined,
      device: params.get("device") || undefined,
      searchAppearance: params.get("searchAppearance") || undefined,
    };
    if (!site || !start || !end) {
      return errorJson("پارامترهای site، start و end الزامی هستند", 400);
    }

    if (user.isDemo) {
      const engine = await import("./mock-engine");
      const daily = engine.dailyRange(site, start, end);
      const totals = engine.totalsOf(daily);
      const rows = engine.dimensionRows(site, dimension, start, end, filters);
      let previousTotals: PerformanceTotals | undefined;
      if (compare) {
        const prev = engine.previousRange(start, end);
        previousTotals = engine.totalsOf(engine.dailyRange(site, prev.start, prev.end));
      }
      return json({ totals, previousTotals, daily, rows, dimension, demo: true });
    }

    try {
      const token = await ensureGoogleToken();
      const gscFilters = Object.entries(filters)
        .filter(([, v]) => v)
        .map(([k, v]) => ({ dimension: k, operator: "contains", expression: v }));
      const filterGroups = gscFilters.length
        ? [{ groupType: "and", filters: gscFilters }]
        : undefined;

      const daily = await googleDaily(token, site, start, end, filterGroups);
      const rows = await googleSearchAnalytics(token, site, {
        startDate: start,
        endDate: end,
        dimensions: [dimension],
        dimensionFilterGroups: filterGroups,
      });

      const COUNTRY_FA: Record<string, string> = {
        irn: "ایران", usa: "ایالات متحده", deu: "آلمان", can: "کانادا",
        are: "امارات متحده عربی", tur: "ترکیه", gbr: "بریتانیا", aus: "استرالیا",
      };
      const DEVICE_FA: Record<string, string> = { mobile: "موبایل", desktop: "دسکتاپ", tablet: "تبلت" };
      const APPEARANCE_FA: Record<string, string> = {
        web: "نتایج وب", image: "نتایج تصویری", video: "نتایج ویدیویی",
        news: "نتایج خبری", discover: "گوگل دیسکاور", rich_result: "نتیجه غنی",
      };
      const translated = rows.map((r) => {
        let key = r.key;
        if (dimension === "country") key = COUNTRY_FA[r.key.toLowerCase()] ?? r.key;
        else if (dimension === "device") key = DEVICE_FA[r.key.toLowerCase()] ?? r.key;
        else if (dimension === "searchAppearance") key = APPEARANCE_FA[r.key.toLowerCase()] ?? r.key;
        return { ...r, key };
      });

      let totals: PerformanceTotals;
      if (daily.length > 0) {
        totals = sumTotals(daily);
      } else {
        const totalRows = await googleSearchAnalytics(token, site, {
          startDate: start,
          endDate: end,
          dimensions: [],
          dimensionFilterGroups: filterGroups,
        });
        totals = totalRows[0]
          ? { clicks: totalRows[0].clicks, impressions: totalRows[0].impressions, ctr: totalRows[0].ctr, position: totalRows[0].position }
          : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
      }

      let previousTotals: PerformanceTotals | undefined;
      if (compare) {
        const engine = await import("./mock-engine");
        const prev = engine.previousRange(start, end);
        const prevDaily = await googleDaily(token, site, prev.start, prev.end, filterGroups);
        previousTotals = prevDaily.length ? sumTotals(prevDaily) : undefined;
      }

      return json({ totals, previousTotals, daily, rows: translated, dimension, demo: false });
    } catch (err) {
      return errorJson(err instanceof Error ? err.message : "دریافت داده‌های عملکرد ناموفق بود", 500);
    }
  }

  // ---------- بازرسی URL ----------
  if (pathname === "/api/inspection" && method === "GET") {
    const site = params.get("site") || "";
    const url = params.get("url") || "";
    if (!site || !url) return errorJson("پارامترهای site و url الزامی هستند", 400);
    if (!url.startsWith("http") && !url.startsWith("/")) {
      return errorJson("آدرس باید با http یا / شروع شود", 400);
    }

    if (user.isDemo) {
      const mock = await import("./mock-sections");
      const fullUrl = url.startsWith("/")
        ? "https://" + site.replace("sc-domain:", "") + url
        : url;
      return json(mock.mockInspectUrl(site, fullUrl));
    }

    try {
      const token = await ensureGoogleToken();
      const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection:inspect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionUrl: url, siteUrl: site, languageCode: "fa" }),
      });
      if (!res.ok) {
        return errorJson(`بازرسی URL ناموفق بود (${res.status})`, res.status);
      }
      const data = (await res.json()) as {
        inspectionResult?: {
          inspectionStatus?: { state?: string };
          indexStatusResult?: {
            coverageState?: string;
            lastCrawlTime?: string;
            crawledAs?: string;
          };
          mobileUsabilityResult?: {
            verdict?: string;
            issues?: { issueType: string }[];
          };
          richResultsResult?: {
            detectedItems?: {
              richResultType: string;
              items?: { issues?: { severity?: string }[] }[];
            }[];
          };
        };
      };
      const r = data.inspectionResult;
      if (!r) return errorJson("نتیجه‌ای برای این URL دریافت نشد", 404);

      const inspection: InspectionResult = {
        url,
        indexStatus: r.inspectionStatus?.state === "INDEXED" ? "INDEXED" : "NOT_INDEXED",
        lastCrawl: r.indexStatusResult?.lastCrawlTime ?? null,
        indexingMethod: r.indexStatusResult?.crawledAs ? "USER_SELECTED_CANONICAL" : null,
        mobileUsable: r.mobileUsabilityResult?.verdict === "PASS",
        mobileIssues: (r.mobileUsabilityResult?.issues ?? []).map((i) => i.issueType),
        richResults: (r.richResultsResult?.detectedItems ?? []).flatMap((item) =>
          (item.items ?? []).flatMap((sub) =>
            (sub.issues ?? []).map((issue) => ({
              type: item.richResultType,
              state:
                issue.severity === "ERROR" ? "ERROR" : issue.severity === "WARNING" ? "WARNING" : "VALID",
            }))
          )
        ),
        ampStatus: null,
        httpCode: (r.indexStatusResult?.coverageState ?? "").includes("SERVER_ERROR") ? 500 : 200,
        canonical: null,
        sitemapFound: (r.indexStatusResult?.coverageState ?? "").includes("SITEMAP"),
        referrerUrls: [],
        demo: false,
      };
      return json(inspection);
    } catch (err) {
      return errorJson(err instanceof Error ? err.message : "بازرسی URL ناموفق بود", 500);
    }
  }

  // ---------- بخش‌های گزارشی (ایندکس، موبایل، امنیت، ...) ----------
  const reportRoutes: Record<string, string> = {
    "/api/indexing": "mockIndexing",
    "/api/mobile": "mockMobile",
    "/api/security": "mockSecurity",
    "/api/rich-results": "mockRichResults",
    "/api/links": "mockLinks",
    "/api/vitals": "mockVitals",
  };

  if (reportRoutes[pathname] && method === "GET") {
    const site = params.get("site") || "";
    if (!site) return errorJson("پارامتر site الزامی است", 400);
    const mock = await import("./mock-sections");
    const fnName = reportRoutes[pathname];
    const fn = (mock as unknown as Record<string, (site: string) => unknown>)[fnName];
    return json(fn(site));
  }

  // ---------- نقشه‌های سایت ----------
  if (pathname === "/api/sitemaps") {
    const site = params.get("site") || body?.site as string || "";
    await replayDemoChanges(site);

    if (method === "GET") {
      if (!site) return errorJson("پارامتر site الزامی است", 400);
      if (user.isDemo) {
        const mock = await import("./mock-sections");
        return json({ sitemaps: mock.mockSitemaps(site), demo: true });
      }
      try {
        const token = await ensureGoogleToken();
        const encoded = encodeURIComponent(site);
        const res = await fetch(`${GSC_API}/sites/${encoded}/sitemaps`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return errorJson(`دریافت نقشه‌های سایت ناموفق بود (${res.status})`, 500);
        const data = (await res.json()) as {
          sitemap?: {
            path: string;
            lastSubmitted?: string;
            lastDownloaded?: string;
            isPending?: boolean;
            isWmProcessed?: boolean;
            type?: string;
            errors?: string | number | null;
            warnings?: string | number | null;
            contents?: { type: string; submitted: string | number; indexed: string | number }[];
          }[];
        };
        const sitemaps = (data.sitemap ?? []).map((s) => ({
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
        return json({ sitemaps, demo: false });
      } catch (err) {
        return errorJson(err instanceof Error ? err.message : "خطا در نقشه‌های سایت", 500);
      }
    }

    if (method === "POST") {
      const feedpath = (body?.feedpath as string) || "";
      if (!site || !feedpath) return errorJson("site و feedpath الزامی هستند", 400);
      if (!feedpath.startsWith("http") || !feedpath.endsWith(".xml")) {
        return errorJson(
          "آدرس نقشه سایت باید کامل و با پسوند xml باشد — مثال: https://example.ir/sitemap.xml",
          400
        );
      }
      if (user.isDemo) {
        const mock = await import("./mock-sections");
        const item = mock.demoAddSitemap(site, feedpath);
        // ذخیره پایدار در localStorage
        const all = lsGet<SitemapChange[]>(KEY_DEMO_SITEMAPS) ?? [];
        const rec = all.find((c) => c.site === site) ?? { site, added: [], removed: [] };
        if (!all.includes(rec)) all.push(rec);
        rec.added = [feedpath, ...rec.added.filter((p) => p !== feedpath)];
        rec.removed = rec.removed.filter((p) => p !== feedpath);
        lsSet(KEY_DEMO_SITEMAPS, all);
        return json({ ok: true, item, demo: true });
      }
      try {
        const token = await ensureGoogleToken();
        const encoded = encodeURIComponent(site);
        const encodedFeed = encodeURIComponent(feedpath);
        const res = await fetch(`${GSC_API}/sites/${encoded}/sitemaps/${encodedFeed}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return errorJson(`ارسال نقشه سایت ناموفق بود (${res.status})`, 500);
        return json({ ok: true, demo: false });
      } catch (err) {
        return errorJson(err instanceof Error ? err.message : "ارسال نقشه سایت ناموفق بود", 500);
      }
    }

    if (method === "DELETE") {
      const feedpath = params.get("feedpath") || "";
      if (!site || !feedpath) return errorJson("site و feedpath الزامی هستند", 400);
      if (user.isDemo) {
        const mock = await import("./mock-sections");
        mock.demoRemoveSitemap(site, feedpath);
        const all = lsGet<SitemapChange[]>(KEY_DEMO_SITEMAPS) ?? [];
        const rec = all.find((c) => c.site === site);
        if (!rec) {
          all.push({ site, added: [], removed: [feedpath] });
          lsSet(KEY_DEMO_SITEMAPS, all);
        } else {
          rec.added = rec.added.filter((p) => p !== feedpath);
          rec.removed = [...rec.removed, feedpath];
          lsSet(KEY_DEMO_SITEMAPS, all);
        }
        return json({ ok: true, demo: true });
      }
      try {
        const token = await ensureGoogleToken();
        const encoded = encodeURIComponent(site);
        const encodedFeed = encodeURIComponent(feedpath);
        const res = await fetch(`${GSC_API}/sites/${encoded}/sitemaps/${encodedFeed}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok && res.status !== 404) {
          return errorJson(`حذف نقشه سایت ناموفق بود (${res.status})`, 500);
        }
        return json({ ok: true, demo: false });
      } catch (err) {
        return errorJson(err instanceof Error ? err.message : "حذف نقشه سایت ناموفق بود", 500);
      }
    }
  }

  // ---------- حذف موقت ----------
  if (pathname === "/api/removals") {
    const site = params.get("site") || (body?.site as string) || "";
    await replayDemoChanges(site);

    if (method === "GET") {
      if (!site) return errorJson("پارامتر site الزامی است", 400);
      const mock = await import("./mock-sections");
      return json({ items: mock.mockRemovals(site), demo: true });
    }

    if (method === "POST") {
      const url = (body?.url as string) || "";
      const type = (body?.type as string) || "";
      if (!site || !url || !type) return errorJson("site، url و type الزامی هستند", 400);
      if (!url.startsWith("/") && !url.startsWith("http")) {
        return errorJson("آدرس باید با http یا / شروع شود", 400);
      }
      const mock = await import("./mock-sections");
      const item = mock.demoAddRemoval(site, url, type as never);
      // ذخیره پایدار
      const all = lsGet<RemovalChange[]>(KEY_DEMO_REMOVALS) ?? [];
      const rec = all.find((c) => c.site === site) ?? { site, added: [], canceled: [] };
      if (!all.includes(rec)) all.push(rec);
      rec.added = [{ url, type }, ...rec.added.filter((a) => a.url !== url)];
      lsSet(KEY_DEMO_REMOVALS, all);
      return json({ ok: true, item, demo: true });
    }

    if (method === "DELETE") {
      const url = params.get("url") || "";
      if (!site || !url) return errorJson("site و url الزامی هستند", 400);
      const mock = await import("./mock-sections");
      mock.demoCancelRemoval(site, url);
      const all = lsGet<RemovalChange[]>(KEY_DEMO_REMOVALS) ?? [];
      const rec = all.find((c) => c.site === site);
      if (!rec) {
        all.push({ site, added: [{ url, type: "REMOVE_SINGLE_URL" }], canceled: [url] });
        lsSet(KEY_DEMO_REMOVALS, all);
      } else {
        rec.canceled = [...rec.canceled, url];
        lsSet(KEY_DEMO_REMOVALS, all);
      }
      return json({ ok: true, demo: true });
    }
  }

  // ---------- خلاصه و نوتیفیکیشن ----------
  if (pathname === "/api/summary" && method === "GET") {
    const site = params.get("site") || "";
    const start = params.get("start") || "";
    const end = params.get("end") || "";
    if (!site || !start || !end) {
      return errorJson("site، start و end الزامی هستند", 400);
    }

    if (user.isDemo) {
      const mock = await import("./mock-sections");
      return json(mock.mockSummary(site, start, end));
    }

    try {
      const token = await ensureGoogleToken();
      const daily = await googleDaily(token, site, start, end);
      const totals = daily.length
        ? sumTotals(daily)
        : { clicks: 0, impressions: 0, ctr: 0, position: 0 };

      const engine = await import("./mock-engine");
      const prev = engine.previousRange(start, end);
      const prevDaily = await googleDaily(token, site, prev.start, prev.end);
      const prevTotals = prevDaily.length ? sumTotals(prevDaily) : undefined;

      const notifications: {
        id: string;
        severity: "error" | "success" | "warning" | "info";
        title: string;
        description: string;
        date: string;
      }[] = [];
      const clicksDelta = prevTotals?.clicks
        ? ((totals.clicks - prevTotals.clicks) / prevTotals.clicks) * 100
        : 0;
      if (clicksDelta <= -15) {
        notifications.push({
          id: "perf-drop",
          severity: "error",
          title: "افت کلیک‌ها",
          description: `کلیک‌ها نسبت به بازه قبل ${Math.abs(clicksDelta).toFixed(0)}٪ کاهش داشته است.`,
          date: end,
        });
      } else if (clicksDelta >= 20) {
        notifications.push({
          id: "perf-rise",
          severity: "success",
          title: "رشد کلیک‌ها",
          description: `کلیک‌ها ${clicksDelta.toFixed(0)}٪ رشد کرده است!`,
          date: end,
        });
      }

      const score = Math.min(
        100,
        Math.round(50 + Math.min(50, (totals.impressions / 100000) * 50) + (clicksDelta > 0 ? 10 : 0))
      );

      return json({
        score,
        summary: `در این بازه سایت شما ${totals.clicks} کلیک و ${totals.impressions} نمایش در گوگل داشته است.`,
        notifications,
        totals: {
          clicks: totals.clicks,
          impressions: totals.impressions,
          ctr: totals.ctr,
          position: totals.position,
          deltaClicks: prevTotals?.clicks
            ? ((totals.clicks - prevTotals.clicks) / prevTotals.clicks) * 100
            : undefined,
          deltaImpressions: prevTotals?.impressions
            ? ((totals.impressions - prevTotals.impressions) / prevTotals.impressions) * 100
            : undefined,
        },
        demo: false,
      });
    } catch (err) {
      return errorJson(err instanceof Error ? err.message : "محاسبه خلاصه ناموفق بود", 500);
    }
  }

  // مسیر ناشناخته
  return errorJson("مسیر API در نسخه استاتیک پشتیبانی نمی‌شود", 404);
}

// ------------------------------------------------------------
// نصب شیم fetch — پیش از هر درخواستی از سمت برنامه
// ------------------------------------------------------------

let installed = false;

/** نصب intercept داخلی fetch برای مسیرهای /api/* */
export function installStaticApi() {
  if (!IS_STATIC_BUILD || typeof window === "undefined" || installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // فقط مسیرهای داخلی برنامه را مدیریت می‌کنیم؛ بقیه عادی ادامه می‌یابند
    if (url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/")) {
      const parsed = new URL(url, window.location.origin);
      let body: Record<string, unknown> | null = null;
      if (init?.body && typeof init.body === "string") {
        try {
          body = JSON.parse(init.body) as Record<string, unknown>;
        } catch {
          body = null;
        }
      }
      return handleApi(init?.method?.toUpperCase() ?? "GET", parsed.pathname, parsed.searchParams, body);
    }

    return originalFetch(input, init);
  };
}
