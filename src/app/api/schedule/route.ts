import { NextRequest, NextResponse } from "next/server";
import { buildScheduleAdvice } from "@/lib/analyze";
import { buildPatternAnalysis } from "@/lib/pattern-data";

export const maxDuration = 60;

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

    const days = Math.min(14, Math.max(3, body.analysisDays ?? 7));
    const analysis = await buildPatternAnalysis(days);
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
