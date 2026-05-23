import { NextRequest, NextResponse } from "next/server";
import { analyzeTrips, buildScheduleAdvice, generateDemoTrips } from "@/lib/analyze";
import { daysAgo, fetchAllTripsForDate, formatYmd } from "@/lib/seoul-api";

async function loadAnalysis(days: number) {
  const rawKey = process.env.SEOUL_OPEN_API_KEY?.trim() ?? "";
  const apiKey =
    rawKey && !/^your_/i.test(rawKey) && rawKey !== "발급키" ? rawKey : "";
  if (!apiKey) {
    return analyzeTrips(generateDemoTrips(days), {
      analyzedDays: days,
      dataSource: "demo",
      dateRange: { from: formatYmd(daysAgo(days)), to: formatYmd(daysAgo(1)) },
    });
  }

  const allTrips = [];
  for (let i = 1; i <= days; i += 1) {
    const ymd = formatYmd(daysAgo(i));
    try {
      allTrips.push(...(await fetchAllTripsForDate(apiKey, ymd, 2000)));
    } catch {
      /* skip */
    }
  }

  if (allTrips.length === 0) {
    return analyzeTrips(generateDemoTrips(days), {
      analyzedDays: days,
      dataSource: "demo",
      dateRange: { from: formatYmd(daysAgo(days)), to: formatYmd(daysAgo(1)) },
    });
  }

  return analyzeTrips(allTrips, {
    analyzedDays: days,
    dataSource: "api",
    dateRange: { from: formatYmd(daysAgo(days)), to: formatYmd(daysAgo(1)) },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      appointmentAt?: string;
      travelMinutes?: number;
      bufferMinutes?: number;
      analysisDays?: number;
    };

    if (!body.appointmentAt) {
      return NextResponse.json(
        { error: "appointmentAt이 필요합니다." },
        { status: 400 },
      );
    }

    const days = Math.min(30, Math.max(7, body.analysisDays ?? 14));
    const analysis = await loadAnalysis(days);
    const advice = buildScheduleAdvice(
      analysis,
      body.appointmentAt,
      body.travelMinutes ?? 40,
      body.bufferMinutes ?? 15,
    );

    return NextResponse.json({ advice, dataSource: analysis.dataSource });
  } catch (e) {
    const message = e instanceof Error ? e.message : "일정 분석 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
