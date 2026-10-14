import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Gift, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Activity, 
  Calendar, 
  Search, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { AgentAggregateSummary, CallRecord } from '../types/telephony';
import { 
  toPersianDigits, 
  formatPersianNumber, 
  formatDurationPersian, 
  formatTimeDigitalPersian,
  formatJalaliShort,
  formatTimePersian,
  maskPhoneNumber
} from '../utils/persianDate';
import { getCategoryLabelPersian, getCategoryBadgeClasses } from '../utils/kpiEngine';

interface AgentDetailModalProps {
  agent: AgentAggregateSummary;
  agentCalls: CallRecord[];
  onClose: () => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  agent,
  agentCalls,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'history' | 'calls'>('kpi');
  const [callSearch, setCallSearch] = useState<string>('');
  const [callFilter, setCallFilter] = useState<'all' | 'successful' | 'approved' | 'exceeding'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const badge = getCategoryBadgeClasses(agent.category);

  // Filter calls
  const filteredCalls = agentCalls.filter(c => {
    // search filter
    const matchesSearch = !callSearch || 
      c.destination.includes(callSearch) || 
      c.source.includes(callSearch);
    
    if (!matchesSearch) return false;

    if (callFilter === 'successful') return c.isSuccessful;
    if (callFilter === 'approved') return c.isSuccessful && c.durationSeconds >= 120 && c.durationSeconds <= 210;
    if (callFilter === 'exceeding') return c.isSuccessful && c.durationSeconds > 210;

    return true;
  });

