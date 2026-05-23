import type {
  CallTaxiTrip,
  HourSlotStats,
  PatternAnalysis,
  ScheduleAdvice,
} from "./types";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function dayLabel(dayOfWeek: number) {
  return DAY_LABELS[dayOfWeek] ?? "?";
}

function slotKey(dayOfWeek: number, hour: number) {
  return `${dayOfWeek}-${hour}`;
}

function percentile(values: number[], p: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.floor((sorted.length - 1) * p),
  );
  return sorted[idx];
}

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function levelFromScore(score: number): HourSlotStats["level"] {
  if (score >= 0.65) return "easy";
  if (score >= 0.35) return "moderate";
  return "busy";
}

export function analyzeTrips(
  trips: CallTaxiTrip[],
  meta: Pick<PatternAnalysis, "analyzedDays" | "dataSource" | "dateRange">,
): PatternAnalysis {
  const buckets = new Map<string, number[]>();
  const counts = new Map<string, number>();

  for (const trip of trips) {
    const anchor = trip.scheduledAt ?? trip.dispatchAt ?? trip.boardingAt;
    if (!anchor || trip.waitMinutes == null) continue;
    const key = slotKey(anchor.getDay(), anchor.getHours());
    const list = buckets.get(key) ?? [];
    list.push(trip.waitMinutes);
    buckets.set(key, list);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const allWaits = trips
    .map((t) => t.waitMinutes)
    .filter((w): w is number => w != null);
  const globalP90 = percentile(allWaits, 0.9) || 30;
  const maxCount = Math.max(1, ...counts.values());

  const slots: HourSlotStats[] = [];

  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
    for (let hour = 0; hour < 24; hour += 1) {
      const key = slotKey(dayOfWeek, hour);
      const waits = buckets.get(key) ?? [];
      const sampleCount = waits.length;
      const avgWaitMinutes =
        sampleCount > 0
          ? waits.reduce((a, b) => a + b, 0) / sampleCount
          : globalP90;
      const medianWaitMinutes = sampleCount > 0 ? median(waits) : avgWaitMinutes;

      const waitNorm = 1 - Math.min(1, avgWaitMinutes / globalP90);
      const volumeNorm = 1 - (counts.get(key) ?? 0) / maxCount;
      const easeScore =
        sampleCount >= 5
          ? waitNorm * 0.75 + volumeNorm * 0.25
          : waitNorm * 0.5 + volumeNorm * 0.5;

      slots.push({
        dayOfWeek,
        hour,
        sampleCount,
        avgWaitMinutes: Math.round(avgWaitMinutes),
        medianWaitMinutes: Math.round(medianWaitMinutes),
        easeScore,
        level: levelFromScore(easeScore),
      });
    }
  }

  const bestSlots = [...slots]
    .filter((s) => s.sampleCount >= 3)
    .sort((a, b) => b.easeScore - a.easeScore)
    .slice(0, 8);

  return {
    slots,
    bestSlots,
    analyzedDays: meta.analyzedDays,
    totalTrips: trips.length,
    dataSource: meta.dataSource,
    dateRange: meta.dateRange,
  };
}

export function getSlot(
  analysis: PatternAnalysis,
  dayOfWeek: number,
  hour: number,
) {
  return analysis.slots.find(
    (s) => s.dayOfWeek === dayOfWeek && s.hour === hour,
  );
}

export function buildScheduleAdvice(
  analysis: PatternAnalysis,
  appointmentIso: string,
  travelMinutes = 40,
  bufferMinutes = 15,
): ScheduleAdvice {
  const appointment = new Date(appointmentIso);
  const suggestedCall = new Date(appointment);
  suggestedCall.setMinutes(
    suggestedCall.getMinutes() - travelMinutes - bufferMinutes,
  );

  const slot = getSlot(
    analysis,
    appointment.getDay(),
    appointment.getHours(),
  );
  const level = slot?.level ?? "moderate";
  const avgWait = slot?.avgWaitMinutes ?? 20;

  const levelText = {
    easy: "비교적 여유로운",
    moderate: "보통 수준의",
    busy: "혼잡할 수 있는",
  }[level];

  const message = `${dayLabel(appointment.getDay())}요일 ${appointment.getHours()}시대는 ${levelText} 시간대입니다(과거 평균 대기 약 ${avgWait}분). 약속 ${travelMinutes + bufferMinutes}분 전쯤 콜 접수를 권장합니다.`;

  const alternatives: ScheduleAdvice["alternatives"] = [];
  for (let offset = -2; offset <= 2; offset += 1) {
    if (offset === 0) continue;
    const alt = new Date(appointment);
    alt.setHours(alt.getHours() + offset);
    const altSlot = getSlot(analysis, alt.getDay(), alt.getHours());
    if (!altSlot) continue;
    alternatives.push({
      time: alt.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      level: altSlot.level,
      avgWaitMinutes: altSlot.avgWaitMinutes,
    });
  }

  alternatives.sort((a, b) => {
    const order = { easy: 0, moderate: 1, busy: 2 };
    return order[a.level] - order[b.level];
  });

  return {
    appointmentAt: appointment.toISOString(),
    suggestedCallAt: suggestedCall.toISOString(),
    slotLevel: level,
    avgWaitMinutes: avgWait,
    message,
    alternatives: alternatives.slice(0, 3),
  };
}

/** API 키 없을 때 UI 체험용 데모 데이터 */
export function generateDemoTrips(days = 14): CallTaxiTrip[] {
  const trips: CallTaxiTrip[] = [];
  const now = new Date();

  for (let d = 0; d < days; d += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - d - 1);
    const dow = day.getDay();

    for (let h = 6; h < 22; h += 1) {
      const volume =
        (h >= 8 && h <= 9) || (h >= 17 && h <= 19)
          ? 28
          : h >= 11 && h <= 14
            ? 10
            : 16;
      const baseWait =
        (h >= 8 && h <= 9) || (h >= 17 && h <= 19)
          ? 35
          : h >= 11 && h <= 14
            ? 12
            : 22;
      const weekendBonus = dow === 0 || dow === 6 ? 5 : 0;

      for (let i = 0; i < volume; i += 1) {
        const scheduled = new Date(day);
        scheduled.setHours(h, Math.floor(Math.random() * 60), 0, 0);
        const wait = baseWait + weekendBonus + Math.floor(Math.random() * 10);
        const dispatch = new Date(scheduled);
        dispatch.setMinutes(dispatch.getMinutes() + Math.floor(wait * 0.4));
        const boarding = new Date(dispatch);
        boarding.setMinutes(boarding.getMinutes() + Math.floor(wait * 0.6));

        trips.push({
          vehicleNo: `DEMO-${d}-${h}-${i}`,
          vehicleType: "특장차",
          scheduledAt: scheduled,
          dispatchAt: dispatch,
          boardingAt: boarding,
          startGu: "강남구",
          startDetail: "데모",
          endGu: "서초구",
          endDetail: "데모",
          waitMinutes: wait,
        });
      }
    }
  }

  return trips;
}
