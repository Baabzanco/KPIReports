/**
 * Centralized Telephony KPI Calculation Engine
 * 100% Deterministic, Pure Functions, Tested Boundary Rules
 */

import {
  CallRecord,
  DayOfWeekType,
  IntradayIntervalData,
  KPIScores,
  AgentDailySummary,
  AgentAggregateSummary,
  TeamAggregateMetrics,
  PerformanceCategory,
  SystemConfig
} from '../types/telephony';
import { getScheduledIntervals, compareJalaliDates } from './persianDate';
import { 
  OFFICIAL_AGENTS_LIST, 
  OFFICIAL_AGENT_REGISTRY, 
  isOfficialAgentId,
  UNRESOLVED_AGENT_ID,
  UNRESOLVED_AGENT_NAME
} from './agentRegistry';

export const DEFAULT_CONFIG: SystemConfig = {
  score60Boundary: 'substandard',
  kpi3AllowOverTargetBonus: false,
  bonusRewardThreshold: 500,
  approvedMinDurationSeconds: 120, // 2:00 minutes
  approvedMaxDurationSeconds: 210, // 3:30 minutes
  diagnosticThresholdSeconds: 180, // 3:00 minutes
  deduplicateRecords: true,
  maskPhoneNumbers: true,
};

/**
 * Categorize a score into performance bracket
 */
export function categorizeScore(score: number, boundary60: 'substandard' | 'critical' = 'substandard'): PerformanceCategory {
  if (score >= 91) return 'optimal';
  if (score >= 81) return 'needs_attention';
  if (score > 60) return 'substandard';
  if (score === 60) return boundary60;
  return 'critical';
}

export function getCategoryLabelPersian(category: PerformanceCategory): string {
  switch (category) {
    case 'optimal':
      return 'عملکرد مطلوب';
    case 'needs_attention':
      return 'نیازمند توجه';
    case 'substandard':
      return 'عملکرد نامطلوب';
    case 'critical':
      return 'بسیار ضعیف';
  }
}

export function getCategoryBadgeClasses(category: PerformanceCategory): { bg: string; text: string; border: string } {
  switch (category) {
    case 'optimal':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'needs_attention':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'substandard':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'critical':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
  }
}

/**
 * KPI 1 — Actual Conversation Duration (30 Points)
 * Target: Sat-Wed: 120 min | Thu: 90 min
 * min(actual / target, 1) * 30
 */
export function calculateKPI1(actualMinutes: number, dayType: DayOfWeekType): { score: number; target: number } {
  const target = dayType === 'thursday' ? 90 : 120;
  if (target <= 0 || actualMinutes <= 0) {
    return { score: 0, target };
  }
  const ratio = Math.min(actualMinutes / target, 1);
  const score = Math.round(ratio * 30 * 100) / 100;
  return { score: Math.min(score, 30), target };
}

/**
 * KPI 2 — Successful Call Rate (20 Points)
 * <40% -> 0 | 40-44.99% -> 8 | 45-49.99% -> 11 | 50-54.99% -> 15 | >=55% -> 20
 */
export function calculateKPI2(successfulCalls: number, totalCalls: number): { score: number; rate: number; hasData: boolean } {
  if (totalCalls <= 0) {
    return { score: 0, rate: 0, hasData: false };
  }
  const rate = (successfulCalls / totalCalls) * 100;
  let score = 0;
  if (rate >= 55) {
    score = 20;
  } else if (rate >= 50) {
    score = 15;
  } else if (rate >= 45) {
    score = 11;
  } else if (rate >= 40) {
    score = 8;
  } else {
    score = 0;
  }
  return { score, rate: Math.round(rate * 10) / 10, hasData: true };
}

/**
 * KPI 3 — Total Call Volume (10 Points base)
 * Sat-Wed: 145 calls | Thu: 110 calls
 * Base formula: (total / target) * 10
 */
