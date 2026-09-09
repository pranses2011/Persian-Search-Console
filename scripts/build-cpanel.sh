#!/usr/bin/env bash
# ============================================================
#  Persian Search Console — ساخت نسخه استاتیک cPanel
#  خروجی: dist/Persian-Search-Console-cPanel-vX.Y.Z.zip
#  این بسته فقط شامل HTML/JS/CSS است و روی هر هاست اشتراکی
#  (حتی بدون Node.js و بدون ترمینال) اجرا می‌شود.
# ============================================================
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(grep -o '"version": "[^"]*"' package.json | head -1 | cut -d'"' -f4)
OUT_DIR="out"
ZIP_NAME="Persian-Search-Console-cPanel-v${VERSION}.zip"
BACKUP_DIR=".api-backup"

echo "==> نسخه: ${VERSION}"

# ------------------------------------------------------------
# ۱. جابه‌جایی موقت API routes (با output:export ناسازگارند)
# ------------------------------------------------------------
if [ -d "${BACKUP_DIR}" ]; then
  echo "!! پوشه پشتیبان قبلی پیدا شد — در حال بازگردانی"
  rm -rf src/app/api
  mv "${BACKUP_DIR}" src/app/api
fi

echo "==> جابه‌جایی موقت src/app/api"
mv src/app/api "${BACKUP_DIR}"

# در صورت شکست build، API را برگردان
restore_api() {
  if [ -d "${BACKUP_DIR}" ]; then
    mv "${BACKUP_DIR}" src/app/api
    echo "==> src/app/api بازگردانی شد"
  fi
}
trap restore_api EXIT

# ------------------------------------------------------------
# ۲. ساخت اپلیکیشن در حالت استاتیک
# ------------------------------------------------------------
echo "==> ساخت نسخه استاتیک (next build)"
NEXT_PUBLIC_STATIC_MODE=true bunx next build

# ------------------------------------------------------------
# ۳. افزودن .htaccess بهینه‌شده
# ------------------------------------------------------------
echo "==> افزودن .htaccess"
cp deploy/cpanel/.htaccess "${OUT_DIR}/.htaccess"

# راهنمای متنی سریع داخل بسته
cat > "${OUT_DIR}/README-INSTALL.txt" << 'EOT'
Persian Search Console — نسخه استاتیک cPanel (vVERSION)
=========================================================

نصب در ۳ قدم:
۱) وارد cPanel شوید → File Manager → پوشه public_html
۲) فایل زیپ را Upload کنید → روی آن راست‌کلیک → Extract
۳) سایت خود را در مرورگر باز کنید — تمام!

راهنمای کامل مصور: فایل install-guide.html همراه بسته
(یا در گیت‌هاب: github.com/pranses2011/Persian-Search-Console)

- حالت نمایشی: بدون هیچ تنظیمی، همه امکانات با داده نمونه
- اتصال واقعی گوگل: از دکمه «تنظیمات اتصال گوگل» در صفحه ورود،
  Client ID خود را وارد کنید (راهنما: بخش ۵ فایل install-guide.html)
EOT
sed -i "s/vVERSION/v${VERSION}/" "${OUT_DIR}/README-INSTALL.txt"

# ------------------------------------------------------------
# ۴. زیپ‌کردن خروجی
# ------------------------------------------------------------
echo "==> ساخت بسته زیپ: dist/${ZIP_NAME}"
rm -f "dist/${ZIP_NAME}"
cd "${OUT_DIR}"
zip -r -q "../dist/${ZIP_NAME}" . -x ".*" > /dev/null 2>&1 || {
  # اگر zip نبود، از python استفاده کن
  cd ..
  python3 -c "
import shutil
shutil.make_archive('dist/Persian-Search-Console-cPanel-v${VERSION}', 'zip', 'out')
"
}
cd ..

# اطمینان از وجود .htaccess داخل زیپ (zip معمولا فایل‌های مخفی را می‌گیرد؛ چک نهایی)
python3 - << EOT
import zipfile
z = zipfile.ZipFile("dist/${ZIP_NAME}")
names = z.namelist()
if ".htaccess" not in names and "_htaccess" not in names:
    # افزودن دستی .htaccess
    with zipfile.ZipFile("dist/${ZIP_NAME}", "a") as zf:
        zf.write("deploy/cpanel/.htaccess", ".htaccess")
    print("==> .htaccess به زیپ اضافه شد")
print("==> فایل‌های زیپ:", len(names))
EOT

SIZE=$(du -h "dist/${ZIP_NAME}" | cut -f1)
echo ""
echo "✅ بسته آماده است: dist/${ZIP_NAME} (${SIZE})"
echo "   محتوا: ${OUT_DIR}/ (برای تست محلی: bunx serve out)"
