import type { PatternAnalysis } from "./types";
import { analyzeTrips, generateDemoTrips } from "./analyze";
import {
  daysAgo,
  fetchSampleTripsForDate,
  formatYmd,
  ymdToIso,
} from "./seoul-api";

export function resolveApiKey() {
  const rawKey = process.env.SEOUL_OPEN_API_KEY?.trim() ?? "";
  return rawKey && !/^your_/i.test(rawKey) && rawKey !== "발급키"
    ? rawKey
    : "";
}

/** 실제 API: 날짜별 1회 호출·병렬 조회 (패턴 분석용 샘플) */
export async function fetchTripsForPatternAnalysis(
  apiKey: string,
  days: number,
) {
  const samplePerDay = 300;
  const results = await Promise.all(
    Array.from({ length: days }, (_, i) => {
      const ymd = formatYmd(daysAgo(i + 1));
      return fetchSampleTripsForDate(apiKey, ymd, samplePerDay).catch(() => []);
    }),
  );
  return results.flat();
}

export async function buildPatternAnalysis(
  days: number,
): Promise<PatternAnalysis & { notice?: string }> {
  const apiKey = resolveApiKey();
  const effectiveDays =
    apiKey && process.env.VERCEL ? Math.min(days, 5) : days;
  const from = daysAgo(effectiveDays);
  const to = daysAgo(1);
  const dateRange = { from: formatYmd(from), to: formatYmd(to) };

  if (!apiKey) {
    const trips = generateDemoTrips(effectiveDays);
    return {
      ...analyzeTrips(trips, {
        analyzedDays: effectiveDays,
        dataSource: "demo",
        dateRange,
      }),
      notice:
        "데모 데이터입니다. .env.local에 SEOUL_OPEN_API_KEY를 넣으면 실제 서울시 API를 사용합니다.",
    };
  }

  const allTrips = await fetchTripsForPatternAnalysis(apiKey, effectiveDays);

  if (allTrips.length === 0) {
    throw new Error(
      "조회된 이용 데이터가 없습니다. API 키·트래픽·요청일(최소 하루 전)을 확인하세요.",
    );
  }

  const analysis = analyzeTrips(allTrips, {
    analyzedDays: effectiveDays,
    dataSource: "api",
    dateRange,
  });

  const notices: string[] = [];
  if (effectiveDays < days) {
    notices.push(
      `배포 환경 제한으로 최근 ${effectiveDays}일 데이터만 분석했습니다.`,
    );
  }
  if (days > 7) {
    notices.push("날짜별 약 300~350건을 샘플링해 분석합니다.");
  }

  return {
    ...analysis,
    dateRange: {
      from: ymdToIso(analysis.dateRange.from),
      to: ymdToIso(analysis.dateRange.to),
    },
    notice: notices.length > 0 ? notices.join(" ") : undefined,
  };
}
