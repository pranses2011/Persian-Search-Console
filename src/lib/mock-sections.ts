// ============================================================
//  موتور داده نمایشی — بخش ۲: بازرسی URL و ایندکس‌گذاری
//  تولید قطعی داده برای ۳.۲ و ۳.۳
// ============================================================

import { seeded, daysAgo, hashString } from "./mock-engine";
import type { InspectionResult, IndexingResponse, IndexingCategory } from "@/lib/types";

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
