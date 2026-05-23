import type { SavedAppointment, ScheduleAdvice } from "./types";

const STORAGE_KEY = "calltaxi-planner-calendar-v1";

function readAll(): SavedAppointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAppointment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: SavedAppointment[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listAppointments(): SavedAppointment[] {
  return readAll().sort(
    (a, b) =>
      new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime(),
  );
}

export function saveAppointment(
  input: Omit<SavedAppointment, "id" | "createdAt">,
): SavedAppointment {
  const item: SavedAppointment = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  const all = readAll();
  all.push(item);
  writeAll(all);
  return item;
}

export function saveFromAdvice(
  title: string,
  memo: string | undefined,
  advice: ScheduleAdvice,
  travelMinutes: number,
  bufferMinutes: number,
) {
  return saveAppointment({
    title,
    memo,
    appointmentAt: advice.appointmentAt,
    suggestedCallAt: advice.suggestedCallAt,
    travelMinutes,
    bufferMinutes,
    slotLevel: advice.slotLevel,
    avgWaitMinutes: advice.avgWaitMinutes,
  });
}

export function removeAppointment(id: string) {
  writeAll(readAll().filter((a) => a.id !== id));
}

export function upcomingAppointments(withinDays = 60) {
  const now = Date.now();
  const limit = now + withinDays * 86400000;
  return listAppointments().filter((a) => {
    const t = new Date(a.appointmentAt).getTime();
    return t >= now - 86400000 && t <= limit;
  });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsUtc(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function downloadIcs(appointment: SavedAppointment) {
  const uid = appointment.id;
  const callStart = appointment.suggestedCallAt;
  const callEnd = new Date(
    new Date(callStart).getTime() + 30 * 60000,
  ).toISOString();
  const apptEnd = new Date(
    new Date(appointment.appointmentAt).getTime() + 60 * 60000,
  ).toISOString();

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CallTaxi Planner//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}-call@calltaxi-planner`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(callStart)}`,
    `DTEND:${toIcsUtc(callEnd)}`,
    `SUMMARY:[콜접수] ${appointment.title}`,
    `DESCRIPTION:장애인 콜택시 접수 권장 시각\\n${appointment.memo ?? ""}`,
    "END:VEVENT",
    "BEGIN:VEVENT",
    `UID:${uid}-appt@calltaxi-planner`,
    `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
    `DTSTART:${toIcsUtc(appointment.appointmentAt)}`,
    `DTEND:${toIcsUtc(apptEnd)}`,
    `SUMMARY:${appointment.title}`,
    `DESCRIPTION:약속\\n콜 권장: ${new Date(appointment.suggestedCallAt).toLocaleString("ko-KR")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `calltaxi-${appointment.id.slice(0, 8)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