export function calculateKPI3(
  totalCalls: number,
  dayType: DayOfWeekType,
  allowOverTargetBonus: boolean = false
): { score: number; target: number; overTargetPoints: number } {
  const target = dayType === 'thursday' ? 110 : 145;
  if (target <= 0 || totalCalls <= 0) {
    return { score: 0, target, overTargetPoints: 0 };
  }
  const rawScore = (totalCalls / target) * 10;
  const baseScore = Math.min(10, Math.round(rawScore * 100) / 100);
  const overTarget = rawScore > 10 ? Math.min(5, Math.round((rawScore - 10) * 100) / 100) : 0;
  
  const score = allowOverTargetBonus ? Math.min(15, baseScore + overTarget) : baseScore;
  return { score, target, overTargetPoints: overTarget };
}

/**
 * KPI 4 — Successful Call Count (15 Points)
 * Sat-Wed: <50 -> 0 | 50-65 -> 5 | 66-79 -> 8 | >=80 -> 15
 * Thu:     <35 -> 0 | 35-45 -> 5 | 46-59 -> 8 | >=60 -> 15
 */
export function calculateKPI4(successfulCalls: number, dayType: DayOfWeekType): { score: number } {
  const count = Math.floor(successfulCalls);
  let score = 0;
  if (dayType === 'thursday') {
    if (count >= 60) score = 15;
    else if (count >= 46) score = 8;
    else if (count >= 35) score = 5;
    else score = 0;
  } else {
    if (count >= 80) score = 15;
    else if (count >= 66) score = 8;
    else if (count >= 50) score = 5;
    else score = 0;
  }
  return { score };
}

/**
 * KPI 5 — Approved Conversation Duration (15 Points)
 * Duration between 2:00 (120s) and 3:30 (210s)
 * <30% -> 0 | 30-<50% -> 3 | 50-<80% -> 5 | >=80% -> 15
 */
export function calculateKPI5(
  approvedCalls: number,
  totalSuccessfulCalls: number
): { score: number; percent: number; hasData: boolean } {
  if (totalSuccessfulCalls <= 0) {
    return { score: 0, percent: 0, hasData: false };
  }
  const percent = (approvedCalls / totalSuccessfulCalls) * 100;
  let score = 0;
  if (percent >= 80) {
    score = 15;
  } else if (percent >= 50) {
    score = 5;
  } else if (percent >= 30) {
    score = 3;
  } else {
    score = 0;
  }
  return { score, percent: Math.round(percent * 10) / 10, hasData: true };
}

/**
 * KPI 6 — Performance Stability (10 Points)
 * min(successful calls in intervals) / avg(successful calls in intervals) * 100
 * <50% -> 0 | 50-59.99% -> 2 | 60-69.99% -> 3 | 70-79.99% -> 4 | 80-89.99% -> 6 | >=90% -> 10
 */
export function calculateKPI6(
  intervalCounts: number[]
): { score: number; stabilityPercent: number; minCalls: number; avgCalls: number; hasData: boolean } {
  if (!intervalCounts || intervalCounts.length === 0) {
    return { score: 0, stabilityPercent: 0, minCalls: 0, avgCalls: 0, hasData: false };
  }
  const minCalls = Math.min(...intervalCounts);
  const sum = intervalCounts.reduce((acc, c) => acc + c, 0);
  const avgCalls = sum / intervalCounts.length;

  if (avgCalls <= 0) {
    return { score: 0, stabilityPercent: 0, minCalls: 0, avgCalls: 0, hasData: true };
  }

  const stability = (minCalls / avgCalls) * 100;
  let score = 0;
  if (stability >= 90) {
    score = 10;
  } else if (stability >= 80) {
    score = 6;
  } else if (stability >= 70) {
    score = 4;
  } else if (stability >= 60) {
    score = 3;
  } else if (stability >= 50) {
    score = 2;
  } else {
    score = 0;
  }

  return {
    score,
    stabilityPercent: Math.round(stability * 10) / 10,
    minCalls,
    avgCalls: Math.round(avgCalls * 10) / 10,
    hasData: true
  };
}

