// ============================================================
//  لایه کش داده‌ها — کش حافظه با TTL + ذخیره‌سازی در دیتابیس
//  برای کاهش درخواست‌های مکرر به API گوگل
// ============================================================

import { db } from "@/lib/db";

const DEFAULT_TTL = Number(process.env.DATA_CACHE_TTL_SECONDS || 300);

// کش حافظه درون‌پردازشی
const memoryCache = new Map<string, { payload: unknown; expiresAt: number }>();

/**
 * خواندن از کش (اول حافظه، بعد دیتابیس)
 * کلید باید یکتا باشد: مثل «performance:digiblog.ir:2024-01-01:2024-01-28»
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // ۱) کش حافظه
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.payload as T;
  }
  if (mem) memoryCache.delete(key);

  // ۲) کش دیتابیس (ماندگار بین ری‌استارت‌های dev)
  try {
    const row = await db.dataCache.findUnique({ where: { key } });
    if (row && row.expiresAt > new Date()) {
      const parsed = JSON.parse(row.payload) as T;
      memoryCache.set(key, {
        payload: parsed,
        expiresAt: row.expiresAt.getTime(),
      });
      return parsed;
    }
    if (row) {
      await db.dataCache.delete({ where: { key } }).catch(() => {});
    }
  } catch {
    // خطای دیتابیس کش را نادیده بگیر — داده اصلی برمی‌گردد
  }

  return null;
}

/** نوشتن در کش (حافظه + دیتابیس) */
export async function cacheSet(key: string, payload: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;

  // حافظه
  memoryCache.set(key, { payload, expiresAt });

  // دیتابیس
  try {
    await db.dataCache.upsert({
      where: { key },
      update: { payload: JSON.stringify(payload), expiresAt: new Date(expiresAt) },
      create: { key, payload: JSON.stringify(payload), expiresAt: new Date(expiresAt) },
    });
  } catch {
    // نادیده گرفتن خطای کش دیتابیس
  }

  // پاک‌سازی دوره‌ای کش منقضی حافظه
  if (memoryCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of memoryCache) {
      if (v.expiresAt < now) memoryCache.delete(k);
    }
  }
}

/** اجرای تابع با کش — اگر در کش بود برمی‌گرداند وگرنه اجرا و ذخیره */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL
): Promise<{ data: T; cached: boolean }> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) {
    return { data: hit, cached: true };
  }
  const data = await fn();
  await cacheSet(key, data, ttlSeconds);
  return { data, cached: false };
}
