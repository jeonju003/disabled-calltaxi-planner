"use client";

import type { PatternAnalysis } from "@/lib/types";
import { dayLabel } from "@/lib/analyze";
import { cn } from "@/lib/utils/cn";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

function cellClass(level: string) {
  if (level === "easy")
    return "bg-gradient-to-b from-teal-300 to-emerald-400 text-emerald-950 shadow-sm";
  if (level === "moderate")
    return "bg-gradient-to-b from-amber-200 to-amber-300 text-amber-950";
  return "bg-gradient-to-b from-orange-300 to-rose-300 text-rose-950";
}

export function HourHeatmap({ analysis }: { analysis: PatternAnalysis }) {
  return (
    <section className="card-hope p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="section-icon shrink-0" aria-hidden>
            🗓️
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              요일·시간대별 이용 난이도
            </h2>
            <p className="text-sm text-slate-600">
              밝은 색일수록 대기가 짧고 이용이 수월한 시간대입니다.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-md bg-emerald-400" />
            여유
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-md bg-amber-300" />
            보통
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-md bg-orange-300" />
            혼잡
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-sky-50/40 p-2">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[3rem_repeat(17,1fr)] gap-1 text-center text-xs font-medium text-sky-800/70">
            <div />
            {HOURS.map((h) => (
              <div key={h}>{h}시</div>
            ))}
          </div>
          {[1, 2, 3, 4, 5, 6, 0].map((dow) => (
            <div
              key={dow}
              className="mt-1 grid grid-cols-[3rem_repeat(17,1fr)] gap-1"
            >
              <div className="flex items-center text-sm font-semibold text-slate-700">
                {dayLabel(dow)}
              </div>
              {HOURS.map((hour) => {
                const slot = analysis.slots.find(
                  (s) => s.dayOfWeek === dow && s.hour === hour,
                );
                const level = slot?.level ?? "moderate";
                return (
                  <div
                    key={`${dow}-${hour}`}
                    title={
                      slot
                        ? `평균 대기 ${slot.avgWaitMinutes}분 · 표본 ${slot.sampleCount}건`
                        : "데이터 없음"
                    }
                    className={cn(
                      "flex h-9 items-center justify-center rounded-lg text-[10px] font-bold",
                      cellClass(level),
                    )}
                  >
                    {slot ? `${slot.avgWaitMinutes}` : "-"}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
