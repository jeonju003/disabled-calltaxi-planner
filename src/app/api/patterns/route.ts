import { NextRequest, NextResponse } from "next/server";
import { analyzeTrips, generateDemoTrips } from "@/lib/analyze";
import {
  daysAgo,
  fetchAllTripsForDate,
  formatYmd,
  ymdToIso,
} from "@/lib/seoul-api";

export async function GET(req: NextRequest) {
  const days = Math.min(
    30,
    Math.max(3, Number(req.nextUrl.searchParams.get("days") ?? 14)),
  );
  const rawKey = process.env.SEOUL_OPEN_API_KEY?.trim() ?? "";
  const apiKey =
    rawKey && !/^your_/i.test(rawKey) && rawKey !== "발급키" ? rawKey : "";

  try {
    if (!apiKey) {
      const trips = generateDemoTrips(days);
      const to = daysAgo(1);
      const from = daysAgo(days);
      const analysis = analyzeTrips(trips, {
        analyzedDays: days,
        dataSource: "demo",
        dateRange: {
          from: formatYmd(from),
          to: formatYmd(to),
        },
      });
      return NextResponse.json({
        ...analysis,
        notice:
          "데모 데이터입니다. .env.local에 SEOUL_OPEN_API_KEY를 넣으면 실제 서울시 API를 사용합니다.",
      });
    }

    const allTrips = [];
    for (let i = 1; i <= days; i += 1) {
      const date = daysAgo(i);
      const ymd = formatYmd(date);
      try {
        const trips = await fetchAllTripsForDate(apiKey, ymd, 800);
        allTrips.push(...trips);
      } catch {
        // 일부 날짜 실패 시 계속 진행
      }
    }

    if (allTrips.length === 0) {
      return NextResponse.json(
        {
          error:
            "조회된 이용 데이터가 없습니다. API 키·트래픽·요청일(최소 하루 전)을 확인하세요.",
        },
        { status: 502 },
      );
    }

    const from = daysAgo(days);
    const to = daysAgo(1);
    const analysis = analyzeTrips(allTrips, {
      analyzedDays: days,
      dataSource: "api",
      dateRange: {
        from: formatYmd(from),
        to: formatYmd(to),
      },
    });

    return NextResponse.json({
      ...analysis,
      dateRange: {
        from: ymdToIso(analysis.dateRange.from),
        to: ymdToIso(analysis.dateRange.to),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "분석 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
