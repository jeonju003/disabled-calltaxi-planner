export type CallTaxiTrip = {
  vehicleNo: string;
  vehicleType: string;
  scheduledAt: Date | null;
  dispatchAt: Date | null;
  boardingAt: Date | null;
  startGu: string;
  startDetail: string;
  endGu: string;
  endDetail: string;
  waitMinutes: number | null;
};

export type HourSlotStats = {
  dayOfWeek: number;
  hour: number;
  sampleCount: number;
  avgWaitMinutes: number;
  medianWaitMinutes: number;
  easeScore: number;
  level: "easy" | "moderate" | "busy";
};

export type PatternAnalysis = {
  slots: HourSlotStats[];
  bestSlots: HourSlotStats[];
  analyzedDays: number;
  totalTrips: number;
  dataSource: "api" | "demo";
  dateRange: { from: string; to: string };
};

export type ScheduleAdvice = {
  appointmentAt: string;
  suggestedCallAt: string;
  slotLevel: HourSlotStats["level"];
  avgWaitMinutes: number;
  message: string;
  alternatives: { time: string; level: HourSlotStats["level"]; avgWaitMinutes: number }[];
};

export type DailyUsageStat = {
  date: string;
  vehicleCount: number;
  receivedCalls: number;
  boardedCalls: number;
  avgWaitMinutes: number;
  avgFare: number;
  avgDistanceKm: number;
};

export type DailyStatsResponse = {
  stats: DailyUsageStat[];
  dataSource: "api" | "demo";
  dateRange: { from: string; to: string };
  notice?: string;
};

export type SavedAppointment = {
  id: string;
  title: string;
  memo?: string;
  appointmentAt: string;
  suggestedCallAt: string;
  travelMinutes: number;
  bufferMinutes: number;
  slotLevel?: HourSlotStats["level"];
  avgWaitMinutes?: number;
  createdAt: string;
};

export type AppTab = "pattern" | "daily" | "plan" | "calendar";
