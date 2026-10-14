/**
 * Telephony Performance Analytics Data Types
 */

export type DayOfWeekType = 'sat_to_wed' | 'thursday' | 'friday';

export type PerformanceCategory = 
  | 'optimal'      // عملکرد مطلوب (91-100)
  | 'needs_attention' // نیازمند توجه (81-90)
  | 'substandard'  // عملکرد نامطلوب (61-80)
  | 'critical';    // بسیار ضعیف (below 60, or boundary based on config)

export interface CallRecord {
  id: string;
  source: string;              // مبدا تماس
  destination: string;         // مقصد تماس
  startTime: Date;             // تاریخ و زمان شروع
  endTime?: Date;              // تاریخ و زمان پایان
  callType: 'inbound' | 'outbound' | 'internal' | 'unknown'; // نوع تماس
  answerStatus: 'answered' | 'no_answer' | 'busy' | 'failed' | 'unknown'; // وضعیت پاسخ تماس
  callStatus: 'successful' | 'unsuccessful' | 'unknown'; // وضعیت تماس
  durationSeconds: number;     // طول مکالمه به ثانیه (طول تماس)
  queueWaitSeconds?: number;   // مدت انتظار در صف
  ringDurationSeconds?: number;// مدت زنگ خوردن
  route?: string;              // مسیر تماس
  routeName?: string;          // نام مسیر تماس
  agentId: string;             // کارشناس شناسایی‌شده
  agentName: string;           // نام کارشناس
  isEligible: boolean;         // تماس معتبر برای ارزیابی
  isSuccessful: boolean;       // مکالمه موفق پاسخ‌داده‌شده
  intervalSlot: string;        // '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', 'other'
  dateStr: string;             // YYYY-MM-DD or Jalali YYYY/MM/DD
  dayType: DayOfWeekType;
  rawStartTime?: string;       // مقدار خام تاریخ و زمان در فایل اکسل
  rawEndTime?: string;         // مقدار خام تاریخ و زمان پایان
  jalaliDateStr?: string;      // فرمت استاندارد جلالی مانند ۱۴۰۵/۰۷/۲۱
  rowNumber?: number;          // شماره سطر در اکسل جهت ردیابی
}

export interface IntradayIntervalData {
  interval: string;            // '09:00-11:00', etc.
  totalCalls: number;
  successfulCalls: number;
  durationSeconds: number;
  targetCalls: number;         // typically 20
  targetMet: boolean;
  isElapsed: boolean;
  isCurrent: boolean;
  isFuture: boolean;
}

export interface KPIScores {
  // KPI 1: Actual Conversation Duration (30 pts max)
  kpi1_durationMinutes: number;
  kpi1_targetMinutes: number;
  kpi1_score: number;          // 0 - 30

  // KPI 2: Successful Call Rate (20 pts max)
  kpi2_ratePercent: number;    // %
  kpi2_score: number;          // 0, 8, 11, 15, 20
  kpi2_hasSufficientData: boolean;

  // KPI 3: Total Call Volume (10 pts base)
  kpi3_totalCalls: number;
  kpi3_targetCalls: number;
  kpi3_score: number;          // 0 - 10 (or up to 15 if over-target enabled)
  kpi3_overTargetPoints: number;

  // KPI 4: Successful Call Count (15 pts max)
  kpi4_successfulCalls: number;
  kpi4_score: number;          // 0, 5, 8, 15

  // KPI 5: Approved Duration Rate (15 pts max) [2:00 to 3:30 mins]
  kpi5_approvedCallsCount: number;
  kpi5_exceedingCallsCount: number; // > 3:30 mins
  kpi5_approvedPercent: number;     // %
  kpi5_score: number;          // 0, 3, 5, 15

  // KPI 6: Performance Stability (10 pts max)
  kpi6_minCalls: number;
  kpi6_avgCalls: number;
  kpi6_stabilityPercent: number; // min / avg * 100
  kpi6_score: number;          // 0, 2, 3, 4, 6, 10
  kpi6_isProvisional: boolean;
  kpi6_hasSufficientData: boolean;

  // Total Score (0 - 100)
  totalScore: number;
  officialCappedScore: number; // strictly <= 100
  category: PerformanceCategory;
  isProvisionalDay: boolean;   // true if current day or incomplete intervals

  // Separate Bonus System (Independent of 100-pt KPI)
  dailyBonusPoints: number;    // Math.floor(Math.max(0, duration - target) / 3)
}

