// ============================================================
//  موتور داده نمایشی — بخش ۲: بازرسی URL و ایندکس‌گذاری
//  تولید قطعی داده برای ۳.۲ و ۳.۳
// ============================================================

import { seeded, daysAgo, hashString } from "./mock-engine";
import type {
  InspectionResult, IndexingResponse, IndexingCategory,
  MobileResponse, MobileIssue, SitemapItem,
} from "@/lib/types";

// ------------------------------------------------------------
// ۳.۲ — بازرسی URL
// ------------------------------------------------------------

// برچسب فارسی وضعیت‌های ایندکس
export const INDEX_STATUS_FA: Record<string, { label: string; severity: "good" | "warning" | "error" | "info" }> = {
  INDEXED: { label: "ایندکس شده", severity: "good" },
  NOT_INDEXED: { label: "ایندکس نشده", severity: "error" },
  DISCOVERED_NOT_INDEXED: { label: "کشف شده اما ایندکس نشده", severity: "warning" },
  CRAWLED_NOT_INDEXED: { label: "خزش شده اما ایندکس نشده", severity: "warning" },
  BLOCKED_BY_ROBOTS: { label: "مسدود توسط robots.txt", severity: "error" },
  NOINDEX: { label: "دستور noindex دارد", severity: "error" },
  REDIRECT: { label: "ریدایرکت می‌شود", severity: "info" },
  NOT_FOUND: { label: "یافت نشد (۴۰۴)", severity: "error" },
  SERVER_ERROR: { label: "خطای سرور (۵xx)", severity: "error" },
};

const METHOD_FA: Record<string, string> = {
  USER_SELECTED_CANONICAL: "کانونیکال انتخابی شما",
  GOOGLE_SELECTED_CANONICAL: "کانونیکال انتخابی گوگل",
  DUPLICATE: "صفحه تکراری",
  CRAWL_NOT_INDEXED: "خزش بدون ایندکس",
};

/** بازرسی قطعی یک URL بر اساس هش سایت+آدرس */
export function mockInspectUrl(site: string, url: string): InspectionResult {
  // هش URL تعیین‌کننده وضعیت است — همان URL همیشه همان نتیجه
  const h = hashString(site + ":" + url);
  const rnd = seeded(site + ":" + url, 10);

  // توزیع وضعیت: ۶۸٪ ایندکس، ۹٪ خزش بدون ایندکس، ۶٪ کشف بدون ایندکس، ...
  const statuses: InspectionResult["indexStatus"][] = [
    "INDEXED", "INDEXED", "INDEXED", "INDEXED", "INDEXED", "INDEXED", "INDEXED",
    "INDEXED", "INDEXED", "INDEXED", "INDEXED", "INDEXED", "INDEXED", "INDEXED",
    "CRAWLED_NOT_INDEXED", "CRAWLED_NOT_INDEXED",
    "DISCOVERED_NOT_INDEXED", "DISCOVERED_NOT_INDEXED",
    "BLOCKED_BY_ROBOTS",
    "NOINDEX",
    "REDIRECT",
  ];
  const status = statuses[h % statuses.length];

  // آخرین خزش: ۱ تا ۲۸ روز پیش (ایندکس‌شده‌ها تازه‌تر)
  const crawledDaysAgo =
    status === "INDEXED" ? 1 + Math.floor(rnd() * 10) : 5 + Math.floor(rnd() * 23);

  // نتایج غنی برای صفحات ایندکس‌شده
  const richTypes = [
    { type: "سوالات متداول (FAQ)", fa: true },
    { type: "مقاله (Article)", fa: true },
    { type: "مسیر راهنما (Breadcrumb)", fa: true },
    { type: "نظرات کاربران (Review)", fa: true },
  ];
  const richResults =
    status === "INDEXED"
      ? richTypes
          .filter(() => rnd() > 0.55)
          .map((t) => ({
            type: t.type,
            state: (rnd() > 0.25 ? "VALID" : rnd() > 0.5 ? "WARNING" : "ERROR") as
              | "VALID"
              | "WARNING"
              | "ERROR",
          }))
          .slice(0, 3)
      : [];

  // مشکلات موبایل
  const mobileIssuesPool = [
    "متن خیلی کوچک است",
    "عناصر کلیک خیلی نزدیک هم هستند",
    "محتوا از عرض صفحه بیرون زده است",
    "viewport تنظیم نشده است",
  ];
  const mobileIssues =
    status === "INDEXED"
      ? rnd() > 0.75
        ? [mobileIssuesPool[h % mobileIssuesPool.length]]
        : []
      : rnd() > 0.4
        ? [mobileIssuesPool[(h >> 3) % mobileIssuesPool.length]]
        : [];

  return {
    url,
    indexStatus: status,
    lastCrawl: status === "DISCOVERED_NOT_INDEXED" ? null : daysAgo(crawledDaysAgo),
    indexingMethod:
      status === "INDEXED"
        ? rnd() > 0.35
          ? "USER_SELECTED_CANONICAL"
          : "GOOGLE_SELECTED_CANONICAL"
        : status === "CRAWLED_NOT_INDEXED"
          ? "DUPLICATE"
          : null,
    mobileUsable: mobileIssues.length === 0,
    mobileIssues,
    richResults,
    ampStatus: rnd() > 0.85 ? "VALID" : "NONE",
    httpCode: status === "NOT_FOUND" ? 404 : status === "SERVER_ERROR" ? 500 : status === "REDIRECT" ? 301 : 200,
    canonical:
      status === "REDIRECT"
        ? url.replace(/\/?$/, "/home")
        : status === "CRAWLED_NOT_INDEXED"
          ? url + "?utm=source"
          : url,
    sitemapFound: rnd() > 0.25,
    referrerUrls:
      status === "INDEXED"
        ? [`https://www.google.com/`, `https://digiblog.ir/blog`].slice(0, 1 + (h % 2))
        : [],
    demo: true,
  };
}

