// ============================================================
//  موتور داده نمایشی (Mock Engine) — بخش ۱: عملکرد جستجو
//  تولید داده قطعی (Deterministic) با PRNG سیددار
//  بدون وابستگی به گوگل، برای حالت دمو و بخش‌های بدون API عمومی
// ============================================================

import type {
  PerformanceTotals,
  DailyRow,
  DimensionRow,
  PerformanceFilters,
} from "@/lib/types";

// ------------------------------------------------------------
// تولید عدد شبه‌تصادفی قطعی (الگوریتم mulberry32)
// ------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** هش رشته برای ساخت سید قطعی از نام سایت */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** ساخت مولد تصادفی قطعی برای یک سایت */
export function seeded(site: string, salt = 0) {
  return mulberry32(hashString(site) + salt * 7919);
}

// ------------------------------------------------------------
// تاریخ‌ها
// ------------------------------------------------------------

/** لیست روزهای بین دو تاریخ (شامل) — ISO */
export function eachDay(startIso: string, endIso: string): string[] {
  const out: string[] = [];
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
}

/** تاریخ N روز قبل از امروز به ISO */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ------------------------------------------------------------
// مجموعه‌های داده فارسی نمونه
// ------------------------------------------------------------

// کلمات کلیدی فارسی (با وزن اهمیت)
const PERSIAN_QUERIES: { q: string; w: number }[] = [
  { q: "قیمت گوشی سامسونگ", w: 100 },
  { q: "آموزش پایتون از صفر", w: 92 },
  { q: "قیمت طلا امروز", w: 88 },
  { q: "بهترین لپ تاپ برای برنامه نویسی", w: 80 },
  { q: "سئو چیست و چگونه یاد بگیریم", w: 75 },
  { q: "دکوراسیون اتاق خواب کوچک", w: 70 },
  { q: "خرید کفش ورزشی مردانه", w: 68 },
  { q: "بهترین گوشی زیر ۲۰ میلیون", w: 66 },
  { q: "تور کیش ارزان", w: 62 },
  { q: "آموزش ساخت ربات تلگرام", w: 60 },
  { q: "معنی اسم یاسمن", w: 58 },
  { q: "تعبیر خواب مار", w: 56 },
  { q: "رژیم لاغری سریع خانگی", w: 54 },
  { q: "سفر به شیراز با قطار", w: 52 },
  { q: "قیمت دلار", w: 50 },
  { q: "دانلود رمان عاشقانه", w: 48 },
  { q: "دکوراسیون مدرن آشپزخانه", w: 46 },
  { q: "بهترین رستوران های تهران", w: 44 },
  { q: "کد تخفیف فروشگاه آنلاین", w: 42 },
  { q: "نحوه پاک کردن اکانت اینستاگرام", w: 40 },
  { q: "ماشین لباسشویی بوش", w: 38 },
  { q: "هارد اکسترنال چی بخرم", w: 36 },
  { q: "یخ زدن لوله آب چیکار کنیم", w: 34 },
  { q: "میزان بیمه شخص ثالث ۱۴۰۴", w: 32 },
  { q: "ساعت طلایی چیست", w: 30 },
  { q: "کرم ضد آفتاب برای پوست چرب", w: 28 },
  { q: "طرز تهیه کیک شکلاتی خانگی", w: 26 },
  { q: "شغل های پر درآمد در ایران", w: 24 },
  { q: "چطور اینستاگرام را حرفه ای کنیم", w: 22 },
  { q: "آموزش ادیت عکس با موبایل", w: 20 },
];

