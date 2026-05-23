"use client";

import type { AppTab } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: "pattern", label: "패턴", icon: "📊" },
  { id: "daily", label: "일별", icon: "📅" },
  { id: "plan", label: "일정", icon: "🕐" },
  { id: "calendar", label: "내 일정", icon: "✓" },
];

export function MobileNav({
  active,
  onChange,
  calendarCount,
}: {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  calendarCount?: number;
}) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="주 메뉴"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => (
          <li key={tab.id} className="flex-1">
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active === tab.id
                  ? "text-sky-700"
                  : "text-slate-500 active:text-slate-800",
              )}
              aria-current={active === tab.id ? "page" : undefined}
            >
              <span className="relative text-lg leading-none" aria-hidden>
                {tab.icon}
                {tab.id === "calendar" && calendarCount != null && calendarCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[9px] text-white">
                    {calendarCount > 9 ? "9+" : calendarCount}
                  </span>
                )}
              </span>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DesktopNav({
  active,
  onChange,
}: {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <nav
      className="hidden md:flex gap-1 rounded-xl bg-slate-100 p-1"
      aria-label="주 메뉴"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-white text-sky-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900",
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