// ------------------------------------------------------------
// ۳.۳ — ایندکس‌گذاری صفحات
// ------------------------------------------------------------

/** ساخت پاسخ ایندکس‌گذاری قطعی برای سایت */
export function mockIndexing(site: string): IndexingResponse {
  const rnd = seeded(site, 20);
  const total = 850 + Math.floor(rnd() * 1400); // کل صفحات کشف‌شده

  // سهم ایندکس‌شده ۶۰-۸۵٪
  const indexedShare = 0.6 + rnd() * 0.25;
  const indexed = Math.round(total * indexedShare);
  const notIndexed = total - indexed;

  // دسته‌های عدم ایندکس با توضیح و راهنمای رفع فارسی
  const remaining = notIndexed;
  const cat = (share: number) => Math.round(remaining * share);

  const categories: IndexingCategory[] = [
    {
      id: "crawled-not-indexed",
      title: "خزش شده اما ایندکس نشده",
      count: cat(0.32),
      description:
        "گوگل این صفحات را دیده و محتوایشان را خوانده، اما تصمیم گرفته آن‌ها را در نتایج جستجو نمایش ندهد؛ معمولاً به دلیل محتوای کم‌ارزش، تکراری یا بی‌کیفیت.",
      fixGuide:
        "محتوای صفحات را ارزشمندتر و منحصربه‌فرد کنید؛ صفحات بی‌ارزش را حذف یا با صفحات مرتبط ادغام کنید؛ ساختار لینک‌های داخلی را تقویت کنید.",
      severity: "warning",
      sampleUrls: [
        "/blog/tag/page-3",
        "/shop?sort=price&dir=asc",
        "/blog/author/old-writer",
        "/old-promotion-2022",
        "/blog/print/134",
      ],
    },
    {
      id: "discovered-not-indexed",
      title: "کشف شده اما ایندکس نشده",
      count: cat(0.24),
      description:
        "گوگل آدرس این صفحات را پیدا کرده (مثلاً از نقشه سایت) اما هنوز فرصت نکرده محتوایشان را بخواند؛ صفحات جدید معمولاً چند هفته در این وضعیت می‌مانند.",
      fixGuide:
        "صبور باشید و از نقشه سایت به‌روز استفاده کنید؛ لینک‌های داخلی به این صفحات را افزایش دهید تا گوگل آن‌ها را مهم‌تر بداند.",
      severity: "info",
      sampleUrls: [
        "/blog/new-guide-1404",
        "/products/winter-collection",
        "/blog/seo-checklist",
      ],
    },
    {
      id: "duplicate",
      title: "صفحه تکراری (Canonical)",
      count: cat(0.14),
      description:
        "این صفحات تقریباً همان محتوای صفحه دیگری را دارند؛ گوگل نسخه اصلی را انتخاب کرده و این نسخه‌ها را به‌عنوان تکراری کنار گذاشته است.",
      fixGuide:
        "برای نسخه‌های عمدی (مثل نسخه چاپی) برچسب canonical به صفحه اصلی اضافه کنید؛ پارامترهای اضافی URL را با ریدایرکت ۳۰۱ ادغام کنید.",
      severity: "warning",
      sampleUrls: [
        "/blog/seo-guide?utm=social",
        "/blog/seo-guide?print=1",
        "/shop/laptops?page=1&sort=pop",
      ],
    },
    {
      id: "noindex",
      title: "دستور noindex",
      count: cat(0.1),
      description:
        "این صفحات عمداً یا سهوی با تگ noindex علامت خورده‌اند و به گوگل گفته‌اند «مرا ایندکس نکن».",
      fixGuide:
        "اگر ایندکس این صفحات را می‌خواهید، تگ noindex را از کد یا تنظیمات قالب حذف کنید. صفحات مدیریتی (پنل ورود، سبد خرید) بهتر است noindex بمانند.",
      severity: "error",
      sampleUrls: ["/admin/login", "/cart", "/checkout/step-2"],
    },
    {
      id: "blocked-robots",
      title: "مسدود توسط robots.txt",
      count: cat(0.08),
      description:
        "فایل robots.txt سایت شما به گوگل اجازه خواندن این صفحات را نمی‌دهد؛ بنابراین گوگل نمی‌تواند آن‌ها را ببیند.",
      fixGuide:
        "فایل robots.txt را بررسی کنید و اگر مسیر مهمی اشتباهی مسدود شده، آن را آزاد کنید. برای مسدود کردن عمدی، از noindex به‌جای robots.txt استفاده کنید.",
      severity: "error",
      sampleUrls: ["/search-results", "/wp-admin/", "/tmp-staging"],
    },
    {
      id: "soft-404",
      title: "خطای ۴۰۴ نرم (Soft 404)",
      count: cat(0.06),
      description:
        "این صفحات کد ۲۰۰ (موفق) برمی‌گردانند اما محتوای آن‌ها «یافت نشد» یا خالی است؛ گوگل آن‌ها را مثل صفحه خطا رفتار می‌کند.",
      fixGuide:
        "برای صفحات حذف‌شده کد واقعی ۴۰۴ برگردانید؛ صفحاتی که محتوایشان تمام شده را ریدایرکت ۳۰۱ به صفحه مرتبط بدهید.",
      severity: "warning",
      sampleUrls: ["/products/out-of-stock-122", "/blog/deleted-post"],
    },
    {
      id: "redirect",
      title: "ریدایرکت (انتقال آدرس)",
      count: cat(0.04),
      description: "این آدرس‌ها به آدرس دیگری منتقل می‌شوند و به‌صورت جداگانه ایندکس نمی‌شوند.",
      fixGuide:
        "ریدایرکت‌های عمدی مشکلی ندارند؛ فقط زنجیره‌های طولانی ریدایرکت را به یک مرحله کاهش دهید تا سرعت بهتر شود.",
      severity: "info",
      sampleUrls: ["/old-url-guide", "/2019/old-post"],
    },
    {
      id: "not-found",
      title: "یافت نشد (۴۰۴)",
      count: cat(0.02),
      description: "این آدرس‌ها وجود ندارند و سرور کد خطای ۴۰۴ برمی‌گرداند.",
      fixGuide:
        "اگر صفحه مهمی بوده، آدرس درست را در نقشه سایت اصلاح کنید؛ در غیر این صورت لینک‌های داخلی به صفحات ۴۰۴ را حذف کنید.",
      severity: "error",
      sampleUrls: ["/missing-page-x"],
    },
    {
      id: "server-error",
      title: "خطای سرور (۵xx)",
      count: cat(0.0),
      description: "سرور هنگام خواندن این صفحات خطا داده است؛ مثل قطعی موقت یا فشار زیاد.",
      fixGuide:
        "با هاست خود بررسی کنید. اگر خطا موقت بوده، درخواست ایندکس مجدد بفرستید.",
      severity: "error",
      sampleUrls: [],
    },
  ];

  // روند ماهانه ایندکس (۱۲ ماه اخیر)
  const trend: { date: string; indexed: number; notIndexed: number }[] = [];
  for (let m = 12; m >= 0; m--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - m);
    const monthIso = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-01`;
    const progress = (12 - m) / 12;
    trend.push({
      date: monthIso,
      indexed: Math.round(indexed * (0.78 + progress * 0.22)),
      notIndexed: Math.round(notIndexed * (1.25 - progress * 0.25)),
    });
  }

  return { total, indexed, notIndexed, categories, trend, demo: true };
}

// ------------------------------------------------------------
// ۳.۴ — قابلیت استفاده در موبایل
// ------------------------------------------------------------

/** گزارش مشکلات موبایل قطعی برای سایت */
export function mockMobile(site: string): MobileResponse {
  const rnd = seeded(site, 30);

  const issues: MobileIssue[] = [
    {
      id: "small-text",
      type: "TEXT_TOO_SMALL",
      title: "متن خیلی کوچک است",
      count: 4 + Math.floor(rnd() * 18),
      severity: "error",
      description:
        "بیشترِ متن‌های این صفحات در موبایل خیلی ریز هستند و کاربر برای خواندن باید بزرگ‌نمایی کند. فونت کمتر از ۱۲ پیکسل معمولاً مشکل‌ساز است.",
      solution:
        "اندازه فونت متن اصلی را در موبایل حداقل ۱۶ پیکسل کنید. اگر از CSS جدا برای موبایل دارید، اندازه‌ها را بازبینی کنید.",
      sampleUrls: ["/blog/old-post-12", "/about-us", "/blog/tag/history"],
    },
    {
      id: "tap-elements",
      type: "CLICKABLE_ELEMENTS_TOO_CLOSE",
      title: "عناصر کلیک نزدیک هم هستند",
      count: 2 + Math.floor(rnd() * 12),
      severity: "error",
      description:
        "دکمه‌ها یا لینک‌های خیلی نزدیک به هم باعث می‌شوند کاربر در موبایل اشتباهی روی گزینه دیگری کلیک کند.",
      solution:
        "فاصله حداقل ۴۸ پیکسل بین عناصر قابل کلیک رعایت کنید؛ منوهای موبایل را بزرگ‌تر و با فاصله طراحی کنید.",
      sampleUrls: ["/shop/", "/blog/category/tech"],
    },
    {
      id: "wide-content",
      type: "CONTENT_WIDER_THAN_SCREEN",
      title: "محتوا از عرض صفحه بیرون زده",
      count: 1 + Math.floor(rnd() * 9),
      severity: "error",
      description:
        "بخشی از محتوا (مثل تصویر بزرگ یا جدول عریض) از لبه صفحه موبایل بیرون می‌زند و کاربر مجبور به اسکرول افقی می‌شود.",
      solution:
        "به تصاویر استایل max-width:100% بدهید؛ جدول‌های عریض را در قاب اسکرول‌دار قرار دهید؛ از اعداد ثابت پیکسلی در CSS پرهیز کنید.",
      sampleUrls: ["/blog/pricing-2024", "/products/compare-table"],
    },
    {
      id: "viewport",
      type: "VIEWPORT_NOT_SET",
      title: "viewport تنظیم نشده است",
      count: Math.floor(rnd() * 3),
      severity: "warning",
      description:
        "برچسب viewport در این صفحات تعریف نشده و مرورگر موبایل صفحه را مثل دسکتاپ کوچک نمایش می‌دهد.",
      solution:
        "تگ <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> را به بخش head همه صفحات اضافه کنید.",
      sampleUrls: ["/legacy-page"],
    },
  ].filter((i) => i.count > 0);

  // روند مشکلات (کاهش تدریجی با اصلاح)
  const trend: { date: string; errors: number }[] = [];
  const base = issues.reduce((a, i) => a + i.count, 0) || 8;
  for (let m = 12; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    trend.push({
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      errors: Math.max(0, Math.round(base * (1.6 - ((12 - m) / 12) * 0.6))),
    });
  }

  return { issues, trend, demo: true };
}

// ------------------------------------------------------------
// ۳.۵ — نقشه‌های سایت (با حالت تعاملی برای دمو)
// ------------------------------------------------------------

// حافظه سرور برای تغییرات نقشه سایت در حالت دمو
const demoSitemapStore = new Map<string, { added: SitemapItem[]; removed: string[] }>();

/** لیست نقشه‌های سایت (قطعی + تغییرات کاربر در دمو) */
export function mockSitemaps(site: string): SitemapItem[] {
  const rnd = seeded(site, 40);
  const domain = site.replace("sc-domain:", "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  const base: SitemapItem[] = [
    {
      path: `https://${domain}/sitemap.xml`,
      lastSubmitted: daysAgo(2),
      lastDownloaded: daysAgo(1),
      isPending: false,
      isWmProcessed: true,
      type: "sitemap",
      errors: 0,
      warnings: 0,
      urlCount: 1240,
      contents: [{ type: "web", submitted: 1240, indexed: 1039 }],
    },
    {
      path: `https://${domain}/sitemap-posts.xml`,
      lastSubmitted: daysAgo(2),
      lastDownloaded: daysAgo(2),
      isPending: false,
      isWmProcessed: true,
      type: "sitemap",
      errors: 0,
      warnings: 3,
      urlCount: 486,
      contents: [{ type: "web", submitted: 486, indexed: 451 }],
    },
    {
      path: `https://${domain}/sitemap-products.xml`,
      lastSubmitted: daysAgo(9),
      lastDownloaded: daysAgo(8),
      isPending: false,
      isWmProcessed: true,
      type: "sitemap",
      errors: 4,
      warnings: 11,
      urlCount: 320,
      contents: [{ type: "web", submitted: 320, indexed: 243 }],
    },
    {
      path: `https://${domain}/sitemap-images.xml`,
      lastSubmitted: daysAgo(15),
      lastDownloaded: daysAgo(14),
      isPending: false,
      isWmProcessed: true,
      type: "sitemap",
      errors: 0,
      warnings: 0,
      urlCount: 2100,
      contents: [{ type: "image", submitted: 2100, indexed: 1930 }],
    },
  ];

  if (rnd() > 0.5) {
    base.push({
      path: `https://${domain}/sitemap-videos.xml`,
      lastSubmitted: daysAgo(30),
      lastDownloaded: null,
      isPending: true,
      isWmProcessed: false,
      type: "sitemap",
      errors: null,
      warnings: null,
      urlCount: null,
      contents: [],
    });
  }

  // اعمال تغییرات کاربر (دمو)
  const changes = demoSitemapStore.get(site);
  if (changes) {
    const filtered = base.filter(
      (s) => !changes.removed.includes(s.path)
    );
    return [...changes.added, ...filtered];
  }
  return base;
}

