import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

// POST /api/auth/logout — خروج و پاک‌کردن توکن‌ها و نشست
export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
