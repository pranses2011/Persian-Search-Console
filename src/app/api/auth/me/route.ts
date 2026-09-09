import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isGoogleConfigured } from "@/lib/google";

// GET /api/auth/me — وضعیت ورود کاربر فعلی
// خروجی: { user, googleConfigured }
export async function GET() {
  const user = await getSession();
  return NextResponse.json({
    user,
    // آیا کلیدهای OAuth تنظیم شده‌اند؟ (برای نمایش دکمه ورود گوگل)
    googleConfigured: isGoogleConfigured(),
  });
}
