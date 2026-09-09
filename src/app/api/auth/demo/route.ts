import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

// POST /api/auth/demo — ورود به حالت نمایشی (دمو) بدون نیاز به گوگل
// برای تست کامل داشبورد با داده‌های نمونه فارسی
export async function POST() {
  try {
    // کاربر دمو ثابت
    const demoUser = await db.user.upsert({
      where: { email: "demo@persian-search-console.ir" },
      update: {},
      create: {
        email: "demo@persian-search-console.ir",
        name: "کاربر نمایشی",
        isDemo: true,
        avatarUrl: null,
      },
    });

    await createSession(demoUser.id);

    return NextResponse.json({
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        avatarUrl: demoUser.avatarUrl,
        isDemo: demoUser.isDemo,
      },
    });
  } catch (err) {
    console.error("خطا در ورود دمو:", err);
    return NextResponse.json(
      { error: "ورود نمایشی با خطا مواجه شد" },
      { status: 500 }
    );
  }
}
