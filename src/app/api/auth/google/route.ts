import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrigin } from "@/lib/auth";
import { buildGoogleAuthUrl, getRedirectUri, isGoogleConfigured } from "@/lib/google";

// GET /api/auth/google — شروع جریان ورود با گوگل
// کاربر را به صفحه رضایت (Consent) گوگل هدایت می‌کند
export async function GET(req: Request) {
  // اگر کلیدها تنظیم نشده‌اند، به صفحه ورود با پیام خطا برگرد
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL("/?auth_error=not_configured", req.url)
    );
  }

  const origin = getOrigin(req);
  const redirectUri = getRedirectUri(origin);

  // ساخت state امن برای جلوگیری از حملات CSRF
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("psc_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // ۱۰ دقیقه اعتبار
    path: "/",
  });

  // هدایت به صفحه ورود گوگل با دامنه‌های دسترسی سرچ کنسول
  return NextResponse.redirect(buildGoogleAuthUrl(redirectUri, state));
}