export interface AgentDailySummary {
  agentId: string;
  agentName: string;
  dateStr: string;
  dayType: DayOfWeekType;
  totalCalls: number;
  successfulCalls: number;
  unsuccessfulCalls: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  kpi: KPIScores;
  intervals: IntradayIntervalData[];
}

export interface AgentAggregateSummary {
  agentId: string;
  agentName: string;
  daysCount: number;
  totalCalls: number;
  successfulCalls: number;
  successRate: number;
  totalDurationSeconds: number;
  averageDurationPerSuccess: number;
  approvedDurationCount: number;
  approvedDurationPercent: number;
  exceedingDurationCount: number;
  averageDailyScore: number;
  lastDailyScore: number;
  category: PerformanceCategory;
  cumulativeBonusPoints: number;
  rewardProgressPercent: number; // out of bonusRewardThreshold (500)
  stabilityAverage: number;
  kpiBreakdown: {
    kpi1: number;
    kpi2: number;
    kpi3: number;
    kpi4: number;
    kpi5: number;
    kpi6: number;
  };
  dailySummaries: AgentDailySummary[];
}

export interface TeamAggregateMetrics {
  totalCalls: number;
  successfulCalls: number;
  successRate: number;
  totalDurationSeconds: number;
  averageDurationPerSuccess: number;
  approvedDurationCount: number;
  approvedDurationPercent: number;
  exceedingDurationCount: number;
  agentsMeetingDurationTargetCount: number;
  totalActiveAgents: number;
  averageTeamScore: number;
  totalCumulativeBonusPoints: number;
  activeDaysCount: number;
  // comparisons vs previous period if available
  previousPeriodComparison?: {
    totalCallsChangePct?: number;
    successfulCallsChangePct?: number;
    successRateChangePct?: number;
    durationChangePct?: number;
    scoreChangePct?: number;
  };
}

export interface ColumnMappingConfig {
  sourceCol: string;           // مبدا تماس
  destinationCol: string;      // مقصد تماس
  startTimeCol: string;        // تاریخ شروع
  endTimeCol?: string;         // تاریخ پایان
  callTypeCol?: string;        // نوع تماس
  answerStatusCol: string;     // وضعیت پاسخ تماس
  callStatusCol?: string;      // وضعیت تماس
  durationCol: string;         // طول تماس
  queueWaitCol?: string;       // مدت انتظار در صف
  ringDurationCol?: string;    // مدت زنگ خوردن
  agentIdentificationMode: 'source' | 'destination' | 'auto_by_extension';
  extensionPattern?: string;   // e.g. '10[0-9]|20[0-9]' or digits count
  answeredStatusValues: string[]; // e.g. ['پاسخ داده شده', 'موفق', 'answered', 'success']
  callTypeFilter: 'all' | 'outbound_only' | 'inbound_only';
}

export interface SystemConfig {
  score60Boundary: 'substandard' | 'critical'; // config for exact 60 point boundary
  kpi3AllowOverTargetBonus: boolean;           // allow > 10 pts for KPI3 (up to 15) vs strictly cap at 10
  bonusRewardThreshold: number;                // default 500 points
  approvedMinDurationSeconds: number;          // 120s (2:00)
  approvedMaxDurationSeconds: number;          // 210s (3:30)
  diagnosticThresholdSeconds: number;          // 180s (3:00)
  deduplicateRecords: boolean;
  maskPhoneNumbers: boolean;
}

export interface RejectedRowDetail {
  rowNumber: number;
  columnName: string;
  originalValue: string;
  reason: string;
}

export interface FilterState {
  selectedDate: string;        // 'all' or specific date string 'YYYY-MM-DD'
  selectedAgentIds: string[];  // empty = all
  performanceStatus: string;   // 'all' | 'optimal' | 'needs_attention' | 'substandard' | 'critical'
  dayType: string;             // 'all' | 'sat_to_wed' | 'thursday'
  searchQuery: string;
}

export interface ImportValidationResult {
  fileName: string;
  sheetName: string;
  totalRawRows: number;
  validRecordsCount: number;
  warningRecordsCount: number;
  rejectedRowsCount: number;
  duplicateRowsCount: number;
  ambiguousStatusCount: number;
  unresolvedRecordsCount: number;
  availableColumns: string[];
  sampleRows: Record<string, any>[];
  warnings: string[];
  rejectedDetails: RejectedRowDetail[];
  detectedAgents: string[];
  dateRangeDetected: { minDate: string; maxDate: string } | null;
}