/** ارسال نقشه سایت جدید در حالت دمو */
export function demoAddSitemap(site: string, feedpath: string): SitemapItem {
  const store = demoSitemapStore.get(site) ?? { added: [], removed: [] };
  const item: SitemapItem = {
    path: feedpath,
    lastSubmitted: daysAgo(0),
    lastDownloaded: null,
    isPending: true,
    isWmProcessed: false,
    type: "sitemap",
    errors: null,
    warnings: null,
    urlCount: null,
    contents: [],
  };
  store.added = [item, ...store.added.filter((a) => a.path !== feedpath)];
  store.removed = store.removed.filter((p) => p !== feedpath);
  demoSitemapStore.set(site, store);
  return item;
}

/** حذف نقشه سایت در حالت دمو */
export function demoRemoveSitemap(site: string, feedpath: string) {
  const store = demoSitemapStore.get(site) ?? { added: [], removed: [] };
  store.added = store.added.filter((a) => a.path !== feedpath);
  store.removed = [...store.removed, feedpath];
  demoSitemapStore.set(site, store);
}

// ------------------------------------------------------------
// ۳.۶ — امنیت و اقدامات دستی
// ------------------------------------------------------------

import type { SecurityResponse } from "@/lib/types";

/** گزارش امنیت و پنالتی قطعی برای سایت */
export function mockSecurity(site: string): SecurityResponse {
  const rnd = seeded(site, 50);

  // ۷۰٪ سایت‌ها پاک هستند — اما هر سایت قطعی نتیجه خودش را دارد
  const hasManualAction = rnd() < 0.3;
  const hasSecurityIssue = rnd() < 0.2;

  const manualActions = hasManualAction
    ? [
        {
          id: "ma-unnatural-links",
          type: "UNNATURAL_LINKS",
          title: "لینک‌های غیرطبیعی به سایت شما",
          reason:
            "گوگل تشخیص داده که الگویی از لینک‌های خریداری‌شده یا ردیفی (به‌صورت دسته‌ای ساخت) به سایت شما داده شده تا رتبه‌تان را بالا ببرد. این کار خلاف قوانین گوگل است.",
          affectedPages: ["صفحه اصلی و چند صفحه دسته‌بندی"],
          fixGuide:
            "لینک‌های اسپم را تا جایی که می‌توانید حذف کنید؛ برای بقیه از ابزار Disavow گوگل استفاده کنید و بعد درخواست بازبینی (Request Review) بدهید.",
          severity: "critical" as const,
        },
      ]
    : [];

  const securityIssues = hasSecurityIssue
    ? [
        {
          id: "sec-deceptive",
          type: "SOCIAL_ENGINEERING",
          title: "محتوای فریبنده (Social Engineering)",
          details:
            "گوشه‌ای از سایت شما حاوی محتوایی است که کاربران را گمراه می‌کند؛ مثلاً دکمه دانلود جعلی یا پیام فریبنده «دستگاه شما آلوده است».",
          affectedPages: ["/download-page", "/popup-ad-landing"],
          severity: "critical" as const,
        },
      ]
    : [];

  return { manualActions, securityIssues, demo: true };
}

