// ============================================================
//  مدیریت نشست و احراز هویت - Persian Search Console
//  نشست مبتنی بر کوکی httpOnly + توکن‌های گوگل در دیتابیس
// ============================================================

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { AppUser } from "@/lib/types";

// نام کوکی نشست
export const SESSION_COOKIE = "psc_session";

// مدت اعتبار نشست (پیش‌فرض ۳۰ روز)
const SESSION_MAX_AGE_HOURS = Number(process.env.SESSION_MAX_AGE_HOURS || 720);

/** ساخت نشست جدید برای کاربر و تنظیم کوکی امن httpOnly */
export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_HOURS * 60 * 60 * 1000
  );

  await db.session.create({
    data: { id: sessionId, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return sessionId;
}

/** خواندن نشست فعلی؛ اگر نشست معتبر باشد کاربر را برمی‌گرداند */
export async function getSession(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) return null;

  // بررسی انقضای نشست
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatarUrl: session.user.avatarUrl,
    isDemo: session.user.isDemo,
  };
}

/** خروج: حذف نشست از دیتابیس و پاک‌کردن کوکی و توکن‌ها */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    // حذف نشست و توکن‌های ذخیره‌شده کاربر
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (session) {
      await db.user
        .update({
          where: { id: session.userId },
          data: { accessToken: null, refreshToken: null, tokenExpiresAt: null },
        })
        .catch(() => {});
      await db.session.delete({ where: { id: sessionId } }).catch(() => {});
    }
  }

  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** دریافت آدرس (origin) فعلی برای ساخت redirect_uri */
export function getOrigin(req: Request): string {
  // اولویت با متغیر محیطی، بعد هدر Origin و در نهایت URL درخواست
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const originHeader = req.headers.get("origin");
  if (originHeader) return originHeader;
  const host = req.headers.get("host") || "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
