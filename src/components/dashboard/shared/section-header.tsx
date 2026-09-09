"use client";

// سرتیپ بخش‌های داشبورد — عنوان + توضیح + راهنمای درون‌برنامه‌ای
import * as React from "react";
import { HelpTip } from "./help-tip";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  help?: { title: string; body: React.ReactNode; example?: string };
  extra?: React.ReactNode; // عناصر اضافی سمت دیگر (مثل دکمه‌ها)
}

export function SectionHeader({ icon, title, description, help, extra }: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
            {help && (
              <HelpTip title={help.title} example={help.example}>
                {help.body}
              </HelpTip>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl leading-6">{description}</p>
          )}
        </div>
      </div>
      {extra && <div className="flex items-center gap-2">{extra}</div>}
    </div>
  );
}
