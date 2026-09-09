// ============================================================
//  تایپ‌های مشترک کل برنامه - Persian Search Console
// ============================================================

/** کاربر واردشده (واقعی یا دمو) */
export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isDemo: boolean;
}

/** سایت ثبت‌شده در سرچ کنسول (Property) */
export interface GscSite {
  siteUrl: string; // آدرس کامل: sc-domain:example.ir یا https://example.ir/
  type: "DOMAIN" | "URL_PREFIX"; // نوع پراپرتی
  verified: boolean; // وضعیت تأیید مالکیت
  permissionLevel: string;
  /** نام نمایشی تمیزشده برای کارت‌ها */
  displayName: string;
}

/** معیارهای عملکرد جستجو */
export interface PerformanceTotals {
  clicks: number;
  impressions: number;
  ctr: number; // درصد
  position: number; // میانگین
}

/** ردیف داده روزانه برای نمودار خطی */
export interface DailyRow extends PerformanceTotals {
  date: string; // ISO: YYYY-MM-DD
}

/** ردیف جدول تفکیکی (کلمه کلیدی، صفحه، کشور و ...) */
export interface DimensionRow extends PerformanceTotals {
  key: string; // عنوان ردیف (کلمه کلیدی، مسیر صفحه و ...)
}

/** فیلترهای پیشرفته عملکرد جستجو */
export interface PerformanceFilters {
  query?: string;
  page?: string;
  country?: string;
  device?: string;
  searchAppearance?: string;
}

/** درخواست عملکرد جستجو */
export interface PerformanceRequest {
  site: string;
  startDate: string;
  endDate: string;
  dimension?: "query" | "page" | "country" | "device" | "searchAppearance" | "date";
  filters?: PerformanceFilters;
  compare?: boolean; // مقایسه با بازه قبلی
}

/** پاسخ عملکرد جستجو */
export interface PerformanceResponse {
  totals: PerformanceTotals;
  previousTotals?: PerformanceTotals; // بازه قبلی برای مقایسه
  daily: DailyRow[];
  rows: DimensionRow[];
  dimension: string;
  demo: boolean; // آیا داده نمایشی است؟
}

// --- بازرسی URL ---

export interface InspectionResult {
  url: string;
  indexStatus: "INDEXED" | "NOT_INDEXED" | "DISCOVERED_NOT_INDEXED" | "CRAWLED_NOT_INDEXED" | "BLOCKED_BY_ROBOTS" | "NOINDEX" | "REDIRECT" | "NOT_FOUND" | "SERVER_ERROR";
  lastCrawl: string | null; // ISO
  indexingMethod: "USER_SELECTED_CANONICAL" | "GOOGLE_SELECTED_CANONICAL" | "DUPLICATE" | "CRAWL_NOT_INDEXED" | null;
  mobileUsable: boolean | null;
  mobileIssues: string[];
  richResults: { type: string; state: "VALID" | "WARNING" | "ERROR" }[];
  ampStatus: "VALID" | "INVALID" | "NONE" | null;
  httpCode: number | null;
  canonical: string | null;
  sitemapFound: boolean | null;
  referrerUrls: string[];
  demo: boolean;
}

// --- ایندکس‌گذاری صفحات ---

export interface IndexingCategory {
  id: string;
  title: string; // عنوان فارسی دسته
  count: number;
  description: string; // توضیح فارسی
  fixGuide: string; // راهنمای رفع
  severity: "good" | "warning" | "error" | "info";
  sampleUrls: string[];
}

export interface IndexingResponse {
  total: number;
  indexed: number;
  notIndexed: number;
  categories: IndexingCategory[];
  trend: { date: string; indexed: number; notIndexed: number }[];
  demo: boolean;
}

// --- قابلیت استفاده در موبایل ---

export interface MobileIssue {
  id: string;
  type: string; // نوع مشکل
  title: string; // عنوان فارسی
  count: number;
  severity: "error" | "warning";
  description: string;
  solution: string;
  sampleUrls: string[];
}

export interface MobileResponse {
  issues: MobileIssue[];
  trend: { date: string; errors: number }[];
  demo: boolean;
}

// --- نقشه‌های سایت ---

export interface SitemapItem {
  path: string; // آدرس sitemap
  lastSubmitted: string | null;
  lastDownloaded: string | null;
  isPending: boolean;
  isWmProcessed: boolean;
  type: string;
  errors?: number | null;
  warnings?: number | null;
  urlCount: number | null;
  contents: { type: string; submitted: number; indexed: number }[];
}

// --- امنیت و اقدامات دستی ---

export interface ManualAction {
  id: string;
  type: string;
  title: string;
  reason: string;
  affectedPages: string[];
  fixGuide: string;
  severity: "critical" | "warning";
}

export interface SecurityIssue {
  id: string;
  type: string; // MALWARE / PHISHING / HACKED
  title: string;
  details: string;
  affectedPages: string[];
  severity: "critical";
}

export interface SecurityResponse {
  manualActions: ManualAction[];
  securityIssues: SecurityIssue[];
  demo: boolean;
}

// --- نتایج غنی ---

export interface RichResultType {
  id: string;
  type: string; // FAQ / ARTICLES / ...
  title: string; // عنوان فارسی
  valid: number;
  warnings: number;
  errors: number;
  trend: { date: string; valid: number; errors: number; warnings: number }[];
  problemPages: { url: string; issue: string }[];
}

export interface RichResultsResponse {
  types: RichResultType[];
  demo: boolean;
}

// --- لینک‌ها ---

export interface LinkRow {
  key: string;
  target?: string;
  value: number;
}

export interface LinksResponse {
  external: {
    topLinkingSites: LinkRow[];
    topLinkedPages: LinkRow[];
    topAnchorTexts: LinkRow[];
    totalBacklinks: number;
    totalReferringDomains: number;
  };
  internal: {
    topLinkedPages: LinkRow[];
    totalLinks: number;
  };
  demo: boolean;
}

// --- Core Web Vitals ---

export interface VitalMetric {
  id: "LCP" | "INP" | "CLS";
  title: string;
  value: number;
  unit: string;
  good: number; // درصد ترافیک خوب
  needsImprovement: number;
  poor: number;
  mobile: number;
  desktop: number;
  classification: "good" | "ni" | "poor";
  description: string;
}

export interface VitalsResponse {
  metrics: VitalMetric[];
  trend: { date: string; LCP: number; INP: number; CLS: number }[];
  demo: boolean;
}

// --- حذف موقت ---

export interface RemovalItem {
  url: string;
  type: "REMOVE_SINGLE_URL" | "REMOVE_PREFIX" | "CLEAR_CACHE_90DAYS";
  status: "PENDING" | "EXPIRED" | "CANCELED" | "PROCESSING";
  requestedAt: string;
  expiresAt: string;
}

// --- نوتیفیکیشن هوشمند و خلاصه وضعیت ---

export interface SmartNotification {
  id: string;
  severity: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  date: string;
}

export interface SummaryResponse {
  score: number; // امتیاز سلامت کلی سایت از ۱۰۰
  summary: string; // خلاصه وضعیت به زبان ساده
  notifications: SmartNotification[];
  totals?: PerformanceTotals & { deltaClicks?: number; deltaImpressions?: number };
  demo: boolean;
}
