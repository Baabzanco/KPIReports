import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  TrendingUp, 
  Award, 
  Gift, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Layers, 
  BarChart3, 
  ArrowUpDown,
  User,
  ShieldCheck,
  Eye,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { 
  CallRecord, 
  AgentAggregateSummary, 
  AgentDailySummary,
  SystemConfig,
  DayOfWeekType,
  FilterState
} from '../types/telephony';
import { 
  toPersianDigits, 
  formatPersianNumber, 
  formatDurationPersian, 
  formatTimeDigitalPersian,
  formatJalaliShort, 
  getPersianWeekdayName, 
  formatFullJalaliWithWeekday,
  compareJalaliDates,
  getDayTypeNamePersian
} from '../utils/persianDate';
import { 
  OFFICIAL_AGENTS_LIST, 
  OFFICIAL_AGENT_REGISTRY,
  isOfficialAgentId 
} from '../utils/agentRegistry';
import { 
  getCategoryLabelPersian, 
  getCategoryBadgeClasses,
  calculateDayKPIScores 
} from '../utils/kpiEngine';

interface DailyReportsViewProps {
  calls: CallRecord[];
  agentSummaries: AgentAggregateSummary[];
  systemConfig: SystemConfig;
  filters: FilterState; // Accept global filters
  onSelectAgent: (agentId: string) => void;
}

