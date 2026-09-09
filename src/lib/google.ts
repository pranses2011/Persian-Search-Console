// ============================================================
//  Google OAuth 2.0 — ساخت لینک ورود، تبادل کد با توکن، تازه‌سازی
// ============================================================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// دامنه‌های دسترسی (Scope) طبق درخواست:
// webmasters.readonly + webmasters + پروفایل و ایمیل کاربر
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

/** آیا کلیدهای گوگل در فایل .env تنظیم شده‌اند؟ */
export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

/** ساخت آدرس صفحه رضایت گوگل (Consent Screen) */
export function buildGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    // access_type=offline برای دریافت Refresh Token
    access_type: "offline",
    // prompt=consent برای اطمینان از دریافت refresh token در ورود مجدد
    prompt: "consent",
    state,
    include_granted_scopes: "true",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** ساخت آدرس بازگشت (Redirect URI) */
export function getRedirectUri(origin: string): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ||
    `${origin}/api/auth/google/callback`
  );
}

// پاسخ تبادل کد با توکن
export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // ثانیه
  scope?: string;
  token_type: string;
  id_token?: string;
}

/** تبادل کد تأیید با توکن‌های دسترسی */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`خطا در تبادل کد با گوگل: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleTokens;
}

/** تازه‌سازی Access Token با Refresh Token بدون نیاز به ورود مجدد */
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`خطا در تازه‌سازی توکن: ${res.status} ${text}`);
  }
  return (await res.json()) as GoogleTokens;
}

/** اطلاعات پروفایل کاربر گوگل (نام، ایمیل، آواتار) */
export async function fetchGoogleUserInfo(
  accessToken: string
): Promise<{ sub: string; email: string; name?: string; picture?: string }> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`خطا در دریافت اطلاعات کاربر: ${res.status}`);
  }
  return (await res.json()) as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  };
}
