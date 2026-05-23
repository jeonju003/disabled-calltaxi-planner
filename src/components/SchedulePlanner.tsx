"use client";

import { useState } from "react";
import type { ScheduleAdvice } from "@/lib/types";
import { saveFromAdvice } from "@/lib/calendar-storage";
import { notifyCalendarUpdated } from "@/components/SavedCalendar";
import { cn } from "@/lib/utils/cn";

function levelBadge(level: string) {
  if (level === "easy") return "bg-emerald-100 text-emerald-800";
  if (level === "busy") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-800";
}

function levelLabel(level: string) {
  if (level === "easy") return "여유";
  if (level === "busy") return "혼잡";
  return "보통";
}

export function SchedulePlanner({ onSaved }: { onSaved?: () => void }) {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [appointmentAt, setAppointmentAt] = useState("");
  const [travelMinutes, setTravelMinutes] = useState(40);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<ScheduleAdvice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAdvice(null);
    setSavedMsg(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentAt: new Date(appointmentAt).toISOString(),
          travelMinutes,
          bufferMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      setAdvice(data.advice);
      if (!title.trim()) {
        setTitle("외출 약속");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!advice) return;
    const name = title.trim() || "외출 약속";
    saveFromAdvice(name, memo.trim() || undefined, advice, travelMinutes, bufferMinutes);
    notifyCalendarUpdated();
    setSavedMsg("캘린더에 저장했습니다. 「내 일정」 탭에서 확인하세요.");
    onSaved?.();
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">약속 일정 도우미</h2>
      <p className="mt-1 text-sm text-slate-600">
        약속 시간을 입력하면 콜 접수 권장 시각과 그 시간대의 이용 난이도를
        알려드립니다.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">일정 제목</span>
          <input
            type="text"
            placeholder="예: 병원 진료, 친구 모임"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:text-sm"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">약속 일시</span>
          <input
            type="datetime-local"
            required
            value={appointmentAt}
            onChange={(e) => setAppointmentAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:text-sm"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">메모 (선택)</span>
          <input
            type="text"
            placeholder="출발지, 동행 등"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            예상 이동 시간(분)
          </span>
          <input
            type="number"
            min={10}
            max={120}
            value={travelMinutes}
            onChange={(e) => setTravelMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            여유 버퍼(분)
          </span>
          <input
            type="number"
            min={5}
            max={60}
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base sm:text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="sm:col-span-2 rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60 active:bg-sky-800"
        >
          {loading ? "분석 중…" : "일정 추천 받기"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {advice && (
        <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                levelBadge(advice.slotLevel),
              )}
            >
              {levelLabel(advice.slotLevel)}
            </span>
            <span className="text-sm text-slate-600">
              평균 대기 약 {advice.avgWaitMinutes}분
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-800">{advice.message}</p>
          <p className="text-sm text-slate-700">
            <strong>콜 접수 권장:</strong>{" "}
            {new Date(advice.suggestedCallAt).toLocaleString("ko-KR")}
          </p>
          {advice.alternatives.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500">
                비슷한 시간대 대안
              </p>
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {advice.alternatives.map((alt) => (
                  <li key={alt.time}>
                    {alt.time} · {levelLabel(alt.level)} (약{" "}
                    {alt.avgWaitMinutes}분)
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 min-w-[140px] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white active:bg-emerald-700"
            >
              캘린더에 저장
            </button>
          </div>
          {savedMsg && (
            <p className="text-sm text-emerald-800 font-medium">{savedMsg}</p>
          )}
        </div>
      )}
    </section>
  );
}