// صفحات سایت (با وزن)
const SITE_PAGES: { p: string; w: number }[] = [
  { p: "/", w: 100 },
  { p: "/blog/", w: 90 },
  { p: "/blog/seo-guide", w: 82 },
  { p: "/blog/python-tutorial", w: 78 },
  { p: "/shop/", w: 70 },
  { p: "/blog/price-updates", w: 66 },
  { p: "/blog/travel-shiraz", w: 62 },
  { p: "/shop/laptops", w: 58 },
  { p: "/blog/decoration-ideas", w: 54 },
  { p: "/blog/telegram-bot", w: 50 },
  { p: "/about-us", w: 42 },
  { p: "/contact-us", w: 40 },
  { p: "/faq", w: 38 },
  { p: "/shop/shoes", w: 36 },
  { p: "/blog/dream-interpretation", w: 34 },
  { p: "/blog/mobile-comparison", w: 32 },
  { p: "/shop/home-appliances", w: 30 },
  { p: "/blog/insurance-guide", w: 28 },
  { p: "/blog/recipes", w: 26 },
  { p: "/services", w: 24 },
  { p: "/blog/career-advice", w: 22 },
  { p: "/blog/photo-editing", w: 20 },
  { p: "/shop/gaming", w: 18 },
  { p: "/blog/smart-home", w: 16 },
];

// کشورها (سهم نمایش)
const COUNTRIES: { c: string; code: string; w: number }[] = [
  { c: "ایران", code: "IRN", w: 100 },
  { c: "ایالات متحده", code: "USA", w: 12 },
  { c: "آلمان", code: "DEU", w: 8 },
  { c: "کانادا", code: "CAN", w: 7 },
  { c: "امارات متحده عربی", code: "ARE", w: 6 },
  { c: "ترکیه", code: "TUR", w: 5 },
  { c: "بریتانیا", code: "GBR", w: 5 },
  { c: "استرالیا", code: "AUS", w: 4 },
  { c: "هلند", code: "NLD", w: 3 },
  { c: "سوئد", code: "SWE", w: 3 },
  { c: "فرانسه", code: "FRA", w: 3 },
  { c: "قطر", code: "QAT", w: 2 },
];

// دستگاه‌ها
const DEVICES = [
  { d: "موبایل", w: 100 },
  { d: "دسکتاپ", w: 40 },
  { d: "تبلت", w: 8 },
];

// نوع نمایش در جستجو
const SEARCH_APPEARANCES = [
  { a: "نتایج وب", key: "WEB", w: 100 },
  { a: "نتایج تصویری", key: "IMAGE", w: 14 },
  { a: "نتایج ویدیویی", key: "VIDEO", w: 6 },
  { a: "نتایج خبری", key: "NEWS", w: 3 },
  { a: "گوگل دیسکاور", key: "DISCOVER", w: 2 },
];

// ------------------------------------------------------------
// پیکربندی سایت نمایشی
// ------------------------------------------------------------

interface SiteProfile {
  // پایه نمایش روزانه
  baseImpressions: number;
  // نرخ رشد ماهانه
  growthMonthly: number;
  // نرخ کلیک پایه
  baseCtr: number;
  // جایگاه پایه
  basePosition: number;
  // رویداد افت (روز شروع، طول) — شبیه‌سازی الگوریتم گوگل
  dip: { start: number; len: number; depth: number };
  // رویداد جهش
  spike: { at: number; len: number; mult: number };
}

/** پروفایل قطعی سایت از روی نام آن */
function siteProfile(site: string): SiteProfile {
  const rnd = seeded(site, 1);
  const baseImpressions = 2200 + Math.floor(rnd() * 5600);
  return {
    baseImpressions,
    growthMonthly: 0.01 + rnd() * 0.045,
    baseCtr: 0.018 + rnd() * 0.022,
    basePosition: 10 + rnd() * 14,
    dip: {
      start: 90 + Math.floor(rnd() * 240),
      len: 12 + Math.floor(rnd() * 18),
      depth: 0.25 + rnd() * 0.2,
    },
    spike: {
      at: 30 + Math.floor(rnd() * 300),
      len: 4 + Math.floor(rnd() * 6),
      mult: 1.8 + rnd() * 1.2,
    },
  };
}

// ------------------------------------------------------------
// تولید سری روزانه عملکرد جستجو (۱۶ ماه گذشته)
// ------------------------------------------------------------

const MAX_HISTORY_DAYS = 500; // کمی بیشتر از ۱۶ ماه

