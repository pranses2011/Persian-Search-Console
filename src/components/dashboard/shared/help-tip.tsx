"use client";

// ============================================================
//  راهنمای درون‌برنامه‌ای (بخش ۵)
//  آیکون ❓ کنار هر بخش و معیار + توضیح فارسی ساده با مثال روزمره
// ============================================================

import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle, Lightbulb } from "lucide-react";

interface HelpTipProps {
  title: string; // عنوان راهنما
  children?: React.ReactNode; // توضیح اصلی
  example?: string; // مثال روزمره ساده
  side?: "top" | "bottom" | "left" | "right";
}

export function HelpTip({ title, children, example, side = "bottom" }: HelpTipProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        onClick={(e) => e.stopPropagation()}
        aria-label={`راهنما: ${title}`}
        title={`راهنما: ${title}`}
        className="inline-flex w-6 h-6 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </PopoverTrigger>
      <PopoverContent side={side} align="start" className="w-80 p-4">
        <div className="space-y-2.5">
          <p className="font-bold text-sm flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-primary" />
            {title}
          </p>
          {children && (
            <div className="text-xs leading-6 text-muted-foreground">{children}</div>
          )}
          {example && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-2.5 space-y-1">
              <p className="text-[11px] font-bold text-warning-foreground dark:text-amber-500 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" />
                مثال ساده
              </p>
              <p className="text-[11px] leading-6 text-muted-foreground">{example}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
