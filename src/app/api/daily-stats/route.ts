import { NextRequest, NextResponse } from "next/server";
import {
  daysAgoIso,
  fetchDailyStats,
  formatIsoDate,
} from "@/lib/sisul-daily-api";

export async function GET(req: NextRequest) {
  const days = Math.min(
    60,
    Math.max(7, Number(req.nextUrl.searchParams.get("days") ?? 14)),
  );

  const eDate =
    req.nextUrl.searchParams.get("eDate") ?? daysAgoIso(1);
  const sDate =
    req.nextUrl.searchParams.get("sDate") ?? daysAgoIso(days);

  try {
    const { stats, dataSource, notice } = await fetchDailyStats(sDate, eDate);
    const avgWait =
      stats.length > 0
        ? Math.round(
            stats.reduce((s, d) => s + d.avgWaitMinutes, 0) / stats.length,
          )
        : 0;
    const easiest = [...stats].sort(
      (a, b) => a.avgWaitMinutes - b.avgWaitMinutes,
    )[0];
    const busiest = [...stats].sort(
      (a, b) => b.avgWaitMinutes - a.avgWaitMinutes,
    )[0];

    return NextResponse.json({
      stats,
      dataSource,
      notice,
      dateRange: { from: sDate, to: eDate },
      summary: {
        avgWaitMinutes: avgWait,
        easiestDay: easiest?.date,
        easiestWait: easiest?.avgWaitMinutes,
        busiestDay: busiest?.date,
        busiestWait: busiest?.avgWaitMinutes,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "일별 통계 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