/**
 * Separate Bonus System Calculation (Floor(max(0, minutes - target) / 3))
 */
export function calculateDailyBonus(actualMinutes: number, dayType: DayOfWeekType): number {
  const targetMinutes = dayType === 'thursday' ? 90 : 120;
  if (actualMinutes <= targetMinutes) return 0;
  return Math.floor((actualMinutes - targetMinutes) / 3);
}

/**
 * Calculate full KPIScores for an agent's single day call records
 */
export function calculateDayKPIScores(
  calls: CallRecord[],
  dayType: DayOfWeekType,
  config: SystemConfig = DEFAULT_CONFIG,
  isProvisional: boolean = false
): { kpi: KPIScores; intervals: IntradayIntervalData[] } {
  const eligibleCalls = calls.filter(c => c.isEligible);
  const successfulCalls = eligibleCalls.filter(c => c.isSuccessful);

  // Duration in minutes (only successfully answered calls!)
  const actualDurationSeconds = successfulCalls.reduce((sum, c) => sum + c.durationSeconds, 0);
  const actualMinutes = actualDurationSeconds / 60;

  // KPI 1
  const kpi1 = calculateKPI1(actualMinutes, dayType);

  // KPI 2
  const kpi2 = calculateKPI2(successfulCalls.length, eligibleCalls.length);

  // KPI 3
  const kpi3 = calculateKPI3(eligibleCalls.length, dayType, config.kpi3AllowOverTargetBonus);

  // KPI 4
  const kpi4 = calculateKPI4(successfulCalls.length, dayType);

  // KPI 5: Approved duration (120s to 210s)
  const approvedCalls = successfulCalls.filter(
    c => c.durationSeconds >= config.approvedMinDurationSeconds && c.durationSeconds <= config.approvedMaxDurationSeconds
  );
  const exceedingCalls = successfulCalls.filter(
    c => c.durationSeconds > config.approvedMaxDurationSeconds
  );
  const kpi5 = calculateKPI5(approvedCalls.length, successfulCalls.length);

  // Intraday intervals
  const scheduledIntervals = getScheduledIntervals(dayType);
  const intervalsData: IntradayIntervalData[] = scheduledIntervals.map(slot => {
    const slotCalls = eligibleCalls.filter(c => c.intervalSlot === slot);
    const slotSuccess = slotCalls.filter(c => c.isSuccessful);
    const slotDuration = slotSuccess.reduce((sum, c) => sum + c.durationSeconds, 0);
    const targetCalls = 20; // 20 successful calls per interval
    return {
      interval: slot,
      totalCalls: slotCalls.length,
      successfulCalls: slotSuccess.length,
      durationSeconds: slotDuration,
      targetCalls,
      targetMet: slotSuccess.length >= targetCalls,
      isElapsed: true, // for historical records
      isCurrent: false,
      isFuture: false,
    };
  });

  // KPI 6: Stability
  const intervalCounts = intervalsData.map(i => i.successfulCalls);
  const kpi6 = calculateKPI6(intervalCounts);

  // Total Score (nominal max 100)
  const rawTotal = kpi1.score + kpi2.score + kpi3.score + kpi4.score + kpi5.score + kpi6.score;
  const officialCappedScore = Math.min(100, Math.round(rawTotal * 10) / 10);
  const category = categorizeScore(officialCappedScore, config.score60Boundary);

  // Separate Bonus
  const bonus = calculateDailyBonus(actualMinutes, dayType);

  const kpi: KPIScores = {
    kpi1_durationMinutes: Math.round(actualMinutes * 10) / 10,
    kpi1_targetMinutes: kpi1.target,
    kpi1_score: kpi1.score,

    kpi2_ratePercent: kpi2.rate,
    kpi2_score: kpi2.score,
    kpi2_hasSufficientData: kpi2.hasData,

    kpi3_totalCalls: eligibleCalls.length,
    kpi3_targetCalls: kpi3.target,
    kpi3_score: kpi3.score,
    kpi3_overTargetPoints: kpi3.overTargetPoints,

    kpi4_successfulCalls: successfulCalls.length,
    kpi4_score: kpi4.score,

    kpi5_approvedCallsCount: approvedCalls.length,
    kpi5_exceedingCallsCount: exceedingCalls.length,
    kpi5_approvedPercent: kpi5.percent,
    kpi5_score: kpi5.score,

    kpi6_minCalls: kpi6.minCalls,
    kpi6_avgCalls: kpi6.avgCalls,
    kpi6_stabilityPercent: kpi6.stabilityPercent,
    kpi6_score: kpi6.score,
    kpi6_isProvisional: isProvisional,
    kpi6_hasSufficientData: kpi6.hasData,

    totalScore: Math.round(rawTotal * 10) / 10,
    officialCappedScore,
    category,
    isProvisionalDay: isProvisional,

    dailyBonusPoints: bonus
  };

  return { kpi, intervals: intervalsData };
}

