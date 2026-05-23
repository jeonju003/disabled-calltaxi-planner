"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppTab, PatternAnalysis } from "@/lib/types";
import { upcomingAppointments } from "@/lib/calendar-storage";
import { BestTimes } from "@/components/BestTimes";
import { DailyStatsPanel } from "@/components/DailyStatsPanel";
import { HourHeatmap } from "@/components/HourHeatmap";
import { DesktopNav, MobileNav } from "@/components/MobileNav";
import { SavedCalendar } from "@/components/SavedCalendar";
import { SchedulePlanner } from "@/components/SchedulePlanner";

export default function HomePage() {
  const [tab, setTab] = useState<AppTab>("pattern");
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(14);
  const [calendarCount, setCalendarCount] = useState(0);

  const refreshCalendarCount = useCallback(() => {
    setCalendarCount(upcomingAppointments(90).length);
  }, []);

  useEffect(() => {
    refreshCalendarCount();
    window.addEventListener("calltaxi-calendar-updated", refreshCalendarCount);
    return () =>
      window.removeEventListener(
        "calltaxi-calendar-updated",
        refreshCalendarCount,
      );
  }, [refreshCalendarCount]);

  useEffect(() => {
    if (tab !== "pattern") return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/patterns?days=${days}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "불러오기 실패");
        if (!cancelled) {
          setAnalysis(data);
          setNotice(data.notice ?? null);
        }
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
  }, [days, tab]);

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 sm:px-6 md:pb-10">
        <header className="mb-6">
          <p className="text-sm font-medium text-sky-700">서울 장애인 콜택시</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            일정·이용 도우미
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed sm:text-base">
            시간대 패턴·일별 통계·약속 일정을 한곳에서 확인합니다.
          </p>
          <div className="mt-4">
            <DesktopNav active={tab} onChange={setTab} />
          </div>
        </header>

        {(tab === "pattern" || tab === "daily") && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span className="flex-1 min-w-[200px]">
              공공데이터는 <strong>최소 하루 전</strong> 기준입니다. 참고용으로
              활용하세요.
            </span>
            {tab === "pattern" && (
              <label className="flex items-center gap-2 text-slate-700 text-sm">
                분석 기간
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                >
                  <option value={7}>7일</option>
                  <option value={14}>14일</option>
                  <option value={21}>21일</option>
                </select>
              </label>
            )}
          </div>
        )}

        {notice && tab === "pattern" && (
          <p className="mb-4 rounded-lg bg-sky-50 px-4 py-2 text-sm text-sky-900">
            {notice}
          </p>
        )}

        {tab === "pattern" && (
          <>
            {loading && (
              <p className="py-16 text-center text-slate-500">패턴 분석 중…</p>
            )}
            {error && (
              <p className="rounded-lg bg-rose-50 px-4 py-3 text-rose-700">
                {error}
              </p>
            )}
            {analysis && !loading && (
              <div className="space-y-6">
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
                  <StatCard
                    label="분석 건수"
                    value={`${analysis.totalTrips.toLocaleString()}건`}
                  />
                  <StatCard
                    label="데이터"
                    value={
                      analysis.dataSource === "api" ? "서울 Open API" : "데모"
                    }
                  />
                  <StatCard
                    label="분석 일수"
                    value={`${analysis.analyzedDays}일`}
                  />
                </div>
                <BestTimes analysis={analysis} />
                <HourHeatmap analysis={analysis} />
              </div>
            )}
          </>
        )}

        {tab === "daily" && <DailyStatsPanel days={days} />}

        {tab === "plan" && (
          <SchedulePlanner
            onSaved={() => {
              refreshCalendarCount();
              setTab("calendar");
            }}
          />
        )}

        {tab === "calendar" && <SavedCalendar />}
      </main>

      <MobileNav
        active={tab}
        onChange={setTab}
        calendarCount={calendarCount}
      />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
        {value}
      </p>
    </div>
  );
}
