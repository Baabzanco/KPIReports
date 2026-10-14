import React, { useState } from 'react';
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
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from 'recharts';
import {
  AgentAggregateSummary,
  TeamAggregateMetrics,
  CallRecord
} from '../types/telephony';
import {
  toPersianDigits,
  formatPersianNumber,
  formatDurationPersian,
  formatJalaliShort
} from '../utils/persianDate';
import {
  TrendingUp,
  BarChart3,
  Layers,
  PieChart as PieIcon,
  Clock,
  Activity,
  Award,
  SlidersHorizontal,
  Compass
} from 'lucide-react';

interface AnalyticsChartsProps {
  agents: AgentAggregateSummary[];
  teamMetrics: TeamAggregateMetrics;
  calls: CallRecord[];
  onSelectAgent: (agentId: string) => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  agents,
  teamMetrics,
  calls,
  onSelectAgent
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'quality' | 'intraday' | 'matrix'>('trends');
  const [trendMetric, setTrendMetric] = useState<'score' | 'rate' | 'duration'>('score');

  // Chart 1: Daily Trend Data (aggregate per day)
  const dailyMap = new Map<string, { calls: number; success: number; duration: number; scoreSum: number; agentCount: number }>();
  calls.forEach(c => {
    if (!dailyMap.has(c.dateStr)) {
      dailyMap.set(c.dateStr, { calls: 0, success: 0, duration: 0, scoreSum: 0, agentCount: 0 });
    }
    const d = dailyMap.get(c.dateStr)!;
    d.calls++;
    if (c.isSuccessful) {
      d.success++;
      d.duration += c.durationSeconds;
    }
  });

  const dailyTrendData = Array.from(dailyMap.entries()).map(([dateStr, d]) => {
    const successRate = d.calls > 0 ? (d.success / d.calls) * 100 : 0;
    const durMinutes = Math.round(d.duration / 60);
    // Find average score across agents for this day
    let totalScore = 0;
    let count = 0;
    agents.forEach(a => {
      const daySum = a.dailySummaries.find(ds => ds.dateStr === dateStr);
      if (daySum) {
        totalScore += daySum.kpi.officialCappedScore;
        count++;
      }
    });
    const avgScore = count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;

    return {
      date: formatJalaliShort(new Date(dateStr)),
      rawDate: dateStr,
      avgScore,
      successRate: Math.round(successRate * 10) / 10,
      durationMinutes: durMinutes,
      totalCalls: d.calls,
      successfulCalls: d.success
    };
  }).sort((a, b) => a.rawDate.localeCompare(b.rawDate));

  // Chart 2: Agent Score Comparison Data
  const agentScoreData = agents.map(a => ({
    name: a.agentName.split(' ')[0] + ' ' + (a.agentName.split(' ')[1] || ''),
    fullName: a.agentName,
    agentId: a.agentId,
    score: a.averageDailyScore,
    successRate: a.successRate
  }));

  // Chart 3: KPI Breakdown Data
  const kpiBreakdownData = agents.map(a => ({
    name: a.agentName.split(' ')[0],
    agentId: a.agentId,
    'مدت مکالمه (KPI 1)': a.kpiBreakdown.kpi1,
    'نرخ موفقیت (KPI 2)': a.kpiBreakdown.kpi2,
    'حجم تماس (KPI 3)': a.kpiBreakdown.kpi3,
    'تعداد موفق (KPI 4)': a.kpiBreakdown.kpi4,
    'مدت مجاز (KPI 5)': a.kpiBreakdown.kpi5,
    'پایداری (KPI 6)': a.kpiBreakdown.kpi6,
    total: a.averageDailyScore
  }));

  // Chart 4: Call Outcome Breakdown
  const answeredCount = calls.filter(c => c.isSuccessful).length;
  const noAnswerCount = calls.filter(c => !c.isSuccessful && c.answerStatus === 'no_answer').length;
  const busyCount = calls.filter(c => !c.isSuccessful && c.answerStatus === 'busy').length;
  const otherUnsuccessful = Math.max(0, calls.length - answeredCount - noAnswerCount - busyCount);

