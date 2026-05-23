"use client";

import { useEffect, useState } from "react";
import type { DailyUsageStat } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type DailyResponse = {
  stats: DailyUsageStat[];
  dataSource: "api" | "demo";
  notice?: string;
  dateRange: { from: string; to: string };
  summary: {
    avgWaitMinutes: number;
    easiestDay?: string;
    easiestWait?: number;
    busiestDay?: string;
    busiestWait?: number;
  };
};

export function DailyStatsPanel({ days }: { days: number }) {
  const [data, setData] = useState<DailyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/daily-stats?days=${days}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "조회 실패");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "오류");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading) {
    return (
      <p className="py-12 text-center text-slate-500 text-sm">
        일별 이용현황 불러오는 중…
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {error}
      </p>
    );
  }

  if (!data) return null;

  const maxWait = Math.max(...data.stats.map((s) => s.avgWaitMinutes), 1);

  return (
    <div className="space-y-4">
      {data.notice && (
        <p className="rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-900">
          {data.notice}
        </p>
      )}

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <MiniStat label="기간 평균 대기" value={`${data.summary.avgWaitMinutes}분`} />
        <MiniStat
          label="가장 수월한 날"
          value={
            data.summary.easiestDay
              ? `${formatShort(data.summary.easiestDay)} · ${data.summary.easiestWait}분`
              : "-"
          }
        />
        <MiniStat
          label="가장 혼잡한 날"
          value={
            data.summary.busiestDay
              ? `${formatShort(data.summary.busiestDay)} · ${data.summary.busiestWait}분`
              : "-"
          }
        />
        <MiniStat
          label="출처"
          value={data.dataSource === "api" ? "시설공단 API" : "데모"}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          일별 평균 대기시간
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {data.dateRange.from} ~ {data.dateRange.to}
        </p>
        <div className="mt-4 flex items-end gap-1 overflow-x-auto pb-2 min-h-[140px]">
          {data.stats.map((s) => {
            const h = Math.max(12, (s.avgWaitMinutes / maxWait) * 100);
            const level =
              s.avgWaitMinutes <= data.summary.avgWaitMinutes - 3
                ? "easy"
                : s.avgWaitMinutes >= data.summary.avgWaitMinutes + 3
                  ? "busy"
                  : "moderate";
            return (
              <div
                key={s.date}
                className="flex min-w-[28px] flex-1 flex-col items-center gap-1"
                title={`접수 ${s.receivedCalls.toLocaleString()}건 · 탑승 ${s.boardedCalls.toLocaleString()}건`}
              >
                <span className="text-[10px] text-slate-600">
                  {s.avgWaitMinutes}
                </span>
                <div
                  className={cn(
                    "w-full max-w-[36px] rounded-t-md",
                    level === "easy" && "bg-emerald-400",
                    level === "moderate" && "bg-amber-300",
                    level === "busy" && "bg-rose-400",
                  )}
                  style={{ height: `${h}px` }}
                />
                <span className="text-[9px] text-slate-500 -rotate-45 origin-top-left whitespace-nowrap">
                  {formatShort(s.date)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <h2 className="px-4 pt-4 text-base font-semibold text-slate-900">
          일별 상세
        </h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-3 py-2">날짜</th>
                <th className="px-3 py-2">차량</th>
                <th className="px-3 py-2">접수</th>
                <th className="px-3 py-2">탑승</th>
                <th className="px-3 py-2">대기(분)</th>
              </tr>
            </thead>
            <tbody>
              {[...data.stats].reverse().map((s) => (
                <tr key={s.date} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{s.date}</td>
                  <td className="px-3 py-2">{s.vehicleCount}</td>
                  <td className="px-3 py-2">
                    {s.receivedCalls.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {s.boardedCalls.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{s.avgWaitMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatShort(iso: string) {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}
