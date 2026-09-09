"use client";

// دکمه تغییر حالت روشن/تاریک
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // برای جلوگیری از ناهماهنگی هیدراسیون
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" className="w-9 h-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-9 h-9 rounded-full"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
      aria-label="تغییر حالت روشن/تاریک"
    >
      {theme === "dark" ? (
        <Sun className="h-4.5 w-4.5" />
      ) : (
        <Moon className="h-4.5 w-4.5" />
      )}
    </Button>
  );
}
