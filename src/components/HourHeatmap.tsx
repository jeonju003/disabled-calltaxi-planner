"use client";

import type { PatternAnalysis } from "@/lib/types";
import { dayLabel } from "@/lib/analyze";
import { cn } from "@/lib/utils/cn";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

function cellClass(level: string) {
  if (level === "easy") return "bg-emerald-400/90 text-emerald-950";
  if (level === "moderate") return "bg-amber-300/90 text-amber-950";
  return "bg-rose-400/90 text-rose-950";
}

export function HourHeatmap({ analysis }: { analysis: PatternAnalysis }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            요일·시간대별 이용 난이도
          </h2>
          <p className="text-sm text-slate-600">
            과거 배차~승차 대기시간·이용량을 기준으로 한 참고 지도입니다.
          </p>
        </div>
        <div className="flex gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <i className="inline-block h-3 w-3 rounded bg-emerald-400" />
            여유
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-3 w-3 rounded bg-amber-300" />
            보통
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-3 w-3 rounded bg-rose-400" />
            혼잡
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[3rem_repeat(17,1fr)] gap-1 text-center text-xs text-slate-500">
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
              <div className="flex items-center text-sm font-medium text-slate-700">
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
                      "flex h-9 items-center justify-center rounded-md text-[10px] font-medium",
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