export const DailyReportsView: React.FC<DailyReportsViewProps> = ({
  calls,
  agentSummaries,
  systemConfig,
  filters,
  onSelectAgent
}) => {
  // Tabs inside Daily Reports workspace
  const [subView, setSubView] = useState<'overview' | 'agent_matrix' | 'trends' | 'weekdays'>('overview');
  const [selectedDateDetail, setSelectedDateDetail] = useState<string | null>(null);
  
  // Use global filters directly
  const { dayType: filterWeekday, selectedAgentIds: filterAgentIds } = filters;
  const searchDate = filters.selectedDate !== 'all' ? filters.selectedDate : '';

  // Group calls by unique Jalali date
  const dailyData = useMemo(() => {
    // Map of dateStr -> calls
    const dateMap = new Map<string, CallRecord[]>();

    if (calls) {
      calls.forEach(c => {
        if (!c.dateStr) return;
        if (!dateMap.has(c.dateStr)) {
          dateMap.set(c.dateStr, []);
        }
        dateMap.get(c.dateStr)!.push(c);
      });
    }

    // Chronologically sorted date strings
    const sortedDates = Array.from(dateMap.keys()).sort(compareJalaliDates);

    return sortedDates.map(dateStr => {
      const dayCalls = dateMap.get(dateStr)!;
      const sampleCall = dayCalls[0];
      // Apply global date filter
      if (searchDate && dateStr !== searchDate) return null;

      // Filter dayCalls by selected agents if agents are selected
      const filteredDayCalls = filterAgentIds.length > 0
        ? dayCalls.filter(c => filterAgentIds.includes(c.agentId))
        : dayCalls;

      if (filteredDayCalls.length === 0) return null;

      const dayCallsToProcess = filteredDayCalls;
      const dayType: DayOfWeekType = sampleCall ? sampleCall.dayType : 'sat_to_wed';
      const weekdayName = getPersianWeekdayName(dateStr);
      const fullDateTitle = formatFullJalaliWithWeekday(dateStr);

      const eligibleCalls = dayCallsToProcess.filter(c => c.isEligible);
      const successfulCalls = eligibleCalls.filter(c => c.isSuccessful);
      const totalDuration = successfulCalls.reduce((sum, c) => sum + c.durationSeconds, 0);
      const successRate = eligibleCalls.length > 0 ? (successfulCalls.length / eligibleCalls.length) * 100 : 0;

      // Group day calls by official agents
      const agentDailyScores: Array<{
        agent: typeof OFFICIAL_AGENTS_LIST[0];
        dailySummary?: AgentDailySummary;
        totalCalls: number;
        successfulCalls: number;
        durationSeconds: number;
        score: number;
        bonus: number;
        category: string;
      }> = (filterAgentIds.length > 0
        ? OFFICIAL_AGENTS_LIST.filter(a => filterAgentIds.includes(a.id))
        : OFFICIAL_AGENTS_LIST
      ).map(officialAgent => {
        const agentDayCalls = dayCallsToProcess.filter(c => c.agentId === officialAgent.id);
        const { kpi } = calculateDayKPIScores(agentDayCalls, dayType, systemConfig, false);
        const agentSuccess = agentDayCalls.filter(c => c.isSuccessful);
        const agentDur = agentSuccess.reduce((s, c) => s + c.durationSeconds, 0);

        return {
          agent: officialAgent,
          totalCalls: agentDayCalls.length,
          successfulCalls: agentSuccess.length,
          durationSeconds: agentDur,
          score: kpi.officialCappedScore,
          bonus: kpi.dailyBonusPoints,
          category: kpi.category
        };
      });

      // Average score among active agents that day
      const activeAgentScores = agentDailyScores.filter(a => a.totalCalls > 0);
      const avgDayScore = activeAgentScores.length > 0
        ? Math.round((activeAgentScores.reduce((s, a) => s + a.score, 0) / activeAgentScores.length) * 10) / 10
        : 0;

      const totalDayBonus = agentDailyScores.reduce((s, a) => s + a.bonus, 0);

      // Approved duration calls count (2:00 to 3:30)
      const approvedCount = successfulCalls.filter(
        c => c.durationSeconds >= systemConfig.approvedMinDurationSeconds && c.durationSeconds <= systemConfig.approvedMaxDurationSeconds
      ).length;
      const approvedPct = successfulCalls.length > 0 ? (approvedCount / successfulCalls.length) * 100 : 0;

      return {
        dateStr,
        weekdayName,
        fullDateTitle,
        dayType,
        agentScores: agentDailyScores,
        agentDailyScores,
        avgScore: avgDayScore,
        avgDayScore,
        totalBonus: totalDayBonus,
        totalDayBonus,
        totalCalls: eligibleCalls.length,
        successfulCalls: successfulCalls.length,
        totalDurationSeconds: totalDuration,
        totalDuration,
        successRate: Math.round(successRate * 10) / 10,
        approvedPercent: Math.round(approvedPct * 10) / 10,
        approvedPct: Math.round(approvedPct * 10) / 10,
        approvedCount,
        calls: dayCallsToProcess
      };
    }).filter(item => item !== null) as Array<any>;
  }, [calls, systemConfig, searchDate, filterAgentIds]);

  // The dailyData is already filtered
  const filteredDailyData = dailyData;

  // Flat agent-by-day rows for Matrix view
  const agentByDayRows = useMemo(() => {
    const rows: Array<{
      dateStr: string;
      weekdayName: string;
      fullDateTitle: string;
      dayType: DayOfWeekType;
      agentId: string;
      agentName: string;
      totalCalls: number;
      successfulCalls: number;
      successRate: number;
      durationSeconds: number;
      approvedCount: number;
      score: number;
      bonus: number;
      category: string;
    }> = [];

    filteredDailyData.forEach(day => {
      if (!day || !day.agentScores) return;
      day.agentScores.forEach((ag: any) => {
        const sRate = ag.totalCalls > 0 ? (ag.successfulCalls / ag.totalCalls) * 100 : 0;
        rows.push({
          dateStr: day.dateStr,
          weekdayName: day.weekdayName,
          fullDateTitle: day.fullDateTitle,
          dayType: day.dayType,
          agentId: ag.agent.id,
          agentName: ag.agent.name,
          totalCalls: ag.totalCalls,
          successfulCalls: ag.successfulCalls,
          successRate: Math.round(sRate * 10) / 10,
          durationSeconds: ag.durationSeconds,
          approvedCount: 0,
          score: ag.score,
          bonus: ag.bonus,
          category: ag.category
        });
      });
    });

    return rows;
  }, [filteredDailyData]);

  // Weekday Comparison Data (Sat through Thu + Fri)
  const weekdayComparisonData = useMemo(() => {
    const weekdaysOrder = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    return weekdaysOrder.map(wName => {
      const matchDays = dailyData.filter(d => d.weekdayName === wName);
      const totalCalls = matchDays.reduce((s, d) => s + d.totalCalls, 0);
      const successCalls = matchDays.reduce((s, d) => s + d.successfulCalls, 0);
      const avgScore = matchDays.length > 0 
        ? Math.round((matchDays.reduce((s, d) => s + d.avgScore, 0) / matchDays.length) * 10) / 10
        : 0;
      const sRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0;

      return {
        weekday: wName,
        daysCount: matchDays.length,
        avgScore,
        successRate: sRate,
        totalCalls,
        successfulCalls: successCalls,
        isWeekend: wName === 'جمعه'
      };
    }).filter(w => w.daysCount > 0);
  }, [dailyData]);

  // Selected date drill-down object
  const activeDayDetail = useMemo(() => {
    if (!selectedDateDetail) return null;
    return dailyData.find(d => d.dateStr === selectedDateDetail) || null;
  }, [selectedDateDetail, dailyData]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                گزارش روزانه عملکرد کارشناسان (تقویم رسمی و هفته ایرانی)
              </h2>
              <p className="text-xs text-slate-500">
                ارزیابی تقویمی بر اساس ایام هفته (شنبه تا جمعه)، تقویم شمسی و لیست رسمی ۷ کارشناس مجاز
              </p>
            </div>
          </div>
        </div>

        {/* Sub-view navigation tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSubView('overview')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              subView === 'overview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>خلاصه روزانه تقویم</span>
          </button>

          <button
            onClick={() => setSubView('agent_matrix')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              subView === 'agent_matrix' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>ماتریس کارشناس در روز</span>
          </button>

          <button
            onClick={() => setSubView('trends')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              subView === 'trends' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>روند تقویمی</span>
          </button>

          <button
            onClick={() => setSubView('weekdays')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              subView === 'weekdays' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>مقایسه ایام هفته</span>
          </button>
        </div>
      </div>

      {/* Filter Summary Strip */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 mb-5 p-3 text-xs flex flex-wrap gap-4 text-slate-600">
        <div className="font-semibold">فیلترهای فعال:</div>
        <div>تاریخ: <span className="font-bold text-slate-800">{filters.selectedDate === 'all' ? 'همه روزها' : filters.selectedDate}</span></div>
        <div>کارشناسان: <span className="font-bold text-slate-800">{filters.selectedAgentIds.length === 0 ? 'همه کارشناسان' : `${toPersianDigits(filters.selectedAgentIds.length)} کارشناس منتخب`}</span></div>
        <div>نوع روز: <span className="font-bold text-slate-800">{filters.dayType === 'all' ? 'همه روزها' : filters.dayType === 'sat_to_wed' ? 'شنبه تا چهارشنبه' : 'پنج‌شنبه'}</span></div>
      </div>
      {/* 1. SUB-VIEW: DAILY OVERVIEW TABLE */}
      {subView === 'overview' && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">روز هفته</th>
                  <th className="py-3 px-4">تاریخ کامل شمسی</th>
                  <th className="py-3 px-3">نوع شیفت</th>
                  <th className="py-3 px-3">کل تماس‌ها</th>
                  <th className="py-3 px-3">تماس‌های موفق</th>
                  <th className="py-3 px-3">نرخ موفقیت</th>
                  <th className="py-3 px-3">مدت مکالمه موثر</th>
                  <th className="py-3 px-3">انطباق مجاز (۲ تا ۳:۳۰)</th>
                  <th className="py-3 px-3">میانگین امتیاز تیم</th>
                  <th className="py-3 px-3">مجموع پاداش</th>
                  <th className="py-3 px-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDailyData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      هیچ تاریخی با فیلترهای انتخابی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredDailyData.map((day) => {
                    const isThur = day.dayType === 'thursday';
                    const isFri = day.dayType === 'friday';

                    return (
                      <tr
                        key={day.dateStr}
                        onClick={() => setSelectedDateDetail(day.dateStr)}
                        className="hover:bg-indigo-50/40 transition cursor-pointer group"
                      >
                        {/* Weekday Badge */}
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isFri
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isThur
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {day.weekdayName}
                          </span>
                        </td>

                        {/* Full Jalali Date */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {day.fullDateTitle}
                          <span className="text-[10px] text-slate-400 font-mono block">
                            ({toPersianDigits(day.dateStr)})
                          </span>
                        </td>

                        {/* Day Schedule Type */}
                        <td className="py-3.5 px-3 text-slate-600">
                          {getDayTypeNamePersian(day.dayType)}
                        </td>

                        {/* Total Calls */}
                        <td className="py-3.5 px-3 font-semibold text-slate-800">
                          {formatPersianNumber(day.totalCalls)}
                        </td>

                        {/* Successful Calls */}
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {formatPersianNumber(day.successfulCalls)}
                        </td>

                        {/* Success Rate */}
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            day.successRate >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            ٪{toPersianDigits(day.successRate)}
                          </span>
                        </td>

                        {/* Total Duration */}
                        <td className="py-3.5 px-3 text-slate-800 font-mono">
                          {formatDurationPersian(day.totalDurationSeconds)}
                        </td>

                        {/* Approved Duration Compliance */}
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-indigo-700">
                            ٪{toPersianDigits(day.approvedPercent)}
                          </span>
                          <span className="text-[10px] text-slate-400 mr-1">
                            ({toPersianDigits(day.approvedCount)})
                          </span>
                        </td>

                        {/* Average Score */}
                        <td className="py-3.5 px-3 font-black text-slate-900">
                          <span className="text-sm">{toPersianDigits(day.avgScore)}</span>
                          <span className="text-[10px] text-slate-400"> / ۱۰۰</span>
                        </td>

                        {/* Total Bonus */}
                        <td className="py-3.5 px-3 font-bold text-emerald-700">
                          +{toPersianDigits(day.totalBonus)} امتیاز
                        </td>

                        {/* Action Drill-Down */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDateDetail(day.dateStr);
                            }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition"
                            title="مشاهده جزئیات شیفت‌ها و نمرات ۷ کارشناس در این روز"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SUB-VIEW: AGENT BY DAY MATRIX */}
      {subView === 'agent_matrix' && (
        <div className="space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">تاریخ شمسی</th>
                  <th className="py-3 px-3">روز هفته</th>
                  <th className="py-3 px-3">کارشناس مجاز</th>
                  <th className="py-3 px-3">کل تماس‌ها</th>
                  <th className="py-3 px-3">تماس‌های موفق</th>
                  <th className="py-3 px-3">نرخ موفقیت</th>
                  <th className="py-3 px-3">مدت مکالمه موثر</th>
                  <th className="py-3 px-3">امتیاز KPI روز</th>
                  <th className="py-3 px-3">سطح عملکرد</th>
                  <th className="py-3 px-3">پاداش روز</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agentByDayRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      هیچ رکوردی برای این کارشناس یا تاریخ یافت نشد.
                    </td>
                  </tr>
                ) : (
                  agentByDayRows.map((row, idx) => {
                    const badge = getCategoryBadgeClasses(row.category as any);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {toPersianDigits(row.dateStr)}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{row.weekdayName}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono mr-1">
                            {toPersianDigits(row.agentId)}
                          </span>
                          <span>{row.agentName}</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{formatPersianNumber(row.totalCalls)}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{formatPersianNumber(row.successfulCalls)}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700">٪{toPersianDigits(row.successRate)}</td>
                        <td className="py-3 px-3 text-slate-800 font-mono">{formatDurationPersian(row.durationSeconds)}</td>
                        <td className="py-3 px-3 font-black text-slate-900">
                          {toPersianDigits(row.score)} / ۱۰۰
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            {getCategoryLabelPersian(row.category as any)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          +{toPersianDigits(row.bonus)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SUB-VIEW: DAILY TRENDS CHART */}
      {subView === 'trends' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>نمودار روند روزانه نمره و نرخ موفقیت در طول تقویم شمسی</span>
            </h3>
            <span className="text-[11px] text-slate-500 block mb-4">
              نمایش داده‌ها به ترتیب تقویمی و پیوسته
            </span>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredDailyData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="dateStr"
                    tick={{ fill: '#475569', fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    formatter={(val: any, name: any) => [toPersianDigits(val), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="avgScore" name="میانگین امتیاز عملکرد تیم" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="successRate" name="نرخ موفقیت تماس‌ها (٪)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'سطح مطلوب (۹۰)', fill: '#10b981', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-VIEW: WEEKDAY COMPARISON */}
      {subView === 'weekdays' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weekday Scores Bar Chart */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>مقایسه میانگین نمره عملکرد در ایام هفته</span>
              </h3>
              <span className="text-[11px] text-slate-500 block mb-4">
                شنبه تا چهارشنبه در برابر پنج‌شنبه
              </span>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="weekday" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                      formatter={(val: any) => [toPersianDigits(val), 'امتیاز میانگین']}
                    />
                    <Bar dataKey="avgScore" name="میانگین امتیاز" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekday Calls Volume Chart */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                <span>حجم کل و تماس‌های موفق در ایام هفته</span>
              </h3>
              <span className="text-[11px] text-slate-500 block mb-4">
                توزیع مکالمات در روزهای مختلف کاری
              </span>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="weekday" tick={{ fill: '#475569', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ direction: 'rtl', borderRadius: '8px' }}
                      formatter={(val: any, name: any) => [toPersianDigits(val), name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="totalCalls" name="کل تماس‌ها" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="successfulCalls" name="تماس‌های موفق" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: DATE DRILL-DOWN REPORT */}
      {activeDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    جزئیات عملکرد روز {activeDayDetail.fullDateTitle}
                  </h3>
                  <p className="text-xs text-slate-400">
                    تقویم کاری: {getDayTypeNamePersian(activeDayDetail.dayType)} | {toPersianDigits(activeDayDetail.totalCalls)} تماس ثبت‌شده
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDateDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics of the Day */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-bold">کل تماس‌های روز</div>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {formatPersianNumber(activeDayDetail.totalCalls)}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[11px] text-emerald-800 font-bold">تماس‌های موفق</div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {formatPersianNumber(activeDayDetail.successfulCalls)}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    نرخ: ٪{toPersianDigits(activeDayDetail.successRate)}
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="text-[11px] text-indigo-800 font-bold">مدت مکالمات موثر</div>
                  <div className="text-base font-black text-indigo-900 mt-1">
                    {formatDurationPersian(activeDayDetail.totalDurationSeconds)}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-[11px] text-amber-800 font-bold">میانگین امتیاز تیم</div>
                  <div className="text-xl font-black text-amber-800 mt-1">
                    {toPersianDigits(activeDayDetail.avgScore)} <span className="text-xs font-normal text-slate-500">/ ۱۰۰</span>
                  </div>
                </div>
              </div>

              {/* 7 Official Agents Breakdown Table for this Day */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>عملکرد تک‌تک ۷ کارشناس مجاز در این تاریخ:</span>
                </h4>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">شناسه کارشناس</th>
                        <th className="py-2.5 px-3">نام رسمی کارشناس</th>
                        <th className="py-2.5 px-3">کل تماس‌ها</th>
                        <th className="py-2.5 px-3">تماس‌های موفق</th>
                        <th className="py-2.5 px-3">مدت مکالمه موثر</th>
                        <th className="py-2.5 px-3">امتیاز روز (از ۱۰۰)</th>
                        <th className="py-2.5 px-3">سطح عملکرد</th>
                        <th className="py-2.5 px-3">پاداش مازاد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(activeDayDetail.agentScores || []).map((ag: any) => {
                        const badge = getCategoryBadgeClasses(ag.category as any);
                        return (
                          <tr key={ag.agent.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                              داخلی {toPersianDigits(ag.agent.id)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{ag.agent.name}</td>
                            <td className="py-2.5 px-3 text-slate-800 font-semibold">{toPersianDigits(ag.totalCalls)}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{toPersianDigits(ag.successfulCalls)}</td>
                            <td className="py-2.5 px-3 text-slate-800 font-mono">{formatDurationPersian(ag.durationSeconds)}</td>
                            <td className="py-2.5 px-3 font-black text-slate-900">
                              {toPersianDigits(ag.score)} / ۱۰۰
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {getCategoryLabelPersian(ag.category as any)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">
                              +{toPersianDigits(ag.bonus)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDateDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