/**
 * Group calls by agent and date, computing daily summaries and agent aggregates
 */
export function aggregateTelephonyData(
  records: CallRecord[],
  config: SystemConfig = DEFAULT_CONFIG
): {
  agentSummaries: AgentAggregateSummary[];
  teamMetrics: TeamAggregateMetrics;
  uniqueDates: string[];
  uniqueAgents: { id: string; name: string }[];
} {
  if (!records || records.length === 0) {
    return {
      agentSummaries: [],
      teamMetrics: {
        totalCalls: 0,
        successfulCalls: 0,
        successRate: 0,
        totalDurationSeconds: 0,
        averageDurationPerSuccess: 0,
        approvedDurationCount: 0,
        approvedDurationPercent: 0,
        exceedingDurationCount: 0,
        agentsMeetingDurationTargetCount: 0,
        totalActiveAgents: 0,
        averageTeamScore: 0,
        totalCumulativeBonusPoints: 0,
        activeDaysCount: 0
      },
      uniqueDates: [],
      uniqueAgents: []
    };
  }

  // Chronologically sort unique dates across months and years
  const dateSet = new Set<string>();
  records.forEach(r => {
    if (r.dateStr) {
      dateSet.add(r.dateStr);
    }
  });

  const uniqueDates: string[] = Array.from(dateSet).sort((a, b) => compareJalaliDates(a, b));

  // The ONLY authorized agents in the system are the 7 official agents
  const uniqueAgents = OFFICIAL_AGENTS_LIST.map(a => ({
    id: a.id,
    name: `${a.name} (داخلی ${a.id})`
  }));

  // Group by agent -> date
  const agentDailyMap = new Map<string, Map<string, CallRecord[]>>();

  records.forEach(r => {
    if (!r.agentId) return;
    if (!agentDailyMap.has(r.agentId)) {
      agentDailyMap.set(r.agentId, new Map());
    }
    const dayMap = agentDailyMap.get(r.agentId)!;
    if (!dayMap.has(r.dateStr)) {
      dayMap.set(r.dateStr, []);
    }
    dayMap.get(r.dateStr)!.push(r);
  });

  const agentSummaries: AgentAggregateSummary[] = [];

  // Strictly aggregate for the 7 official agents ONLY
  OFFICIAL_AGENTS_LIST.forEach(officialAgent => {
    const agentId = officialAgent.id;
    const agentName = officialAgent.name;
    const daysMap = agentDailyMap.get(agentId) || new Map<string, CallRecord[]>();
    const dailySummaries: AgentDailySummary[] = [];
    let cumulativeBonus = 0;

    daysMap.forEach((dayCalls, dateStr) => {
      const sampleCall = dayCalls[0];
      const dayType = sampleCall.dayType;
      const { kpi, intervals } = calculateDayKPIScores(dayCalls, dayType, config, false);

      const successfulCalls = dayCalls.filter(c => c.isSuccessful);
      const totalDur = successfulCalls.reduce((acc, c) => acc + c.durationSeconds, 0);

      cumulativeBonus += kpi.dailyBonusPoints;

      dailySummaries.push({
        agentId,
        agentName,
        dateStr,
        dayType,
        totalCalls: dayCalls.length,
        successfulCalls: successfulCalls.length,
        unsuccessfulCalls: dayCalls.length - successfulCalls.length,
        totalDurationSeconds: totalDur,
        averageDurationSeconds: successfulCalls.length > 0 ? totalDur / successfulCalls.length : 0,
        kpi,
        intervals
      });
    });

    // Sort daily summaries by date
    dailySummaries.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // Aggregate over all days for this agent efficiently
    const allAgentCalls = Array.from(daysMap.values()).flat();
    const allSuccessfulCalls = allAgentCalls.filter(c => c.isSuccessful);
    const totalDurationSeconds = allSuccessfulCalls.reduce((acc, c) => acc + c.durationSeconds, 0);
    const avgDuration = allSuccessfulCalls.length > 0 ? totalDurationSeconds / allSuccessfulCalls.length : 0;

    const approvedCount = allSuccessfulCalls.filter(
      c => c.durationSeconds >= config.approvedMinDurationSeconds && c.durationSeconds <= config.approvedMaxDurationSeconds
    ).length;
    const exceedingCount = allSuccessfulCalls.filter(
      c => c.durationSeconds > config.approvedMaxDurationSeconds
    ).length;
    const approvedPercent = allSuccessfulCalls.length > 0 ? (approvedCount / allSuccessfulCalls.length) * 100 : 0;
    const successRate = allAgentCalls.length > 0 ? (allSuccessfulCalls.length / allAgentCalls.length) * 100 : 0;

    const avgScore = dailySummaries.length > 0
      ? dailySummaries.reduce((sum, d) => sum + d.kpi.officialCappedScore, 0) / dailySummaries.length
      : 0;

    const lastDailyScore = dailySummaries.length > 0
      ? dailySummaries[dailySummaries.length - 1].kpi.officialCappedScore
      : 0;

    const kpiBreakdown = {
      kpi1: dailySummaries.length ? dailySummaries.reduce((s, d) => s + d.kpi.kpi1_score, 0) / dailySummaries.length : 0,
      kpi2: dailySummaries.length ? dailySummaries.reduce((s, d) => s + d.kpi.kpi2_score, 0) / dailySummaries.length : 0,
      kpi3: dailySummaries.length ? dailySummaries.reduce((s, d) => s + d.kpi.kpi3_score, 0) / dailySummaries.length : 0,
      kpi4: dailySummaries.length ? dailySummaries.reduce((s, d) => s + d.kpi.kpi4_score, 0) / dailySummaries.length : 0,
      kpi5: dailySummaries.length ? dailySummaries.reduce((s, d) => s + d.kpi.kpi5_score, 0) / dailySummaries.length : 0,
      kpi6: dailySummaries.length ? dailySummaries.reduce((s, d) => s + d.kpi.kpi6_score, 0) / dailySummaries.length : 0,
    };

    const stabilityAvg = dailySummaries.length
      ? dailySummaries.reduce((s, d) => s + d.kpi.kpi6_stabilityPercent, 0) / dailySummaries.length
      : 0;

    const rewardProgress = Math.min(100, Math.round((cumulativeBonus / config.bonusRewardThreshold) * 100));

    agentSummaries.push({
      agentId,
      agentName,
      daysCount: dailySummaries.length,
      totalCalls: allAgentCalls.length,
      successfulCalls: allSuccessfulCalls.length,
      successRate: Math.round(successRate * 10) / 10,
      totalDurationSeconds,
      averageDurationPerSuccess: Math.round(avgDuration),
      approvedDurationCount: approvedCount,
      approvedDurationPercent: Math.round(approvedPercent * 10) / 10,
      exceedingDurationCount: exceedingCount,
      averageDailyScore: Math.round(avgScore * 10) / 10,
      lastDailyScore,
      category: categorizeScore(avgScore, config.score60Boundary),
      cumulativeBonusPoints: cumulativeBonus,
      rewardProgressPercent: rewardProgress,
      stabilityAverage: Math.round(stabilityAvg * 10) / 10,
      kpiBreakdown: {
        kpi1: Math.round(kpiBreakdown.kpi1 * 10) / 10,
        kpi2: Math.round(kpiBreakdown.kpi2 * 10) / 10,
        kpi3: Math.round(kpiBreakdown.kpi3 * 10) / 10,
        kpi4: Math.round(kpiBreakdown.kpi4 * 10) / 10,
        kpi5: Math.round(kpiBreakdown.kpi5 * 10) / 10,
        kpi6: Math.round(kpiBreakdown.kpi6 * 10) / 10,
      },
      dailySummaries
    });
  });

  // Sort agents by averageDailyScore desc
  agentSummaries.sort((a, b) => b.averageDailyScore - a.averageDailyScore);

  // Calculate team aggregate metrics
  const totalCalls = records.length;
  const successfulCalls = records.filter(c => c.isSuccessful).length;
  const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
  const totalDurationSeconds = records.filter(c => c.isSuccessful).reduce((sum, c) => sum + c.durationSeconds, 0);
  const averageDurationPerSuccess = successfulCalls > 0 ? totalDurationSeconds / successfulCalls : 0;

  const approvedDurationCount = records.filter(
    c => c.isSuccessful && c.durationSeconds >= config.approvedMinDurationSeconds && c.durationSeconds <= config.approvedMaxDurationSeconds
  ).length;
  const exceedingDurationCount = records.filter(
    c => c.isSuccessful && c.durationSeconds > config.approvedMaxDurationSeconds
  ).length;
  const approvedDurationPercent = successfulCalls > 0 ? (approvedDurationCount / successfulCalls) * 100 : 0;

  // Count how many agents met their daily duration target on their active days
  let agentsMeetingTarget = 0;
  agentSummaries.forEach(agent => {
    const metAnyDay = agent.dailySummaries.some(d => {
      const targetMin = d.dayType === 'thursday' ? 90 : 120;
      return (d.totalDurationSeconds / 60) >= targetMin;
    });
    if (metAnyDay) agentsMeetingTarget++;
  });

  const averageTeamScore = agentSummaries.length > 0
    ? agentSummaries.reduce((sum, a) => sum + a.averageDailyScore, 0) / agentSummaries.length
    : 0;

  const totalCumulativeBonus = agentSummaries.reduce((sum, a) => sum + a.cumulativeBonusPoints, 0);

  const teamMetrics: TeamAggregateMetrics = {
    totalCalls,
    successfulCalls,
    successRate: Math.round(successRate * 10) / 10,
    totalDurationSeconds,
    averageDurationPerSuccess: Math.round(averageDurationPerSuccess),
    approvedDurationCount,
    approvedDurationPercent: Math.round(approvedDurationPercent * 10) / 10,
    exceedingDurationCount,
    agentsMeetingDurationTargetCount: agentsMeetingTarget,
    totalActiveAgents: agentSummaries.length,
    averageTeamScore: Math.round(averageTeamScore * 10) / 10,
    totalCumulativeBonusPoints: totalCumulativeBonus,
    activeDaysCount: uniqueDates.length
  };

  return {
    agentSummaries,
    teamMetrics,
    uniqueDates,
    uniqueAgents
  };
}
