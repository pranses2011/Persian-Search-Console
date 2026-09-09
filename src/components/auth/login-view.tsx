"use client";

// ============================================================
//  صفحه ورود — دکمه «ورود با حساب گوگل» + ورود حالت نمایشی
// ============================================================

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app-store";
import type { AppUser } from "@/lib/types";
import {
  Search, BarChart3, FileCheck2, Link2, ShieldCheck, TrendingUp,
  Sparkles, Loader2, LogIn,
} from "lucide-react";

// آیکون رسمی گوگل (SVG)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// قابلیت‌های کلیدی برای نمایش در صفحه ورود
const FEATURES = [
  { icon: BarChart3, title: "عملکرد جستجو", desc: "کلیک، نمایش، نرخ کلیک و جایگاه با نمودار تعاملی" },
  { icon: FileCheck2, title: "ایندکس‌گذاری", desc: "ببینید کدام صفحات در گوگل ثبت شده‌اند" },
  { icon: TrendingUp, title: "کلمات کلیدی", desc: "کلماتی که کاربران با آن شما را پیدا می‌کنند" },
  { icon: ShieldCheck, title: "امنیت سایت", desc: "بررسی هشدارهای امنیتی و اقدامات دستی" },
];

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const setUser = useAppStore((s) => s.setUser);
  const googleConfigured = useAppStore((s) => s.googleConfigured);
  const [demoLoading, setDemoLoading] = React.useState(false);

  // نمایش پیام خطا در صورت شکست ورود گوگل
  React.useEffect(() => {
    const error = searchParams.get("auth_error");
    if (!error) return;
    const messages: Record<string, string> = {
      not_configured: "کلیدهای گوگل تنظیم نشده‌اند. فایل .env را مطابق README تکمیل کنید.",
      access_denied: "شما دسترسی به سرچ کنسول را رد کردید.",
      invalid_state: "نشست ورود نامعتبر بود. دوباره تلاش کنید.",
      token_exchange: "خطا در دریافت توکن از گوگل. بعداً تلاش کنید.",
      missing_code: "کد تأیید از گوگل دریافت نشد.",
    };
    toast({
      title: "خطا در ورود",
      description: messages[error] ?? "خطای نامشخص در فرایند ورود رخ داد.",
      variant: "destructive",
    });
    // پاک‌کردن پارامتر خطا از URL
    router.replace("/");
  }, [searchParams, toast, router]);

  // ورود به حالت نمایشی (دمو) با داده فارسی نمونه
  async function loginDemo() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = (await res.json()) as { user: AppUser; error?: string };
      if (!res.ok) throw new Error(data.error || "خطا در ورود نمایشی");
      setUser(data.user);
      toast({
        title: "به حالت نمایشی خوش آمدید 👋",
        description: "داشبورد با داده‌های نمونه فارسی نمایش داده می‌شود.",
      });
    } catch (err) {
      toast({
        title: "خطا",
        description: err instanceof Error ? err.message : "ورود نمایشی ناموفق بود.",
        variant: "destructive",
      });
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-primary/5 via-background to-background">
      {/* لوگو و عنوان */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
          <Search className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">کنسول جستجوی فارسی</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          داشبورد مدیریت گوگل سرچ کنسول — به زبان ساده، برای همه
        </p>
      </motion.div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">
        {/* کارت ورود */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card className="h-full shadow-xl border-border/60">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">ورود به حساب</CardTitle>
              <CardDescription>
                برای مشاهده داده‌های واقعی سایت خود، با حساب گوگل وارد شوید
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* دکمه ورود با گوگل */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full h-14 text-base font-medium hover:shadow-md transition-shadow"
              >
                <a href="/api/auth/google" className="flex items-center justify-center gap-3">
                  <GoogleIcon className="w-5 h-5" />
                  ورود با حساب گوگل
                </a>
              </Button>

              {/* جداکننده */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">یا</span>
                </div>
              </div>

              {/* دکمه حالت نمایشی */}
              <Button
                size="lg"
                className="w-full h-14 text-base"
                onClick={loginDemo}
                disabled={demoLoading}
              >
                {demoLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                ورود به حالت نمایشی (بدون گوگل)
              </Button>

              {/* توضیحات */}
              <p className="text-xs text-muted-foreground text-center leading-6">
                در حالت نمایشی، داشبورد با داده‌های نمونه فارسی کار می‌کند تا بتوانید
                همه امکانات را بدون اتصال به گوگل ببینید.
                {!googleConfigured && (
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    کلیدهای گوگل تنظیم نشده‌اند — برای ورود واقعی، فایل .env را کامل کنید.
                  </span>
                )}
              </p>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Badge variant="secondary" className="gap-1">
                  <LogIn className="w-3 h-3" /> امن با OAuth 2.0
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="w-3 h-3" /> فقط دسترسی فقط‌خواندنی
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* کارت معرفی امکانات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="hidden lg:block"
        >
          <Card className="h-full bg-card/60 backdrop-blur border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">با این داشبورد چه کارهایی می‌کنید؟</CardTitle>
              <CardDescription>همه چیز به زبان ساده فارسی، بدون نیاز به دانش فنی</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {f.title}
                      <Link2 className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="text-sm text-muted-foreground leading-6">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* پاورقی */}
      <p className="mt-8 text-xs text-muted-foreground text-center">
        Persian Search Console — نسخه ۱٫۰ | ساخته‌شده با Next.js
      </p>
    </div>
  );
}