  const totalPages = Math.ceil(filteredCalls.length / pageSize) || 1;
  const paginatedCalls = filteredCalls.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-base shadow-inner">
              {agent.agentName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  کارنامه جامع عملکرد {agent.agentName}
                </h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {getCategoryLabelPersian(agent.category)}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                شماره داخلی: {toPersianDigits(agent.agentId)} | ارزیابی مبتنی بر {toPersianDigits(agent.daysCount)} روز کاری ({toPersianDigits(agent.totalCalls)} تماس)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <div className="text-xs text-slate-400">میانگین امتیاز کل</div>
              <div className="text-xl font-black text-amber-400">
                {toPersianDigits(agent.averageDailyScore)} <span className="text-xs text-slate-400">/ ۱۰۰</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-semibold">
          <div className="flex gap-2 py-2">
            <button
              onClick={() => setActiveTab('kpi')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'kpi' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تحلیل ۶ شاخص کلیدی و پاداش
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'history' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              گزارش تفکیکی روزانه ({toPersianDigits(agent.dailySummaries.length)} روز)
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'calls' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ریز رکوردهای تماس ({toPersianDigits(agentCalls.length)})
            </button>
          </div>

          {/* Bonus Points Chip */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span>پاداش تجمعی: <strong>{toPersianDigits(agent.cumulativeBonusPoints)} امتیاز</strong></span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: KPI Breakdown & Bonus */}
          {activeTab === 'kpi' && (
            <>
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">کل تماس‌ها و موفقیت</div>
                  <div className="text-base font-black text-slate-900">
                    {toPersianDigits(agent.successfulCalls)} <span className="text-xs text-slate-500 font-normal">از {toPersianDigits(agent.totalCalls)} تماس</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                    نرخ موفقیت: ٪{toPersianDigits(agent.successRate)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">مدت کل مکالمات موثر</div>
                  <div className="text-base font-black text-slate-900">
                    {formatDurationPersian(agent.totalDurationSeconds)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    میانگین هر مکالمه: {formatDurationPersian(agent.averageDurationPerSuccess)}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">انطباق با مدت مجاز (۲ تا ۳:۳۰)</div>
                  <div className="text-base font-black text-slate-900">
                    ٪{toPersianDigits(agent.approvedDurationPercent)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {toPersianDigits(agent.approvedDurationCount)} تماس در بازه مصوب
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-semibold mb-1">پایداری عملکرد (KPI 6)</div>
                  <div className="text-base font-black text-slate-900">
                    ٪{toPersianDigits(agent.stabilityAverage)}
                  </div>
                  <div className="text-[11px] text-cyan-600 font-bold mt-0.5">
                    میانگین امتیاز: {toPersianDigits(agent.kpiBreakdown.kpi6)} از ۱۰
                  </div>
                </div>
              </div>

              {/* 6 KPI Cards Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>تفکیک نمرات ۶ شاخص کلیدی عملکرد روزانه (مجموع ۱۰۰ امتیاز)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* KPI 1 */}
                  <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">شاخص ۱: مدت مکالمه موثر</span>
                      <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        {toPersianDigits(agent.kpiBreakdown.kpi1)} / ۳۰ امتیاز
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      تارگت روزانه: ۱۲۰ دقیقه (شنبه تا چهارشنبه) یا ۹۰ دقیقه (پنج‌شنبه). سقف شاخص ۳۰ نمره است.
                    </p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full" style={{ width: `${(agent.kpiBreakdown.kpi1 / 30) * 100}%` }} />
                    </div>
                  </div>

                  {/* KPI 2 */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">شاخص ۲: نرخ تماس‌های موفق</span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {toPersianDigits(agent.kpiBreakdown.kpi2)} / ۲۰ امتیاز
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      آستانه‌ها: &lt;۴۰٪ (۰)، ۴۰-۴۵٪ (۸)، ۴۵-۵۰٪ (۱۱)، ۵۰-۵۵٪ (۱۵)، ۵۵٪+ (۲۰ امتیاز).
                    </p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full" style={{ width: `${(agent.kpiBreakdown.kpi2 / 20) * 100}%` }} />
                    </div>
                  </div>

                  {/* KPI 3 */}
                  <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">شاخص ۳: حجم کل تماس‌ها</span>
                      <span className="text-xs font-black text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                        {toPersianDigits(agent.kpiBreakdown.kpi3)} / ۱۰ امتیاز
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      تارگت روزانه: ۱۴۵ تماس (شنبه تا چهارشنبه) یا ۱۱۰ تماس (پنج‌شنبه).
                    </p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-600 h-full" style={{ width: `${(agent.kpiBreakdown.kpi3 / 10) * 100}%` }} />
                    </div>
                  </div>

                  {/* KPI 4 */}
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">شاخص ۴: تعداد مکالمات موفق</span>
                      <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                        {toPersianDigits(agent.kpiBreakdown.kpi4)} / ۱۵ امتیاز
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      شنبه تا چهارشنبه: &lt;۵۰ (۰)، ۵۰-۶۵ (۵)، ۶۶-۷۹ (۸)، ۸۰+ (۱۵ امتیاز کامل).
                    </p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full" style={{ width: `${(agent.kpiBreakdown.kpi4 / 15) * 100}%` }} />
                    </div>
                  </div>

                  {/* KPI 5 */}
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">شاخص ۵: مدت مجاز مکالمه</span>
                      <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                        {toPersianDigits(agent.kpiBreakdown.kpi5)} / ۱۵ امتیاز
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      بازه مصوب ۲ تا ۳:۳۰ دقیقه: &lt;۳۰٪ (۰)، ۳۰-۵۰٪ (۳)، ۵۰-۸۰٪ (۵)، ۸۰٪+ (۱۵ امتیاز).
                    </p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full" style={{ width: `${(agent.kpiBreakdown.kpi5 / 15) * 100}%` }} />
                    </div>
                  </div>

                  {/* KPI 6 */}
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">شاخص ۶: پایداری عملکرد</span>
                      <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        {toPersianDigits(agent.kpiBreakdown.kpi6)} / ۱۰ امتیاز
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                      توزیع متوازن در شیفت‌ها: &lt;۵۰٪ (۰)، ۵۰-۶۰٪ (۲)، ۶۰-۷۰٪ (۳)، ۷۰-۸۰٪ (۴)، ۸۰-۹۰٪ (۶)، ۹۰٪+ (۱۰).
                    </p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-600 h-full" style={{ width: `${(agent.kpiBreakdown.kpi6 / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonus Progress Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-teal-50/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        وضعیت پاداش مکالمات مازاد (مستقل از ۱۰۰ امتیاز رسمی)
                      </h4>
                      <p className="text-[11px] text-slate-600">
                        هر ۳ دقیقه مکالمه موثر فراتر از تارگت روزانه = ۱ امتیاز پاداش
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-xl font-black text-emerald-700">
                      {toPersianDigits(agent.cumulativeBonusPoints)}
                    </span>
                    <span className="text-xs text-slate-500 mr-1">/ ۵۰۰ امتیاز پاداش</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${agent.rewardProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>پیشرفت به سمت آستانه پاداش نقدی: ٪{toPersianDigits(agent.rewardProgressPercent)}</span>
                  <span>{toPersianDigits(Math.max(0, 500 - agent.cumulativeBonusPoints))} امتیاز تا دریافت جایزه</span>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Daily Breakdown Table */}
          {activeTab === 'history' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">تاریخ</th>
                    <th className="py-2.5 px-3">نوع روز</th>
                    <th className="py-2.5 px-3">کل تماس</th>
                    <th className="py-2.5 px-3">موفق</th>
                    <th className="py-2.5 px-3">نرخ موفقیت</th>
                    <th className="py-2.5 px-3">مدت مکالمه</th>
                    <th className="py-2.5 px-3">پایداری (KPI 6)</th>
                    <th className="py-2.5 px-3">امتیاز روز</th>
                    <th className="py-2.5 px-3">پاداش روز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agent.dailySummaries.map((day, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {formatJalaliShort(new Date(day.dateStr))} ({day.dateStr})
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {day.dayType === 'thursday' ? 'پنج‌شنبه' : 'شنبه-چهارشنبه'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">{toPersianDigits(day.totalCalls)}</td>
                      <td className="py-3 px-3 text-slate-900 font-bold">{toPersianDigits(day.successfulCalls)}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-700">
                          ٪{toPersianDigits(day.kpi.kpi2_ratePercent)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-800">{formatDurationPersian(day.totalDurationSeconds)}</td>
                      <td className="py-3 px-3 text-cyan-700 font-semibold">
                        ٪{toPersianDigits(day.kpi.kpi6_stabilityPercent)} ({toPersianDigits(day.kpi.kpi6_score)} نمره)
                      </td>
                      <td className="py-3 px-3 font-black text-slate-900">
                        {toPersianDigits(day.kpi.officialCappedScore)} / ۱۰۰
                      </td>
                      <td className="py-3 px-3 text-emerald-700 font-bold">
                        +{toPersianDigits(day.kpi.dailyBonusPoints)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Calls Log Table with Search & Privacy Masking */}
          {activeTab === 'calls' && (
            <div className="space-y-3">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="جستجوی شماره مخاطب..."
                    value={callSearch}
                    onChange={(e) => {
                      setCallSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg py-1.5 pr-8 pl-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={() => { setCallFilter('all'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg transition ${callFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    همه ({toPersianDigits(agentCalls.length)})
                  </button>
                  <button
                    onClick={() => { setCallFilter('successful'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg transition ${callFilter === 'successful' ? 'bg-emerald-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    موفق ({toPersianDigits(agent.successfulCalls)})
                  </button>
                  <button
                    onClick={() => { setCallFilter('approved'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg transition ${callFilter === 'approved' ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    در بازه مجاز ({toPersianDigits(agent.approvedDurationCount)})
                  </button>
                  <button
                    onClick={() => { setCallFilter('exceeding'); setCurrentPage(1); }}
                    className={`px-2.5 py-1 rounded-lg transition ${callFilter === 'exceeding' ? 'bg-rose-600 text-white font-bold' : 'bg-white text-slate-600 border border-slate-200'}`}
                  >
                    بیش از ۳:۳۰ ({toPersianDigits(agent.exceedingDurationCount)})
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-2.5 px-3">زمان شروع</th>
                      <th className="py-2.5 px-3">مبدا (کارشناس)</th>
                      <th className="py-2.5 px-3">مقصد (مشتری - ماسک‌شده)</th>
                      <th className="py-2.5 px-3">بازه شیفت</th>
                      <th className="py-2.5 px-3">مدت مکالمه</th>
                      <th className="py-2.5 px-3">وضعیت پاسخ</th>
                      <th className="py-2.5 px-3">انطباق استاندارد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedCalls.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          هیچ تماسی با این فیلتر یافت نشد.
                        </td>
                      </tr>
                    ) : (
                      paginatedCalls.map((call, idx) => {
                        const inApproved = call.isSuccessful && call.durationSeconds >= 120 && call.durationSeconds <= 210;
                        const isExceeding = call.isSuccessful && call.durationSeconds > 210;

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-slate-800 font-mono">
                              {formatTimePersian(call.startTime)} - {formatJalaliShort(call.startTime)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              داخلی {toPersianDigits(call.source)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-800">
                              {maskPhoneNumber(call.destination)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {toPersianDigits(call.intervalSlot)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 font-mono">
                              {formatTimeDigitalPersian(call.durationSeconds)}
                            </td>
                            <td className="py-2.5 px-3">
                              {call.isSuccessful ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                  پاسخ داده شده
                                </span>
                              ) : (
                                <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                  ناموفق / بی‌پاسخ
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {inApproved ? (
                                <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded text-[10px]">
                                  ✓ در محدوده مجاز
                                </span>
                              ) : isExceeding ? (
                                <span className="text-amber-700 font-bold bg-amber-100/70 px-2 py-0.5 rounded text-[10px]">
                                  بیش از ۳:۳۰ دقیقه
                                </span>
                              ) : call.isSuccessful ? (
                                <span className="text-slate-500 text-[10px]">
                                  کوتاه‌تر از ۲ دقیقه
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>
                    صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)} ({toPersianDigits(filteredCalls.length)} رکورد)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className="p-1 rounded bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className="p-1 rounded bg-slate-100 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition cursor-pointer"
          >
            بستن کارنامه
          </button>
        </div>
      </div>
    </div>
  );
};
