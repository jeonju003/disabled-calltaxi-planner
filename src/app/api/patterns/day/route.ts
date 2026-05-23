import { NextRequest, NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/pattern-data";
import { daysAgo, fetchSampleTripsForDate, formatYmd } from "@/lib/seoul-api";

export const runtime = "edge";
export const preferredRegion = ["icn1", "hnd1", "sin1"];

export async function GET(req: NextRequest) {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "API 키가 설정되지 않았습니다." },
      { status: 400 },
    );
  }

  const offset = Math.min(
    21,
    Math.max(1, Number(req.nextUrl.searchParams.get("offset") ?? 1)),
  );

  try {
    const ymd = formatYmd(daysAgo(offset));
    const trips = await fetchSampleTripsForDate(apiKey, ymd, 200);
    return NextResponse.json(
      { trips, date: ymd, offset },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "일별 조회 실패";
    return NextResponse.json({ error: message, offset }, { status: 502 });
  }
}
