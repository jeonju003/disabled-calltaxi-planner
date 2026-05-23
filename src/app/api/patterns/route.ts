import { NextRequest, NextResponse } from "next/server";
import { buildPatternAnalysis } from "@/lib/pattern-data";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const days = Math.min(
    21,
    Math.max(3, Number(req.nextUrl.searchParams.get("days") ?? 7)),
  );

  try {
    const analysis = await buildPatternAnalysis(days);
    return NextResponse.json(analysis, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "분석 실패";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