/** یک روز داده بر اساس موقعیت زمانی و پروفایل سایت */
function generateDay(site: string, profile: SiteProfile, daysAgoNum: number): DailyRow {
  const rnd = seeded(site + ":" + daysAgoNum, 2);
  const dateIso = daysAgo(daysAgoNum);

  // رشد تدریجی: هرچه به امروز نزدیک‌تر، ترافیک بیشتر
  const monthsElapsed = (MAX_HISTORY_DAYS - daysAgoNum) / 30;
  const growth = Math.pow(1 + profile.growthMonthly, monthsElapsed);

  // فصلی بودن (زمستان بیشتر برای محتوای ایرانی)
  const month = new Date(dateIso + "T00:00:00").getMonth();
  const seasonal = 1 + Math.sin(((month + 1) / 12) * Math.PI * 2) * 0.08;

  // نوسان روز هفته: جمعه‌ها کمتر
  const weekday = new Date(dateIso + "T00:00:00").getDay(); // 5=جمعه
  const weekly = weekday === 5 ? 0.72 : weekday === 4 ? 0.85 : weekday === 6 ? 0.9 : 1;

  // نوسان تصادفی روزانه ±۱۵٪
  const noise = 0.85 + rnd() * 0.3;

  // اثر رویداد افت (آپدیت الگوریتم)
  let dipFactor = 1;
  if (daysAgoNum >= profile.dip.start && daysAgoNum < profile.dip.start + profile.dip.len) {
    dipFactor = 1 - profile.dip.depth * (0.7 + rnd() * 0.3);
  }
  // اثر رویداد جهش (وایرال شدن محتوا)
  let spikeFactor = 1;
  if (daysAgoNum <= profile.spike.at && daysAgoNum > profile.spike.at - profile.spike.len) {
    spikeFactor = profile.spike.mult;
  }

  const impressions = Math.max(
    50,
    Math.round(
      profile.baseImpressions * growth * seasonal * weekly * noise * dipFactor * spikeFactor
    )
  );

  // نرخ کلیک: با بهبود جایگاه کمی بهتر می‌شود + نویز
  const positionDrift = profile.spike.at > daysAgoNum ? -1.5 : 1.5; // نزدیک امروز بهتر
  const position = Math.max(
    1.5,
    profile.basePosition + positionDrift + (rnd() - 0.5) * 4 + (dipFactor < 1 ? 2.5 : 0)
  );
  const ctr = Math.min(0.12, Math.max(0.004, profile.baseCtr * (18 / Math.max(position, 4)) * (0.8 + rnd() * 0.4)));

  const clicks = Math.max(1, Math.round(impressions * ctr));

  return {
    date: dateIso,
    clicks,
    impressions,
    ctr: (clicks / impressions) * 100,
    position: Math.round(position * 10) / 10,
  };
}

/** سری کامل ۱۶ ماه (کش داخلی ماژول برای کارایی) */
const dailyCache = new Map<string, DailyRow[]>();

export function fullDailySeries(site: string): DailyRow[] {
  const cached = dailyCache.get(site);
  if (cached) return cached;
  const profile = siteProfile(site);
  const series: DailyRow[] = [];
  for (let i = MAX_HISTORY_DAYS - 1; i >= 1; i--) {
    series.push(generateDay(site, profile, i));
  }
  dailyCache.set(site, series);
  return series;
}

/** داده روزانه در بازه مشخص */
export function dailyRange(site: string, start: string, end: string): DailyRow[] {
  return fullDailySeries(site).filter((r) => r.date >= start && r.date <= end);
}

/** جمع معیارها از ردیف‌ها */
export function totalsOf(rows: DailyRow[]): PerformanceTotals {
  const clicks = rows.reduce((a, r) => a + r.clicks, 0);
  const impressions = rows.reduce((a, r) => a + r.impressions, 0);
  const position = rows.length
    ? rows.reduce((a, r) => a + r.position, 0) / rows.length
    : 0;
  return {
    clicks,
    impressions,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    position,
  };
}

// ------------------------------------------------------------
// جدول‌های تفکیکی (ابعاد)
// ------------------------------------------------------------

