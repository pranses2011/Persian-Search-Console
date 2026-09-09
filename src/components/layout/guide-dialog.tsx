"use client";

// ============================================================
//  راهنمای کامل داشبورد (بخش ۵)
//  دیالوگ آموزشی جامع برای مبتدی‌ها — توضیح هر بخش با مثال روزمره
// ============================================================

import * as React from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, TrendingUp, SearchCheck, FileStack, Smartphone, Map,
  ShieldAlert, Sparkles, Link2, Gauge, Trash2, Lightbulb, MousePointerClick,
} from "lucide-react";

// محتوای آموزشی هر بخش
const GUIDE_ITEMS = [
  {
    id: "start",
    title: "شروع سریع",
    icon: MousePointerClick,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>🎉 به داشبورد فارسی سرچ کنسول خوش آمدید! این ابزار نشان می‌دهد سایت شما چطور در گوگل دیده می‌شود.</p>
        <p>روباه‌های کوچک <span className="text-primary font-bold">❓</span> را کنار هر عدد و نمودار می‌بینید؟ روی‌شان کلیک کنید تا همان مورد را ساده توضیح بدهیم.</p>
        <p>از منوی کنار راست، بین ۱۰ بخش گزارش جابه‌جا شوید. بالای صفحه هم می‌توانید بازه زمانی (۷ روز تا ۱۶ ماه) را عوض کنید.</p>
        <p>اگر عددی معنایش را نمی‌دانید، نگران نباشید — همه چیز به زبان آدمیزاد توضیح داده شده!</p>
      </div>
    ),
  },
  {
    id: "overview",
    title: "عملکرد جستجو",
    icon: TrendingUp,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>مهم‌ترین سؤال صاحبان سایت: «آیا مردم مرا در گوگل پیدا می‌کنند؟» این بخش جواب می‌دهد.</p>
        <p><b>۴ عدد کلیدی:</b></p>
        <ul className="list-disc ps-6 space-y-1.5">
          <li><b>کلیک‌ها</b> — چند نفر از گوگل وارد سایت شما شدند</li>
          <li><b>نمایش‌ها</b> — چند بار لینک شما دیده شد (حتی بدون کلیک)</li>
          <li><b>نرخ کلیک</b> — از هر ۱۰۰ نفر که دیدند، چند نفر کلیک کردند</li>
          <li><b>جایگاه</b> — رتبه شما در نتایج (عدد کوچک‌تر = بهتر!)</li>
        </ul>
        <p className="text-muted-foreground text-xs bg-muted rounded-lg p-3">
          💡 مثال: سایت شما روزی ۱٬۰۰۰ بار دیده می‌شود و ۳۰ کلیک می‌گیرد؛ یعنی نرخ کلیک ۳٪ است. حالا با دکمه «مقایسه با بازه قبل» ببینید نسبت به ماه گذشته بهتر شده‌اید یا بدتر!
        </p>
      </div>
    ),
  },
  {
    id: "inspection",
    title: "بازرسی URL",
    icon: SearchCheck,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>شک دارید صفحه‌ای در گوگل ثبت شده یا نه؟ آدرسش را همین‌جا وارد کنید تا پرونده‌اش را ببینید!</p>
        <p>می‌بینید: وضعیت ایندکس، آخرین باری که گوگل خواندش، مشکل موبایل، نتایج غنی و…</p>
        <p className="text-muted-foreground text-xs bg-muted rounded-lg p-3">
          💡 مثل رهگیری مرسوله پستی: شماره را می‌دهید و وضعیت دقیقش را می‌بینید.
        </p>
      </div>
    ),
  },
  {
    id: "indexing",
    title: "ایندکس‌گذاری",
    icon: FileStack,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>صفحه‌ای که در گوگل «ایندکس» نشده باشد، انگار اصلاً وجود ندارد!</p>
        <p>این بخش نشان می‌دهد چند صفحه‌تان ثبت شده و به صفحات ثبت‌نشده چه افتاده — با دلیل و راه‌حل هر کدام.</p>
        <p className="text-muted-foreground text-xs bg-muted rounded-lg p-3">
          💡 مثل لیست شرکت‌کنندگان قرعه‌کشی؛ اسم‌هایی که ثبت نشده‌اند شانسی ندارند. اینجا می‌بینید چرا اسم‌ها حذف شده‌اند و چطور اضافه‌شان کنید.
        </p>
      </div>
    ),
  },
  {
    id: "mobile",
    title: "موبایل",
    icon: Smartphone,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>بیشتر کاربران ایرانی با گوشی وارد سایت شما می‌شوند. اگر سایت در موبایل مشکل داشته باشد، بازدیدکننده‌ها فرار می‌کنند.</p>
        <p>مشکلات رایج: متن ریز، دکمه‌های نزدیک هم، بیرون‌زدگی محتوا از صفحه — همه با راه‌حل.</p>
      </div>
    ),
  },
  {
    id: "sitemaps",
    title: "نقشه‌های سایت",
    icon: Map,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>نقشه سایت (Sitemap) فهرست صفحات شماست که به گوگل می‌گوید «اینها را بخوان».</p>
        <p>اینجا می‌بینید چه نقشه‌هایی ثبت کرده‌اید، چند آدرس دارند و آیا خطایی دارند. می‌توانید نقشه جدید هم بفرستید.</p>
        <p className="text-muted-foreground text-xs bg-muted rounded-lg p-3">
          💡 مثل فهرست مطالب کتاب؛ گوگل راحت‌تر همه فصل‌ها را پیدا می‌کند.
        </p>
      </div>
    ),
  },
  {
    id: "security",
    title: "امنیت و پنالتی",
    icon: ShieldAlert,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>⚠️ مهم‌ترین بخش! اگر اینجا خبر بدی باشد (پنالتی یا مشکل امنیتی)، ممکن است سایت‌تان از نتایج گوگل حذف شود.</p>
        <p>خبر خوب: اگر کارت درست باشد، این صفحه همیشه سبز و «بدون مشکل» است.</p>
      </div>
    ),
  },
  {
    id: "rich",
    title: "نتایج غنی",
    icon: Sparkles,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>ستاره‌های زرد، سوالات بازشو، عکس ویدیوها در نتایج گوگل… این‌ها «نتیجه غنی» هستند و کلیک بیشتری می‌گیرند!</p>
        <p>این بخش می‌گوید صفحات شما چند نتیجه غنی معتبر دارند و صفحات مشکل‌دار کدام‌اند.</p>
      </div>
    ),
  },
  {
    id: "links",
    title: "لینک‌ها",
    icon: Link2,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>لینک خارجی مثل معرفی‌نامه است: سایت‌های دیگر به شما ارجاع می‌دهند و اعتبارتان نزد گوگل بالا می‌رود.</p>
        <p>لینک داخلی هم مسیرهای داخل سایت شماست — برای اینکه گوگل و کاربر راحت بگردند.</p>
      </div>
    ),
  },
  {
    id: "vitals",
    title: "Core Web Vitals",
    icon: Gauge,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>سرعت و روانی سایت سه معیار دارد که گوگل رسمی اندازه می‌گیرد:</p>
        <ul className="list-disc ps-6 space-y-1.5">
          <li><b>LCP</b> — چقدر طول می‌کشد محتوای اصلی صفحه نمایش داده شود؟ (حداکثر ۲٫۵ ثانیه)</li>
          <li><b>INP</b> — وقتی کلیک می‌کنید، چقدر سریع جواب می‌گیرید؟</li>
          <li><b>CLS</b> — آیا عناصر صفحه وسط کار جابه‌جا می‌شوند و کلیک اشتباه می‌زنید؟</li>
        </ul>
      </div>
    ),
  },
  {
    id: "removals",
    title: "حذف موقت",
    icon: Trash2,
    body: (
      <div className="space-y-3 text-sm leading-7">
        <p>اگر محتوای حساسی (مثل اطلاعات شخصی) اشتباهاً عمومی شد، از اینجا فوری موقتاً از گوگل پنهانش کنید و بعد مشکل اصلی را حل کنید.</p>
      </div>
    ),
  },
];

export function GuideDialog() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          title="راهنمای کامل داشبورد برای مبتدی‌ها"
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden md:inline">راهنما</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-5 h-5 text-primary" />
            راهنمای داشبورد — به زبان ساده
          </DialogTitle>
          <DialogDescription>
            همه چیزهایی که برای شروع نیاز دارید؛ حتی اگر اولین بارتان است! روی هر عنوان کلیک کنید.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="start" dir="rtl">
          <TabsList className="w-full flex-wrap h-auto justify-start gap-1">
            {GUIDE_ITEMS.map((g) => (
              <TabsTrigger key={g.id} value={g.id} className="text-[11px] gap-1 flex-1 min-w-24">
                <g.icon className="w-3.5 h-3.5" />
                {g.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {GUIDE_ITEMS.map((g) => (
            <TabsContent key={g.id} value={g.id} className="mt-4">
              <div className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <g.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold">{g.title}</h3>
                </div>
                {g.body}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-6">
                    نکته: هر جا علامت <b>❓</b> دیدید، همان‌جا کلیک کنید تا توضیح همان مورد را ببینید.
                  </p>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
