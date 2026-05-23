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
      className="fixed bottom-0 inset-x-0 z-50 border-t border-sky-200/60 bg-white/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(14,165,233,0.1)] backdrop-blur-md md:hidden"
      aria-label="주 메뉴"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => (
          <li key={tab.id} className="flex-1">
            <button
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-all",
                active === tab.id
                  ? "text-sky-700"
                  : "text-slate-500 active:text-slate-700",
              )}
              aria-current={active === tab.id ? "page" : undefined}
            >
              <span
                className={cn(
                  "relative flex h-9 w-9 items-center justify-center rounded-2xl text-lg leading-none transition-all",
                  active === tab.id
                    ? "bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-md shadow-sky-300/50"
                    : "bg-sky-50/80",
                )}
                aria-hidden
              >
                {tab.icon}
                {tab.id === "calendar" &&
                  calendarCount != null &&
                  calendarCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-amber-950">
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
      className="hidden md:flex gap-2 rounded-2xl border border-sky-200/50 bg-white/70 p-1.5 shadow-sm backdrop-blur-sm"
      aria-label="주 메뉴"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            active === tab.id
              ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-300/40"
              : "text-slate-600 hover:bg-sky-50 hover:text-sky-800",
          )}
        >
          <span aria-hidden>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
