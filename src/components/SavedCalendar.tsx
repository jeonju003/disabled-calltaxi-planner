"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedAppointment } from "@/lib/types";
import {
  downloadIcs,
  listAppointments,
  removeAppointment,
  upcomingAppointments,
} from "@/lib/calendar-storage";
import { cn } from "@/lib/utils/cn";

function levelBadge(level?: string) {
  if (level === "easy") return "bg-emerald-100 text-emerald-800";
  if (level === "busy") return "bg-rose-100 text-rose-800";
  return "bg-amber-100 text-amber-800";
}

export function SavedCalendar() {
  const [items, setItems] = useState<SavedAppointment[]>([]);

  const refresh = useCallback(() => {
    setItems(upcomingAppointments(90));
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes("calltaxi-planner-calendar")) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("calltaxi-calendar-updated", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("calltaxi-calendar-updated", refresh);
    };
  }, [refresh]);

  const past = listAppointments().filter(
    (a) => new Date(a.appointmentAt).getTime() < Date.now() - 86400000,
  );

  if (items.length === 0 && past.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600 text-sm">
          저장된 일정이 없습니다.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          「일정」 탭에서 약속을 분석한 뒤 「캘린더에 저장」을 눌러 보세요.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {items.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">다가오는 일정</h2>
          {items.map((item) => (
            <AppointmentCard
              key={item.id}
              item={item}
              onRemove={() => {
                removeAppointment(item.id);
                refresh();
              }}
            />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3 opacity-80">
          <h2 className="text-base font-medium text-slate-600">지난 일정</h2>
          {past.slice(-5).reverse().map((item) => (
            <AppointmentCard
              key={item.id}
              item={item}
              muted
              onRemove={() => {
                removeAppointment(item.id);
                refresh();
              }}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function AppointmentCard({
  item,
  muted,
  onRemove,
}: {
  item: SavedAppointment;
  muted?: boolean;
  onRemove: () => void;
}) {
  const appt = new Date(item.appointmentAt);
  const call = new Date(item.suggestedCallAt);
  const isPast = appt.getTime() < Date.now();

  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        muted && "bg-slate-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{item.title}</h3>
          {item.memo && (
            <p className="mt-1 text-sm text-slate-600">{item.memo}</p>
          )}
        </div>
        {item.slotLevel && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              levelBadge(item.slotLevel),
            )}
          >
            {item.slotLevel === "easy"
              ? "여유"
              : item.slotLevel === "busy"
                ? "혼잡"
                : "보통"}
          </span>
        )}
      </div>

      <dl className="mt-3 grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">약속</dt>
          <dd className="text-right font-medium">
            {appt.toLocaleString("ko-KR")}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">콜 접수 권장</dt>
          <dd
            className={cn(
              "text-right font-medium",
              !isPast && call.getTime() - Date.now() < 3600000 && "text-sky-700",
            )}
          >
            {call.toLocaleString("ko-KR")}
          </dd>
        </div>
        {item.avgWaitMinutes != null && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">당시대 예상 대기</dt>
            <dd>약 {item.avgWaitMinutes}분</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadIcs(item)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-100"
        >
          휴대폰 캘린더(.ics)
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg px-3 py-2 text-xs font-medium text-rose-600 active:bg-rose-50"
        >
          삭제
        </button>
      </div>
    </article>
  );
}

export function notifyCalendarUpdated() {
  window.dispatchEvent(new Event("calltaxi-calendar-updated"));
}
