# Worklog — Persian Search Console

---
Task ID: 0
Agent: main
Task: راه‌اندازی زیرساخت پروژه فارسی سرچ کنسول (RTL، فونت، تم، دیتابیس)

Work Log:
- تحلیل کامل فایل درخواست Search-Console-Dashboard-Prompt.txt (۸ بخش)
- راه‌اندازی محیط fullstack (Next.js 16 + TS + Tailwind 4 + shadcn/ui)
- دانلود فونت وزیرمتن (Regular/Medium/Bold) به‌صورت محلی در src/app/fonts
- layout.tsx: راست‌چین RTL، lang=fa، فونت وزیرمتن با next/font/local
- globals.css: تم سبز زمردی روشن/تاریک، اسکرول‌بار سفارشی، انیمیشن‌ها، استایل چاپ PDF
- providers.tsx: ThemeProvider + React Query
- prisma/schema.prisma: مدل‌های User (توکن گوگل)، Session، DataCache + db push
- lib/format.ts: اعداد فارسی، تاریخ شمسی جلالی، زمان نسبی
- lib/types.ts: تمام تایپ‌های مشترک ۱۰ بخش داشبورد
- .env.example و favicon.svg

Stage Summary:
- زیرساخت RTL فارسی آماده است؛ آماده پیاده‌سازی بخش ۱ (احراز هویت OAuth)

---
Task ID: 1
Agent: main
Task: بخش ۱ — احراز هویت Google OAuth 2.0

Work Log:
- lib/auth.ts: نشست کوکی httpOnly + createSession/getSession/clearSession
- lib/google.ts: ساخت URL رضایت گوگل با scopeهای webmasters، تبادل کد↔توکن، تازه‌سازی خودکار، پروفایل
- مسیرهای API: /api/auth/google (redirect)، callback (تبادل+ذخیره توکن)، demo (ورود نمایشی)، logout (پاک‌کردن توکن‌ها)، me
- store/app-store.ts: Zustand با وضعیت کاربر/سایت/بخش/بازه زمانی/فیلترها
- login-view.tsx: صفحه ورود با دکمه گوگل (آیکون رسمی) + دکمه دمو + مدیریت خطاها
- user-menu.tsx: نمایش نام/ایمیل/آواتار + بج «حالت نمایشی» + خروج
- page.tsx: SPA با Suspense و اسکلتون لودینگ؛ app-shell.tsx: هدر + پاورقی چسبان
- lib/gsc.ts: کلاینت کامل Search Console API (sites، searchAnalytics، sitemaps، urlInspection) با refresh خودکار توکن
- تست curl: ورود دمو، me، sites و logout همگی موفق

Stage Summary:
- بخش ۱ کامل و تست‌شده؛ آماده بخش ۲ (UI کامل لیست سایت‌ها + موتور داده نمایشی)

---
Task ID: 2
Agent: main
Task: بخش ۲ — لیست سایت‌های ثبت‌شده (Properties)

Work Log:
- lib/mock-engine.ts: موتور داده قطعی سیددار (PRNG mulberry32) — سری روزانه ۱۶ ماه با روند رشد، فصلی بودن، افت آپدیت الگوریتم، جهش وایرال + جدول‌های ۶ بعد با داده فارسی (کلمات کلیدی/صفحات/کشورها/دستگاه‌ها/نوع نمایش)
- properties-view.tsx کامل: کارت‌های سایت با فاویکون (سرویس گوگل + جایگزین حرف رنگی قطعی)، آدرس کامل، بج نوع (Domain/URL Prefix)، بج تأیید مالکیت، توضیح ساده برای مبتدی
- جستجو زنده بین سایت‌ها + فیلتر تب‌های همه/تأییدشده/تأییدنشده
- کلیک روی سایت → داشبورد؛ سایت تأییدنشده پیام خطا می‌دهد
- رفع باگ استور: تغییر view بعد از ورود از حالت login
- تست مرورگر: ورود دمو، ۵ کارت سایت، فیلترها، ورود داشبورد — همه موفق

Stage Summary:
- بخش ۲ کامل؛ زیرساخت داده نمایشی آماده برای بخش ۳ (عملکرد جستجو)

---
Task ID: 3
Agent: main
Task: بخش ۳.۱ — عملکرد جستجو (Search Performance)

Work Log:
- /api/performance: مسیر API با کش TTL (حافظه+دیتابیس)، حالت دمو (موتور نمایشی) و واقعی (Search Analytics API) + مقایسه بازه قبلی + فیلترها + ترجمه برچسب کشور/دستگاه به فارسی
- lib/cache.ts: لایه کش با حافظه + Prisma DataCache
- lib/csv.ts: خروجی CSV با BOM فارسی سازگار با اکسل
- کامپوننت‌های مشترک: HelpTip (راهنمای درون‌برنامه‌ای با مثال روزمره)، DataTable (صفحه‌بندی/مرتب‌سازی/جستجو/CSV)، KpiCard (با دلتای مقایسه)، SectionHeader
- DateRangeBar: ۷ بازه پیش‌فرض (۷روز تا ۱۶ماه) + سفارشی با تاریخ شمسی + کلید مقایسه
- PerformanceChart: نمودار تعاملی Recharts — ۴ معیار با کلید روشن/خاموش، محور راست معکوس برای جایگاه، tooltip فارسی شمسی، رنگ‌های مجزا
- DimensionTables: ۶ تب (کلمات کلیدی/صفحات/کشورها/دستگاه‌ها/نوع نمایش/تاریخ‌ها) هر یک با DataTable کامل
- AdvancedFilters: فیلتر کلمه/صفحه/کشور/دستگاه/نوع نمایش با ترکیب
- داشبورد: سایدبار ۱۰ بخش + منوی موبایل Sheet + انتخاب سایت + بازه زمانی
- رفع باگ Radix Select (value خالی ممنوع → مقدار all)
- تست مرورگر: KPI فارسی (۳٬۵۳۳ کلیک)، نمودار، تب صفحات، مقایسه −۱٫۳٪ — موفق

Stage Summary:
- بخش ۳.۱ کامل با تمام الزامات؛ ۹ بخش بعدی در کامیت‌های بعدی