// ------------------------------------------------------------
// ۳.۷ — نتایج غنی (Rich Results)
// ------------------------------------------------------------

import type { RichResultsResponse, RichResultType } from "@/lib/types";

/** گزارش نتایج غنی قطعی برای سایت */
export function mockRichResults(site: string): RichResultsResponse {
  const rnd = seeded(site, 60);

  // انواع نتایج غنی با داده فارسی
  const types: RichResultType[] = [
    {
      id: "faq",
      type: "FAQ",
      title: "سوالات متداول (FAQ)",
      valid: 40 + Math.floor(rnd() * 60),
      warnings: Math.floor(rnd() * 8),
      errors: Math.floor(rnd() * 5),
      trend: [],
      problemPages: [
        { url: "/blog/faq-shipping", issue: "فیلد answer خالی است" },
        { url: "/faq/returns", issue: "قالب JSON-LD نامعتبر" },
      ],
    },
    {
      id: "articles",
      type: "ARTICLES",
      title: "مقاله‌ها (Article)",
      valid: 80 + Math.floor(rnd() * 120),
      warnings: Math.floor(rnd() * 12),
      errors: Math.floor(rnd() * 7),
      trend: [],
      problemPages: [
        { url: "/blog/seo-guide", issue: "تاریخ انتشار (datePublished) قدیمی است" },
        { url: "/blog/news-1404", issue: "headline طولانی‌تر از حد مجاز است" },
      ],
    },
    {
      id: "products",
      type: "PRODUCTS",
      title: "محصولات (Product)",
      valid: 20 + Math.floor(rnd() * 50),
      warnings: Math.floor(rnd() * 10),
      errors: Math.floor(rnd() * 9),
      trend: [],
      problemPages: [
        { url: "/product/laptop-x", issue: "قیمت (price) تعریف نشده" },
        { url: "/product/phone-y", issue: "تصویر محصول نامعتبر" },
      ],
    },
    {
      id: "breadcrumb",
      type: "BREADCRUMBS",
      title: "مسیر راهنما (Breadcrumb)",
      valid: 120 + Math.floor(rnd() * 180),
      warnings: Math.floor(rnd() * 6),
      errors: Math.floor(rnd() * 4),
      trend: [],
      problemPages: [{ url: "/shop/category/3", issue: "آخرین مسیر با URL صفحه یکی نیست" }],
    },
    {
      id: "reviews",
      type: "REVIEWS",
      title: "نظرات و امتیاز (Review)",
      valid: 10 + Math.floor(rnd() * 30),
      warnings: Math.floor(rnd() * 5),
      errors: Math.floor(rnd() * 6),
      trend: [],
      problemPages: [{ url: "/product/laptop-x#reviews", issue: "امتیاز خارج از بازه ۱ تا ۵" }],
    },
    {
      id: "videos",
      type: "VIDEOS",
      title: "ویدیوها (Video)",
      valid: 5 + Math.floor(rnd() * 20),
      warnings: Math.floor(rnd() * 4),
      errors: Math.floor(rnd() * 3),
      trend: [],
      problemPages: [{ url: "/video/tutorial-1", issue: "thumbnail (تصویر پیش‌نمایش) یافت نشد" }],
    },
    {
      id: "howto",
      type: "HOWTO",
      title: "آموزش قدم‌به‌قدم (How-to)",
      valid: Math.floor(rnd() * 15),
      warnings: Math.floor(rnd() * 3),
      errors: Math.floor(rnd() * 2),
      trend: [],
      problemPages: [],
    },
    {
      id: "events",
      type: "EVENTS",
      title: "رویدادها (Event)",
      valid: Math.floor(rnd() * 8),
      warnings: 0,
      errors: Math.floor(rnd() * 2),
      trend: [],
      problemPages: [],
    },
    {
      id: "recipes",
      type: "RECIPES",
      title: "دستور پخت (Recipe)",
      valid: Math.floor(rnd() * 6),
      warnings: 0,
      errors: 0,
      trend: [],
      problemPages: [],
    },
  ].filter((t) => t.valid + t.warnings + t.errors > 0);

  // روند ۱۲ ماهه برای مجموع
  const totalValid = types.reduce((a, t) => a + t.valid, 0);
  const totalErrors = types.reduce((a, t) => a + t.errors, 0);
  const totalWarnings = types.reduce((a, t) => a + t.warnings, 0);

  for (const t of types) {
    const trend: RichResultType["trend"] = [];
    for (let m = 12; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const progress = (12 - m) / 12;
      trend.push({
        date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
        valid: Math.round(t.valid * (0.6 + progress * 0.4)),
        errors: Math.round(t.errors * (1.5 - progress * 0.5)),
        warnings: Math.round(t.warnings * (1.3 - progress * 0.3)),
      });
    }
    t.trend = trend;
  }

  return { types, demo: true };
}
