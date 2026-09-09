// ============================================================
//  ابزارهای قالب‌بندی فارسی
//  تبدیل اعداد به فارسی، تاریخ شمسی (جلالی) و قالب‌بندی اعداد بزرگ
// ============================================================

// جدول ارقام فارسی: ۰ ۱ ۲ ۳ ۴ ۵ ۶ ۷ ۸ ۹
const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیل یک رشته یا عدد به ارقام فارسی */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** تبدیل رشته ارقام فارسی/عربی به عدد لاتین */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** عدد با جداکننده هزارگان و ارقام فارسی — مثال: ۱٬۲۳۴٬۵۶۷ */
export function faNumber(n: number, fractionDigits = 0): string {
  if (!isFinite(n)) return "—";
  const fixed = n.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return toFaDigits(fixed).replace(/,/g, "٬");
}

/** قالب‌بندی فشرده اعداد بزرگ برای کارت‌ها — مثال: ۱۲.۳ هزار / ۲.۱ میلیون */
export function faCompact(n: number): string {
  if (!isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return toFaDigits((n / 1_000_000_000).toFixed(1)) + " میلیارد";
  if (abs >= 1_000_000) return toFaDigits((n / 1_000_000).toFixed(1)) + " میلیون";
  if (abs >= 10_000) return toFaDigits(Math.round(n / 1000)) + " هزار";
  return faNumber(n);
}

/** درصد فارسی — مثال: ۳٫۴۲٪ */
export function faPercent(n: number, fractionDigits = 2): string {
  if (!isFinite(n)) return "—";
  return toFaDigits(n.toFixed(fractionDigits)).replace(".", "٫") + "٪";
}

/** درصد تغییرات با علامت — مثال: ‎+۱۲٪ (منفی برای کاهش) */
export function faDelta(n: number, fractionDigits = 1): string {
  if (!isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return sign + toFaDigits(Math.abs(n).toFixed(fractionDigits)).replace(".", "٫") + "٪";
}

// ============================================================
//  تبدیل تاریخ میلادی به شمسی (جلالی)
//  الگوریتم استاندارد بدون نیاز به کتابخانه خارجی
// ============================================================

function div(a: number, b: number): number {
  return Math.floor(a / b);
}

/** تبدیل میلادی به جلالی؛ خروجی: [سال، ماه، روز] */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const WEEKDAYS_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

/** تاریخ شمسی کامل — مثال: ۱۵ مهر ۱۴۰۳ */
export function faJalaliDate(date: Date, opts?: { withYear?: boolean; weekday?: boolean }): string {
  const [jy, jm, jd] = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  let out = opts?.withYear === false ? `${toFaDigits(jd)} ${JALALI_MONTHS[jm - 1]}` : `${toFaDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toFaDigits(jy)}`;
  if (opts?.weekday) {
    out = WEEKDAYS_FA[date.getDay()] + "، " + out;
  }
  return out;
}

/** تاریخ شمسی کوتاه — مثال: ۱۴۰۳/۰۷/۱۵ */
export function faJalaliShort(date: Date): string {
  const [jy, jm, jd] = gregorianToJalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  return toFaDigits(
    `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`
  );
}

/** تاریخ و ساعت شمسی — مثال: ۱۴۰۳/۰۷/۱۵ ساعت ۰۹:۳۰ */
export function faJalaliDateTime(date: Date): string {
  const time = toFaDigits(
    `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  );
  return `${faJalaliShort(date)} ساعت ${time}`;
}

/** نام ماه شمسی */
export function jalaliMonthName(date: Date): string {
  const [, jm] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return JALALI_MONTHS[jm - 1];
}

/** مدت زمان نسبی فارسی — مثال: «۳ روز پیش» */
export function faTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "همین الان";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${faNumber(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${faNumber(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${faNumber(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${faNumber(months)} ماه پیش`;
  return `${faNumber(Math.floor(months / 12))} سال پیش`;
}

/** قالب‌بندی مدت زمان به دقیقه:ثانیه برای LCP و INP — مثال: ۲٫۴ ثانیه */
export function faSeconds(ms: number): string {
  return toFaDigits((ms / 1000).toFixed(1)).replace(".", "٫") + " ثانیه";
}

/** رشته ISO تاریخ (YYYY-MM-DD) به Date بدون مشکل منطقه زمانی */
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Date به رشته ISO تاریخ (YYYY-MM-DD) */
export function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
