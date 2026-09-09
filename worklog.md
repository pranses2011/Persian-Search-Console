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
