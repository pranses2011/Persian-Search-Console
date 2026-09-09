"use client";

// تأمین‌کننده‌های سراسری: تم روشن/تاریک + React Query
// (در نسخه استاتیک cPanel، شیم API مرورگر همین‌جا نصب می‌شود)
import * as React from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { installStaticApi } from "@/lib/static-api";

// نصب شیم API قبل از اولین رندر — پیش از هر fetchی
installStaticApi();

export function Providers({ children }: { children: React.ReactNode }) {
  // ساخت کلاینت Query فقط یک بار در سمت کاربر
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // داده تا ۱ دقیقه تازه می‌ماند
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
