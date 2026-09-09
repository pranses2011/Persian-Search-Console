#!/usr/bin/env python3
# ============================================================
#  Persian Search Console — ساخت نسخه خودکفای راهنمای نصب
#  ورودی:  docs/install-guide-cpanel.html (مسیرهای نسبی)
#  خروجی: dist/install-guide.html (تک‌فایل — تصاویر و فونت
#          به‌صورت base64 داخل خود فایل قرار می‌گیرند)
#  کاربرد: قرار گرفتن داخل بسته ZIP نصب cPanel و پیوست ریلیز
# ============================================================
import base64
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "install-guide-cpanel.html")
OUT = os.path.join(ROOT, "dist", "install-guide.html")

MIME = {".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
        ".woff2": "font/woff2", ".css": "text/css"}


def to_data_uri(rel_path: str) -> str:
    """تبدیل مسیر نسبی به data URI"""
    path = os.path.normpath(os.path.join(ROOT, "docs", rel_path))
    if not os.path.exists(path):
        print(f"!! WARNING: not found: {path}")
        return rel_path
    ext = os.path.splitext(path)[1].lower()
    mime = MIME.get(ext, "application/octet-stream")
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def main() -> int:
    with open(SRC, encoding="utf-8") as f:
        html = f.read()

    # ۱) فونت‌ها: url('../src/app/fonts/X.woff2') → data URI
    def font_repl(m):
        return f"url('{to_data_uri(m.group(1))}')"

    html, n_fonts = re.subn(r"url\('([^']*\.woff2)'\)", font_repl, html)

    # ۲) تصاویر: src="../screenshots/cpanel-guide/X.png" → data URI
    def img_repl(m):
        return f'src="{to_data_uri(m.group(1))}"'

    html, n_imgs = re.subn(r'src="([^"]*screenshots[^"]*)"', img_repl, html)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)

    size = os.path.getsize(OUT)
    print(f"==> فونت‌ها: {n_fonts} | تصاویر: {n_imgs}")
    print(f"✅ نسخه خودکفا ساخته شد: dist/install-guide.html ({size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