/** ساخت ردیف‌های بعد بر اساس وزن‌ها و جمع بازه */
function weightedRows(
  items: { label: string; w: number }[],
  totals: PerformanceTotals,
  rndSeed: string,
  qualityProfile: (i: number) => { ctrMult: number; posDelta: number }
): DimensionRow[] {
  const totalW = items.reduce((a, it) => a + it.w, 0);
  return items
    .map((it, i) => {
      const rnd = seeded(rndSeed + ":" + i, 3);
      const share = it.w / totalW;
      const impressions = Math.round(totals.impressions * share);
      const { ctrMult, posDelta } = qualityProfile(i);
      const ctr = Math.min(
        0.15,
        Math.max(0.002, (totals.ctr / 100) * ctrMult * (0.85 + rnd() * 0.3))
      );
      const clicks = Math.max(1, Math.round(impressions * ctr));
      const position = Math.max(
        1.2,
        totals.position + posDelta + (rnd() - 0.5) * 3
      );
      return {
        key: it.label,
        clicks,
        impressions,
        ctr: (clicks / Math.max(impressions, 1)) * 100,
        position: Math.round(position * 10) / 10,
      } satisfies DimensionRow;
    })
    .sort((a, b) => b.clicks - a.clicks);
}

/** اعمال فیلتر متنی روی ردیف‌های بعد */
function applyFilter(rows: DimensionRow[], filters: PerformanceFilters): DimensionRow[] {
  let out = rows;
  if (filters.query) out = out.filter((r) => r.key.includes(filters.query!));
  if (filters.page) out = out.filter((r) => r.key.includes(filters.page!));
  if (filters.country) out = out.filter((r) => r.key === filters.country!);
  if (filters.device) out = out.filter((r) => r.key === filters.device!);
  if (filters.searchAppearance) out = out.filter((r) => r.key === filters.searchAppearance!);
  return out;
}

/** جدول تفکیکی بر اساس بعد انتخابی */
export function dimensionRows(
  site: string,
  dimension: string,
  start: string,
  end: string,
  filters: PerformanceFilters = {}
): DimensionRow[] {
  const rows = dailyRange(site, start, end);
  const totals = totalsOf(rows);

  let base: DimensionRow[];
  switch (dimension) {
    case "query":
      base = weightedRows(
        PERSIAN_QUERIES.filter((q) => q.w > 0).map((q) => ({ label: q.q, w: q.w })),
        totals,
        site + ":q",
        (i) => ({ ctrMult: 0.5 + (i % 5) * 0.35, posDelta: (i % 7) - 3 })
      );
      break;
    case "page":
      base = weightedRows(
        SITE_PAGES.map((p) => ({ label: p.p, w: p.w })),
        totals,
        site + ":p",
        (i) => ({ ctrMult: 0.6 + (i % 4) * 0.4, posDelta: (i % 5) - 2 })
      );
      break;
    case "country":
      base = weightedRows(
        COUNTRIES.map((c) => ({ label: c.c, w: c.w })),
        totals,
        site + ":c",
        () => ({ ctrMult: 1, posDelta: 0 })
      );
      break;
    case "device":
      base = weightedRows(
        DEVICES.map((d) => ({ label: d.d, w: d.w })),
        totals,
        site + ":d",
        (i) => ({ ctrMult: i === 1 ? 1.3 : i === 2 ? 0.8 : 1, posDelta: i === 1 ? -1.5 : 1 })
      );
      break;
    case "searchAppearance":
      base = weightedRows(
        SEARCH_APPEARANCES.map((a) => ({ label: a.a, w: a.w })),
        totals,
        site + ":a",
        (i) => ({ ctrMult: i === 0 ? 1.2 : 0.6, posDelta: 0 })
      );
      break;
    case "date":
    default:
      base = rows.map((r) => ({
        key: r.date,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
      }));
  }

  return applyFilter(base, filters);
}

// ------------------------------------------------------------
// بازه قبلی برای مقایسه (هم‌طول بازه فعلی)
// ------------------------------------------------------------

/** بازه قبلی هم‌اندازه قبل از بازه فعلی */
export function previousRange(start: string, end: string): { start: string; end: string } {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const len = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  const prevEnd = new Date(s);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (len - 1));
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: iso(prevStart), end: iso(prevEnd) };
}
