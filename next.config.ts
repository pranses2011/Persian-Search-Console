import type { NextConfig } from "next";

// ============================================================
//  پیکربندی Next.js — دو حالت build:
//  ۱. حالت سرور (پیش‌فرض): standalone برای هاست‌های Node.js
//  ۲. حالت استاتیک cPanel: خروجی export خالص (HTML/JS/CSS)
//     فعال‌سازی: NEXT_PUBLIC_STATIC_MODE=true در زمان build
//     (اسکریپت scripts/build-cpanel.sh این کار را انجام می‌دهد)
// ============================================================

const isCpanelBuild = process.env.NEXT_PUBLIC_STATIC_MODE === "true";

const nextConfig: NextConfig = isCpanelBuild
  ? {
      // خروجی استاتیک کامل — قابل اجرا روی هر هاست اشتراکی
      output: "export",
      images: { unoptimized: true },
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    }
  : {
      // خروجی سرور — برای هاست‌های Node.js / VPS
      output: "standalone",
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    };

export default nextConfig;
