// ============================================================
//  ساخت و دانلود خروجی CSV سازگار با اکسل (با BOM فارسی)
// ============================================================

/** ساخت رشته CSV از ردیف‌ها — پشتیبانی از کاما داخل مقادیر */
export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number) => {
    const s = String(val);
    // اگر کاما یا نقل‌قول دارد، داخل نقل‌قول با دوبرابر کردن
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

/** دانلود CSV با BOM (حرف‌های فارسی در اکسل درست نمایش داده شوند) */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = "\uFEFF" + buildCsv(headers, rows); // BOM برای UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : filename + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
