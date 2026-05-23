import type { DailyUsageStat } from "./types";

function pickNum(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const v = row[key];
    if (v == null || v === "") continue;
    const n = Number(String(v).replace(/,/g, ""));
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function pickDate(row: Record<string, unknown>) {
  for (const key of [
    "usedate",
    "useDate",
    "USE_DATE",
    "운행일자",
    "operDate",
    "date",
    "stdrDe",
  ]) {
    const v = row[key];
    if (!v) continue;
    const s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{8}$/.test(s)) {
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    }
  }
  return "";
}

export function rowToDailyStat(row: Record<string, unknown>): DailyUsageStat | null {
  const date = pickDate(row);
  if (!date) return null;
  return {
    date,
    vehicleCount: pickNum(row, [
      "vhclCnt",
      "vehicleCount",
      "차량운행",
      "carCnt",
      "VHCL_CNT",
    ]),
    receivedCalls: pickNum(row, [
      "recvCnt",
      "receivedCalls",
      "접수건",
      "callCnt",
      "RECV_CNT",
    ]),
    boardedCalls: pickNum(row, [
      "rideCnt",
      "boardedCalls",
      "탑승건",
      "BOARD_CNT",
    ]),
    avgWaitMinutes: pickNum(row, [
      "avgWait",
      "avgWaitTime",
      "평균대기시간",
      "waitTime",
      "AVG_WAIT",
    ]),
    avgFare: pickNum(row, [
      "avgFare",
      "평균요금",
      "fare",
      "AVG_FARE",
    ]),
    avgDistanceKm: pickNum(row, [
      "avgDist",
      "avgDistance",
      "평균승차거리",
      "distance",
      "AVG_DIST",
    ]),
  };
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;

  if (Array.isArray(payload)) {
    return payload.filter((r) => r && typeof r === "object") as Record<
      string,
      unknown
    >[];
  }

  const candidates = [
    obj.data,
    obj.list,
    obj.rows,
    obj.items,
    obj.result,
    obj.body,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c.filter((r) => r && typeof r === "object") as Record<
        string,
        unknown
      >[];
    }
    if (c && typeof c === "object") {
      const nested = c as Record<string, unknown>;
      for (const key of ["list", "rows", "items", "data"]) {
        if (Array.isArray(nested[key])) {
          return nested[key] as Record<string, unknown>[];
        }
      }
      if (nested.row) {
        const row = nested.row;
        return Array.isArray(row)
          ? (row as Record<string, unknown>[])
          : [row as Record<string, unknown>];
      }
    }
  }

  if (obj.row) {
    return Array.isArray(obj.row)
      ? (obj.row as Record<string, unknown>[])
      : [obj.row as Record<string, unknown>];
  }

  return [];
}

export function parseDailyStatsPayload(payload: unknown): DailyUsageStat[] {
  const rows = extractRows(payload);
  const stats: DailyUsageStat[] = [];
  for (const row of rows) {
    const stat = rowToDailyStat(row);
    if (stat) stats.push(stat);
  }
  return stats.sort((a, b) => a.date.localeCompare(b.date));
}

export function formatIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatIsoDate(d);
}

export function buildSisulDailyUrl(
  baseUrl: string,
  key: string,
  sDate: string,
  eDate: string,
) {
  const trimmed = baseUrl.trim();
  if (trimmed.includes("{key}")) {
    return trimmed
      .replace(/\{key\}/g, encodeURIComponent(key))
      .replace(/\{sDate\}/g, encodeURIComponent(sDate))
      .replace(/\{eDate\}/g, encodeURIComponent(eDate));
  }
  const sep = trimmed.includes("?") ? "&" : "?";
  return `${trimmed}${sep}key=${encodeURIComponent(key)}&sDate=${encodeURIComponent(sDate)}&eDate=${encodeURIComponent(eDate)}`;
}

export async function fetchDailyStats(
  sDate: string,
  eDate: string,
): Promise<{ stats: DailyUsageStat[]; dataSource: "api" | "demo"; notice?: string }> {
  const baseUrl = process.env.SISUL_DAILY_API_URL?.trim() ?? "";
  const rawKey = process.env.SISUL_DAILY_API_KEY?.trim() ?? "";
  const apiKey =
    rawKey && !/^your_/i.test(rawKey) ? rawKey : "";

  if (!baseUrl || !apiKey) {
    return {
      stats: generateDemoDailyStats(sDate, eDate),
      dataSource: "demo",
      notice:
        "데모 일별 통계입니다. 메일로 받은 URL·키를 .env.local의 SISUL_DAILY_API_URL, SISUL_DAILY_API_KEY에 설정하세요.",
    };
  }

  const url = buildSisulDailyUrl(baseUrl, apiKey, sDate, eDate);
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const text = await res.text();

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    const rows = text.match(/<row>([\s\S]*?)<\/row>/gi) ?? [];
    const parsed: Record<string, string>[] = [];
    for (const block of rows) {
      const row: Record<string, string> = {};
      const tags = block.matchAll(/<([^>/\s]+)>([^<]*)<\/\1>/g);
      for (const [, tag, value] of tags) {
        if (tag !== "row") row[tag] = value.trim();
      }
      if (Object.keys(row).length) parsed.push(row);
    }
    payload = parsed;
  }

  const stats = parseDailyStatsPayload(payload);
  if (stats.length === 0) {
    throw new Error(
      "일별 이용현황 응답을 해석하지 못했습니다. URL 형식·필드명을 확인하세요.",
    );
  }

  return { stats, dataSource: "api" };
}

export function generateDemoDailyStats(sDate: string, eDate: string): DailyUsageStat[] {
  const stats: DailyUsageStat[] = [];
  const start = new Date(sDate);
  const end = new Date(eDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const baseWait = isWeekend ? 28 : 22;
    const received = 2800 + Math.floor(Math.random() * 400);
    stats.push({
      date: formatIsoDate(d),
      vehicleCount: 420 + Math.floor(Math.random() * 30),
      receivedCalls: received,
      boardedCalls: Math.floor(received * 0.92),
      avgWaitMinutes: baseWait + Math.floor(Math.random() * 8),
      avgFare: 12500 + Math.floor(Math.random() * 2000),
      avgDistanceKm: Number((8 + Math.random() * 4).toFixed(1)),
    });
  }
  return stats;
}
