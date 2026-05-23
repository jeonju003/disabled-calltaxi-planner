import type { CallTaxiTrip } from "./types";

const BASE = "http://openapi.seoul.go.kr:8088";

const TIME_KEYS = [
  "RSVT_DTTM",
  "BOOK_DTTM",
  "SCHEDULED_TIME",
  "예정일시",
  "DISPATCH_DTTM",
  "ALLOC_DTTM",
  "DISPATCH_TIME",
  "배차일시",
  "RIDE_DTTM",
  "BOARD_TIME",
  "승차일시",
];

function pickField(row: Record<string, string>, candidates: string[]) {
  for (const key of candidates) {
    const v = row[key];
    if (v?.trim()) return v.trim();
  }
  return "";
}

function parseDateTime(raw: string): Date | null {
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "-").replace(/\s+/g, " ").trim();
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diffMinutes(a: Date | null, b: Date | null) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

export function parseXmlRows(xml: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const rowBlocks = xml.match(/<row>([\s\S]*?)<\/row>/gi) ?? [];
  for (const block of rowBlocks) {
    const row: Record<string, string> = {};
    const tags = block.matchAll(/<([^>/\s]+)>([^<]*)<\/\1>/g);
    for (const [, tag, value] of tags) {
      if (tag !== "row") row[tag] = value.trim();
    }
    if (Object.keys(row).length > 0) rows.push(row);
  }
  return rows;
}

export function rowToTrip(row: Record<string, string>): CallTaxiTrip {
  const scheduledAt = parseDateTime(
    pickField(row, ["RSVT_DTTM", "BOOK_DTTM", "SCHEDULED_TIME", "예정일시"]),
  );
  const dispatchAt = parseDateTime(
    pickField(row, ["DISPATCH_DTTM", "ALLOC_DTTM", "DISPATCH_TIME", "배차일시"]),
  );
  const boardingAt = parseDateTime(
    pickField(row, ["RIDE_DTTM", "BOARD_TIME", "승차일시"]),
  );

  const waitMinutes =
    diffMinutes(dispatchAt, boardingAt) ??
    diffMinutes(scheduledAt, dispatchAt);

  return {
    vehicleNo: pickField(row, ["VHCL_NUM", "CAR_NUM", "차량고유번호"]),
    vehicleType: pickField(row, ["VHCL_TYPE", "CAR_TYPE", "차량타입"]),
    scheduledAt,
    dispatchAt,
    boardingAt,
    startGu: pickField(row, ["START_GU", "출발지구군"]),
    startDetail: pickField(row, ["START_DETAIL", "출발지상세"]),
    endGu: pickField(row, ["END_GU", "목적지구군"]),
    endDetail: pickField(row, ["END_DETAIL", "목적지상세"]),
    waitMinutes,
  };
}

export type FetchPageResult = {
  trips: CallTaxiTrip[];
  totalCount: number;
  resultCode: string;
  resultMessage: string;
};

export async function fetchCallTaxiPage(
  apiKey: string,
  dateYmd: string,
  start: number,
  end: number,
  format: "json" | "xml" = "json",
): Promise<FetchPageResult> {
  const url = `${BASE}/${apiKey}/${format}/disabledCalltaxi/${start}/${end}/${dateYmd}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const text = await res.text();

  if (format === "xml" || text.trimStart().startsWith("<")) {
    const rows = parseXmlRows(text);
    const totalMatch = text.match(/<list_total_count>(\d+)<\/list_total_count>/i);
    const codeMatch = text.match(/<RESULT\.CODE>([^<]*)<\/RESULT\.CODE>/i);
    const msgMatch = text.match(/<RESULT\.MESSAGE>([^<]*)<\/RESULT\.MESSAGE>/i);
    return {
      trips: rows.map(rowToTrip),
      totalCount: totalMatch ? Number(totalMatch[1]) : rows.length,
      resultCode: codeMatch?.[1] ?? "UNKNOWN",
      resultMessage: msgMatch?.[1] ?? "",
    };
  }

  const data = JSON.parse(text) as {
    disabledCalltaxi?: {
      list_total_count?: number | string;
      RESULT?: { CODE?: string; MESSAGE?: string };
      row?: Record<string, string> | Record<string, string>[];
    };
  };

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
    resultCode: block?.RESULT?.CODE ?? "UNKNOWN",
    resultMessage: block?.RESULT?.MESSAGE ?? "",
  };
}

export async function fetchAllTripsForDate(
  apiKey: string,
  dateYmd: string,
  maxRows = 5000,
): Promise<CallTaxiTrip[]> {
  const pageSize = 1000;
  const all: CallTaxiTrip[] = [];
  let start = 1;

  while (all.length < maxRows) {
    const end = Math.min(start + pageSize - 1, maxRows);
    const page = await fetchCallTaxiPage(apiKey, dateYmd, start, end, "json");
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