  const callOutcomeData = [
    { name: 'پاسخ داده شده (موفق)', value: answeredCount, color: '#10b981' },
    { name: 'بدون پاسخ (No Answer)', value: noAnswerCount || 1, color: '#f59e0b' },
    { name: 'اشغال (Busy)', value: busyCount || 1, color: '#ef4444' },
    { name: 'سایر موارد ناموفق', value: otherUnsuccessful, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  // Chart 5: Duration Distribution (buckets: <1m, 1-2m, 2-3:30m [approved], 3:30-5m, >5m)
  const successfulCalls = calls.filter(c => c.isSuccessful);
  const durBucket1 = successfulCalls.filter(c => c.durationSeconds < 60).length;
  const durBucket2 = successfulCalls.filter(c => c.durationSeconds >= 60 && c.durationSeconds < 120).length;
  const durBucket3 = successfulCalls.filter(c => c.durationSeconds >= 120 && c.durationSeconds <= 210).length; // Approved
  const durBucket4 = successfulCalls.filter(c => c.durationSeconds > 210 && c.durationSeconds <= 300).length;
  const durBucket5 = successfulCalls.filter(c => c.durationSeconds > 300).length;

  const durationDistData = [
    { range: 'کمتر از ۱ دقیقه', count: durBucket1, type: 'short' },
    { range: '۱ تا ۲ دقیقه', count: durBucket2, type: 'short' },
    { range: '۲ تا ۳:۳۰ دقیقه (بازه مجاز)', count: durBucket3, type: 'approved' },
    { range: '۳:۳۰ تا ۵ دقیقه', count: durBucket4, type: 'long' },
    { range: 'بیش از ۵ دقیقه', count: durBucket5, type: 'long' },
  ];

  // Chart 6: Intraday Productivity Data (2-hour intervals)
  const intervals = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00'];
  const intradayProductivityData = intervals.map(slot => {
    const slotCalls = calls.filter(c => c.intervalSlot === slot);
    const success = slotCalls.filter(c => c.isSuccessful).length;
    return {
      interval: slot,
      successfulCalls: success,
      totalCalls: slotCalls.length,
      target: 20 * (agents.length || 1) // Target for team
    };
  });

  // Chart 7: Stability Analysis (Min vs Avg successful calls across intervals)
  const stabilityData = agents.map(a => ({
    name: a.agentName.split(' ')[0],
    agentId: a.agentId,
    stabilityPercent: a.stabilityAverage,
    score: a.kpiBreakdown.kpi6
  }));

  // Chart 8: Performance Matrix (Scatter: Success Rate vs Total Duration in hours)
  const performanceMatrixData = agents.map(a => ({
    name: a.agentName,
    agentId: a.agentId,
    x: a.successRate, // %
    y: Math.round((a.totalDurationSeconds / 3600) * 10) / 10, // hours
    z: a.averageDailyScore,
    category: a.category
  }));

  // Chart 9: Performance Category Distribution
  const optimalCount = agents.filter(a => a.category === 'optimal').length;
  const attentionCount = agents.filter(a => a.category === 'needs_attention').length;
  const substandardCount = agents.filter(a => a.category === 'substandard').length;
  const criticalCount = agents.filter(a => a.category === 'critical').length;

  const categoryDistData = [
    { name: 'عملکرد مطلوب (۹۱-۱۰۰)', count: optimalCount, color: '#10b981' },
    { name: 'نیازمند توجه (۸۱-۹۰)', count: attentionCount, color: '#f59e0b' },
    { name: 'عملکرد نامطلوب (۶۱-۸۰)', count: substandardCount, color: '#f97316' },
    { name: 'بسیار ضعیف (زیر ۶۰)', count: criticalCount, color: '#ef4444' },
  ].filter(d => d.count > 0);

  // Chart 10: Bonus Points Progress
  const bonusProgressData = agents.map(a => ({
    name: a.agentName.split(' ')[0],
    agentId: a.agentId,
    bonusPoints: a.cumulativeBonusPoints,
    threshold: 500
  }));

  // Custom Tooltip Formatter
  const customTooltipFormatter = (value: any, name: any) => {
    return [toPersianDigits(value), name];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 mb-6">
      {/* Chart Section Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>مرکز مصورسازی پیشرفته شاخص‌های کلیدی عملکرد</span>
          </h2>
          <p className="text-xs text-slate-500">
            تحلیل ۱۰ گانه روندها، مقایسه‌ها، توزیع مدت مکالمه، ماتریس بهره‌وری و پایداری
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'trends' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>روند و مقایسه‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quality' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>کیفیت و مدت مکالمات</span>
          </button>

          <button
            onClick={() => setActiveTab('intraday')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'intraday' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>پایش ساعتی و پایداری</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>ماتریس عملکرد و پاداش</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Trends & Comparisons */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Daily Performance Trend */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۱ — روند عملکرد روزانه</span>
                </h3>
                <span className="text-[11px] text-slate-500">تغییرات امتیاز، نرخ موفقیت و مدت مکالمه</span>
              </div>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  onClick={() => setTrendMetric('score')}
                  className={`px-2 py-0.5 rounded ${trendMetric === 'score' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                >
                  امتیاز
                </button>
                <button
                  onClick={() => setTrendMetric('rate')}
                  className={`px-2 py-0.5 rounded ${trendMetric === 'rate' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                >
                  نرخ موفقیت
                </button>
                <button
                  onClick={() => setTrendMetric('duration')}
                  className={`px-2 py-0.5 rounded ${trendMetric === 'duration' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-600'}`}
                >
                  مدت مکالمه
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  {trendMetric === 'score' && (
                    <Line type="monotone" dataKey="avgScore" name="میانگین امتیاز KPI" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                  )}
                  {trendMetric === 'rate' && (
                    <Line type="monotone" dataKey="successRate" name="نرخ موفقیت (٪)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  )}
                  {trendMetric === 'duration' && (
                    <Line type="monotone" dataKey="durationMinutes" name="مدت کل (دقیقه)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Agent Score Comparison */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۲ — مقایسه نمره کل کارشناسان</span>
                </h3>
                <span className="text-[11px] text-slate-500">میانگین امتیاز عملکرد روزانه (از ۱۰۰)</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentScoreData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 11 }} width={80} />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <Bar
                    dataKey="score"
                    name="امتیاز عملکرد"
                    fill="#4f46e5"
                    radius={[0, 4, 4, 0]}
                    onClick={(data: any) => {
                      const item = data?.payload || data;
                      if (item && item.agentId) onSelectAgent(item.agentId);
                    }}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: KPI Breakdown (Stacked Bar) */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۳ — تفکیک امتیازات ۶ شاخص کلیدی عملکرد</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  سهم هر یک از شاخص‌های مدت مکالمه (۳۰)، نرخ موفقیت (۲۰)، حجم (۱۰)، تعداد (۱۵)، انطباق مجاز (۱۵) و پایداری (۱۰)
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpiBreakdownData} margin={{ top: 20, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="مدت مکالمه (KPI 1)" stackId="a" fill="#6366f1" />
                  <Bar dataKey="نرخ موفقیت (KPI 2)" stackId="a" fill="#10b981" />
                  <Bar dataKey="حجم تماس (KPI 3)" stackId="a" fill="#06b6d4" />
                  <Bar dataKey="تعداد موفق (KPI 4)" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="مدت مجاز (KPI 5)" stackId="a" fill="#8b5cf6" />
                  <Bar dataKey="پایداری (KPI 6)" stackId="a" fill="#ec4899" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Quality & Duration Compliance */}
      {activeTab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 4: Call Outcome Breakdown */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۴ — تفکیک نتایج و وضعیت پاسخ تماس‌ها</span>
                </h3>
                <span className="text-[11px] text-slate-500">پاسخ داده‌شده در برابر بی‌پاسخ، اشغال و سایر</span>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callOutcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {callOutcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Duration Distribution */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۵ — توزیع مدت مکالمات موفق (KPI 5)</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  بازه مجاز مصوب: ۲ دقیقه تا ۳:۳۰ دقیقه (۱۲۰ الی ۲۱۰ ثانیه)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={durationDistData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fill: '#475569', fontSize: 10 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <Bar dataKey="count" name="تعداد مکالمه">
                    {durationDistData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === 'approved' ? '#10b981' : entry.type === 'long' ? '#f59e0b' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Intraday Productivity & Stability */}
      {activeTab === 'intraday' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 6: Intraday Productivity */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۶ — بهره‌وری در بازه‌های ۲ ساعته درون‌روزی</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  مکالمات موفق در هر شیفت با خط هدف (۲۰ تماس به ازای هر کارشناس)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intradayProductivityData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="interval" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="successfulCalls" name="تماس‌های موفق" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={20 * (agents.length || 1)} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'تارگت شیفت', fill: '#ef4444', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 7: Stability Analysis */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۷ — تحلیل پایداری عملکرد (KPI 6)</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  درصد پایداری (حداقل تماس / میانگین تماس شیفت‌ها × ۱۰۰)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <Bar dataKey="stabilityPercent" name="درصد پایداری" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: '۱۰ امتیاز (۹۰٪)', fill: '#10b981', fontSize: 10 }} />
                  <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'حداقل قبولی (۵۰٪)', fill: '#f59e0b', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Performance Matrix & Bonus */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 8: Performance Matrix */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-500" />
                  <span>نمودار ۸ — ماتریس موقعیت عملکردی کارشناسان</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  محور افقی: نرخ موفقیت (٪) | محور عمودی: مدت کل مکالمات (ساعت)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="x" name="نرخ موفقیت" unit="٪" domain={[20, 80]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" name="مدت مکالمه" unit=" ساعت" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <ZAxis type="number" dataKey="z" range={[60, 240]} name="امتیاز KPI" />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={customTooltipFormatter}
                    contentStyle={{ direction: 'rtl', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                  <Scatter name="کارشناسان" data={performanceMatrixData} fill="#6366f1" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 9: Status Distribution & Chart 10: Bonus Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Chart 9 */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-1">
                  نمودار ۹ — توزیع سطوح عملکرد
                </h3>
                <span className="text-[10px] text-slate-500">دسته‌بندی کارشناسان بر اساس نمره نهایی</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryDistData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={55}>
                      {categoryDistData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={customTooltipFormatter} contentStyle={{ direction: 'rtl', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[10px] space-y-1 text-slate-600 border-t border-slate-200/60 pt-2">
                {categoryDistData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      <span>{c.name}</span>
                    </span>
                    <span className="font-bold">{toPersianDigits(c.count)} نفر</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 10: Bonus Progress */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1 text-emerald-700">
                  <Award className="w-3.5 h-3.5" />
                  <span>نمودار ۱۰ — پیشرفت پاداش (مرز ۵۰۰)</span>
                </h3>
                <span className="text-[10px] text-slate-500">سیستم پاداش مستقل از نمره ۱۰۰</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bonusProgressData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 500]} tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#334155', fontSize: 10 }} width={45} />
                    <Tooltip formatter={customTooltipFormatter} contentStyle={{ direction: 'rtl', borderRadius: '8px' }} />
                    <Bar dataKey="bonusPoints" name="امتیاز پاداش" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[10px] text-emerald-700 font-semibold text-center border-t border-slate-200/60 pt-2">
                هر ۳ دقیقه مکالمه مازاد = ۱ امتیاز پاداش
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
