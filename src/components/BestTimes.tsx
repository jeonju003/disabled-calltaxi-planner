"use client";

import type { PatternAnalysis } from "@/lib/types";
import { dayLabel } from "@/lib/analyze";

export function BestTimes({ analysis }: { analysis: PatternAnalysis }) {
  return (
    <section className="card-hope p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="section-icon shrink-0" aria-hidden>
          🌟
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            콜택시 이용이 비교적 수월한 시간대
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            최근 {analysis.analyzedDays}일·{analysis.totalTrips.toLocaleString()}
            건 기준, 여유로운 시간을 골라 보세요.
          </p>
        </div>
      </div>
      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {analysis.bestSlots.map((slot, i) => (
          <li
            key={`${slot.dayOfWeek}-${slot.hour}`}
            className="flex items-center justify-between rounded-2xl border border-emerald-200/50 bg-gradient-to-r from-emerald-50 to-teal-50/50 px-4 py-3.5 text-sm shadow-sm"
          >
            <span className="font-semibold text-emerald-900">
              <span className="mr-1 opacity-70" aria-hidden>
                {["🥇", "🥈", "🥉", "✓", "✓", "✓", "✓", "✓"][i] ?? "✓"}
              </span>
              {dayLabel(slot.dayOfWeek)} {slot.hour}:00~{slot.hour + 1}:00
            </span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-emerald-700">
              약 {slot.avgWaitMinutes}분
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
