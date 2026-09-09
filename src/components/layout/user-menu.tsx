"use client";

// ============================================================
//  منوی کاربر در هدر — نمایش نام، ایمیل و آواتار + دکمه خروج
// ============================================================

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/app-store";
import { toFaDigits } from "@/lib/format";
import { LogOut, User, ShieldQuestion, ChevronDown } from "lucide-react";

export function UserMenu() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();

  if (!user) return null;

  // حروف اول نام برای آواتار جایگزین
  const initials = (user.name || user.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  // خروج: پاک‌کردن توکن‌ها و نشست
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setView("login");
      toast({
        title: "با موفقیت خارج شدید",
        description: "توکن‌های دسترسی شما پاک شد.",
      });
    } catch {
      toast({
        title: "خطا در خروج",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  }

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full ps-1 pe-2 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="w-8 h-8 border border-border">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.name || "کاربر"} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden md:inline text-sm font-medium max-w-32 truncate">
          {user.name || user.email}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {/* اطلاعات کاربر */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold leading-none">{user.name || "کاربر"}</p>
              {user.isDemo && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                  حالت نمایشی
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled className="gap-2">
            <User className="w-4 h-4" />
            حساب کاربری گوگل
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="gap-2">
            <ShieldQuestion className="w-4 h-4" />
            سطح دسترسی: {user.isDemo ? "نمایشی" : "مالک / کامل"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* دکمه خروج */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="gap-2 text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
