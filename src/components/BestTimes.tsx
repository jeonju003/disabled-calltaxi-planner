"use client";

import type { PatternAnalysis } from "@/lib/types";
import { dayLabel } from "@/lib/analyze";

export function BestTimes({ analysis }: { analysis: PatternAnalysis }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        콜택시 이용이 비교적 수월한 시간대
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        최근 {analysis.analyzedDays}일·{analysis.totalTrips.toLocaleString()}
        건 기준 상위 시간대입니다.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {analysis.bestSlots.map((slot) => (
          <li
            key={`${slot.dayOfWeek}-${slot.hour}`}
            className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm"
          >
            <span className="font-medium text-emerald-900">
              {dayLabel(slot.dayOfWeek)}요일 {slot.hour}:00~{slot.hour + 1}:00
            </span>
            <span className="text-emerald-800">
              평균 {slot.avgWaitMinutes}분
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
