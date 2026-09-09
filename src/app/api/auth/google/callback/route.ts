import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSession, getOrigin } from "@/lib/auth";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  getRedirectUri,
} from "@/lib/google";

// GET /api/auth/google/callback — بازگشت از گوگل پس از تأیید دسترسی
// کد تأیید را با توکن تبادل می‌کند، کاربر را ثبت/به‌روزرسانی و نشست می‌سازد
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // اگر کاربر در صفحه گوگل رضایت نداد یا خطایی رخ داد
  if (error) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error)}`, req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/?auth_error=missing_code", req.url));
  }

  // بررسی state برای جلوگیری از CSRF
  const cookieStore = await cookies();
  const savedState = cookieStore.get("psc_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/?auth_error=invalid_state", req.url));
  }
  // پاک‌کردن state استفاده‌شده
  cookieStore.set("psc_oauth_state", "", { httpOnly: true, path: "/", maxAge: 0 });

  try {
    const origin = getOrigin(req);
    const redirectUri = getRedirectUri(origin);

    // ۱) تبادل کد با توکن‌ها (Access + Refresh)
    const tokens = await exchangeCodeForTokens(code, redirectUri);

    // ۲) دریافت اطلاعات پروفایل کاربر
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    // ۳) ثبت یا به‌روزرسانی کاربر در دیتابیس + ذخیره توکن‌ها
    const user = await db.user.upsert({
      where: { email: profile.email },
      update: {
        googleId: profile.sub,
        name: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
        isDemo: false,
        accessToken: tokens.access_token,
        // refresh_token فقط بار اول (یا با prompt=consent) ارسال می‌شود
        refreshToken: tokens.refresh_token ?? undefined,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        tokenScope: tokens.scope ?? null,
      },
      create: {
        googleId: profile.sub,
        email: profile.email,
        name: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
        isDemo: false,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        tokenScope: tokens.scope ?? null,
      },
    });

    // ۴) ساخت نشست ورود
    await createSession(user.id);

    // بازگشت به صفحه اصلی برنامه
    return NextResponse.redirect(new URL("/", req.url));
  } catch (err) {
    console.error("خطا در پردازش بازگشت گوگل:", err);
    return NextResponse.redirect(new URL("/?auth_error=token_exchange", req.url));
  }
}
