import type { CallTaxiTrip } from "./types";

const BASE = "http://openapi.seoul.go.kr:8088";

function pickField(row: Record<string, string>, candidates: string[]) {
  for (const key of candidates) {
    const v = row[key];
    if (v?.trim()) return v.trim();
  }
  return "";
}

/** 서울 API 한글 시각 (예: 2026-05-21 오전 12:21:51) */
export function parseDateTime(raw: string): Date | null {
  if (!raw) return null;
  const trimmed = raw.replace(/\./g, "-").trim();

  const korean = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})$/,
  );
  if (korean) {
    const [, datePart, ampm, h, m, s] = korean;
    let hour = Number(h);
    if (ampm === "오후" && hour < 12) hour += 12;
    if (ampm === "오전" && hour === 12) hour = 0;
    const iso = `${datePart}T${String(hour).padStart(2, "0")}:${m}:${s}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const normalized = trimmed.replace(/\s+/g, " ");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffMinutes(a: Date | null, b: Date | null) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

function parseTagBlock(block: string): Record<string, string> {
  const row: Record<string, string> = {};
  const tags = block.matchAll(/<([^>/\s]+)>([^<]*)<\/\1>/gi);
  for (const [, tag, value] of tags) {
    const key = tag.toLowerCase();
    if (key !== "row" && key !== "item" && key !== "list") {
      row[key] = value.trim();
    }
  }
  return row;
}

export function parseXmlRows(xml: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const seen = new Set<string>();

  const patterns = [
    /<item>([\s\S]*?)<\/item>/gi,
    /<row>([\s\S]*?)<\/row>/gi,
  ];

  for (const pattern of patterns) {
    const blocks = xml.match(pattern) ?? [];
    for (const block of blocks) {
      const row = parseTagBlock(block);
      if (Object.keys(row).length === 0) continue;
      const key = JSON.stringify(row);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }

  return rows;
}

function parseResultMeta(xml: string) {
  const totalMatch = xml.match(/<list_total_count>(\d+)<\/list_total_count>/i);
  const codeMatch =
    xml.match(/<RESULT>[\s\S]*?<CODE>([^<]*)<\/CODE>/i) ??
    xml.match(/<CODE>([^<]*)<\/CODE>/i);
  const msgMatch =
    xml.match(/<RESULT>[\s\S]*?<MESSAGE>([^<]*)<\/MESSAGE>/i) ??
    xml.match(/<MESSAGE>([^<]*)<\/MESSAGE>/i);
  return {
    totalCount: totalMatch ? Number(totalMatch[1]) : 0,
    resultCode: codeMatch?.[1]?.trim() ?? "UNKNOWN",
    resultMessage: msgMatch?.[1]?.trim() ?? "",
  };
}

export function rowToTrip(row: Record<string, string>): CallTaxiTrip {
  const receiptAt = parseDateTime(
    pickField(row, ["receipttime", "RSVT_DTTM", "BOOK_DTTM", "예정일시"]),
  );
  const setAt = parseDateTime(
    pickField(row, [
      "settime",
      "DISPATCH_DTTM",
      "ALLOC_DTTM",
      "DISPATCH_TIME",
      "배차일시",
    ]),
  );
  const rideAt = parseDateTime(
    pickField(row, ["ridetime", "RIDE_DTTM", "BOARD_TIME", "승차일시"]),
  );

  const scheduledAt = receiptAt ?? setAt;
  const dispatchAt = setAt ?? receiptAt;
  const boardingAt = rideAt;

  const waitMinutes =
    diffMinutes(dispatchAt, boardingAt) ??
    diffMinutes(scheduledAt, boardingAt);

  return {
    vehicleNo: pickField(row, ["no", "VHCL_NUM", "CAR_NUM", "차량고유번호"]),
    vehicleType: pickField(row, ["cartype", "VHCL_TYPE", "CAR_TYPE", "차량타입"]),
    scheduledAt,
    dispatchAt,
    boardingAt,
    startGu: pickField(row, ["startpos1", "START_GU", "출발지구군"]),
    startDetail: pickField(row, ["startpos2", "START_DETAIL", "출발지상세"]),
    endGu: pickField(row, ["endpos1", "END_GU", "목적지구군"]),
    endDetail: pickField(row, ["endpos2", "END_DETAIL", "목적지상세"]),
    waitMinutes,
  };
}

export type FetchPageResult = {
  trips: CallTaxiTrip[];
  totalCount: number;
  resultCode: string;
  resultMessage: string;
};

const FETCH_TIMEOUT_MS = 15_000;

async function fetchSeoulApi(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCallTaxiPage(
  apiKey: string,
  dateYmd: string,
  start: number,
  end: number,
  format: "json" | "xml" = "xml",
): Promise<FetchPageResult> {
  const url = `${BASE}/${apiKey}/${format}/disabledCalltaxi/${start}/${end}/${dateYmd}`;
  let res: Response;
  try {
    res = await fetchSeoulApi(url);
  } catch {
    throw new Error(`서울 API 요청 시간 초과 (${dateYmd})`);
  }
  const text = await res.text();

  if (format === "xml" || text.trimStart().startsWith("<")) {
    const meta = parseResultMeta(text);
    const rows = parseXmlRows(text);
    return {
      trips: rows.map(rowToTrip),
      totalCount: meta.totalCount || rows.length,
      resultCode: meta.resultCode,
      resultMessage: meta.resultMessage,
    };
  }

  let data: {
    RESULT?: { CODE?: string; MESSAGE?: string };
    disabledCalltaxi?: {
      list_total_count?: number | string;
      RESULT?: { CODE?: string; MESSAGE?: string };
      row?: Record<string, string> | Record<string, string>[];
    };
  };

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("서울 API 응답을 JSON/XML로 해석하지 못했습니다.");
  }

  if (data.RESULT?.CODE?.startsWith("ERROR")) {
    throw new Error(`${data.RESULT.CODE}: ${data.RESULT.MESSAGE ?? ""}`);
  }

  const block = data.disabledCalltaxi;
  const rawRows = block?.row;
  const rows = rawRows
    ? Array.isArray(rawRows)
      ? rawRows
      : [rawRows]
    : [];

  return {
    trips: rows.map(rowToTrip),
    totalCount: Number(block?.list_total_count ?? rows.length),
    resultCode: block?.RESULT?.CODE ?? data.RESULT?.CODE ?? "UNKNOWN",
    resultMessage: block?.RESULT?.MESSAGE ?? data.RESULT?.MESSAGE ?? "",
  };
}

/** 패턴 분석용: 하루 1회 호출로 충분한 표본만 수집 */
export async function fetchSampleTripsForDate(
  apiKey: string,
  dateYmd: string,
  sampleSize = 500,
): Promise<CallTaxiTrip[]> {
  const end = Math.min(Math.max(sampleSize, 100), 1000);
  const page = await fetchCallTaxiPage(apiKey, dateYmd, 1, end, "xml");
  if (page.resultCode !== "INFO-000" && page.trips.length === 0) {
    throw new Error(`${page.resultCode}: ${page.resultMessage}`);
  }
  return page.trips;
}

export async function fetchAllTripsForDate(
  apiKey: string,
  dateYmd: string,
  maxRows = 3000,
): Promise<CallTaxiTrip[]> {
  const pageSize = 1000;
  const all: CallTaxiTrip[] = [];
  let start = 1;

  while (all.length < maxRows) {
    const end = Math.min(start + pageSize - 1, maxRows);
    const page = await fetchCallTaxiPage(apiKey, dateYmd, start, end, "xml");
    if (page.resultCode && page.resultCode !== "INFO-000" && all.length === 0) {
      throw new Error(`${page.resultCode}: ${page.resultMessage}`);
    }
    all.push(...page.trips);
    if (page.trips.length < pageSize || all.length >= page.totalCount) break;
    start += pageSize;
  }

  return all;
}

export function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function ymdToIso(ymd: string) {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

export function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
