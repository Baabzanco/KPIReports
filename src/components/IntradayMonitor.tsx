import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  AgentAggregateSummary, 
  CallRecord, 
  DayOfWeekType 
} from '../types/telephony';
import { 
  toPersianDigits, 
  formatPersianNumber, 
  formatDurationPersian, 
  formatJalaliShort,
  getScheduledIntervals,
  getDayTypeNamePersian
} from '../utils/persianDate';

interface IntradayMonitorProps {
  agents: AgentAggregateSummary[];
  calls: CallRecord[];
  selectedDate: string; // 'all' or specific YYYY-MM-DD
  availableDates: string[];
  onSelectAgent: (agentId: string) => void;
}

export const IntradayMonitor: React.FC<IntradayMonitorProps> = ({
  agents,
  calls,
  selectedDate,
  availableDates,
  onSelectAgent
}) => {
  // If selectedDate is 'all', pick the latest available date for intraday view
  const activeDate = selectedDate !== 'all' ? selectedDate : (availableDates[availableDates.length - 1] || '');
  const [currentDateStr, setCurrentDateStr] = useState<string>(activeDate);

  // Sync if selectedDate changes
  React.useEffect(() => {
    if (selectedDate !== 'all') {
      setCurrentDateStr(selectedDate);
    }
  }, [selectedDate]);

  const dateCalls = calls.filter(c => c.dateStr === currentDateStr);
  const sampleCall = dateCalls[0];
  const dayType: DayOfWeekType = sampleCall ? sampleCall.dayType : 'sat_to_wed';
  const intervals = getScheduledIntervals(dayType);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              پایش درون‌روزی و عملکرد شیفت‌های ۲ ساعته
            </h2>
            <p className="text-xs text-slate-500">
              ارزیابی پیوسته بهره‌وری در فواصل کاری مصوب ({getDayTypeNamePersian(dayType)})
            </p>
          </div>
        </div>

        {/* Date Selector for Intraday View */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            روز پایش:
          </span>
          <select
            value={currentDateStr}
            onChange={(e) => setCurrentDateStr(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 cursor-pointer"
          >
            {availableDates.map(date => {
              const d = new Date(date);
              return (
                <option key={date} value={date}>
                  {formatJalaliShort(d)} ({date})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Intraday Targets Notice */}
      <div className="bg-cyan-50/60 border border-cyan-100 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-xs text-cyan-900">
        <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">ضابطه پایش ساعتی:</span> تارگت هر بازه ۲ ساعته برابر با <span className="font-bold text-cyan-800">۲۰ تماس موفق</span> است. ثبات و توزیع متوازن مکالمات در سراسر روز ملاک ارزیابی شاخص پایداری (KPI 6) می‌باشد.
        </div>
      </div>

      {/* Agents Shift Grid */}
      <div className="space-y-4">
        {agents.map(agent => {
          const daySummary = agent.dailySummaries.find(d => d.dateStr === currentDateStr);
          const agentDateCalls = dateCalls.filter(c => c.agentId === agent.agentId);

          return (
            <div
              key={agent.agentId}
              className="border border-slate-200/90 rounded-xl p-4 hover:border-indigo-300 transition bg-slate-50/30"
            >
              {/* Agent Title & Score */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200/60 gap-2">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectAgent(agent.agentId)}>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {agent.agentName.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 transition">
                      {agent.agentName}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      داخلی: {toPersianDigits(agent.agentId)} | کل تماس‌های این روز: {toPersianDigits(agentDateCalls.length)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {daySummary ? (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">امتیاز روز:</span>
                        <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {toPersianDigits(daySummary.kpi.officialCappedScore)} / ۱۰۰
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">پایداری (KPI 6):</span>
                        <span className="font-bold text-cyan-700">
                          ٪{toPersianDigits(daySummary.kpi.kpi6_stabilityPercent)}
                        </span>
                      </div>
                      {daySummary.kpi.dailyBonusPoints > 0 && (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                          +{toPersianDigits(daySummary.kpi.dailyBonusPoints)} امتیاز پاداش
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">اطلاعاتی برای این روز ثبت نشده است</span>
                  )}
                </div>
              </div>

              {/* Intervals Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {intervals.map(slot => {
                  const slotCalls = agentDateCalls.filter(c => c.intervalSlot === slot);
                  const successfulCalls = slotCalls.filter(c => c.isSuccessful);
                  const totalDuration = successfulCalls.reduce((s, c) => s + c.durationSeconds, 0);
                  const isMet = successfulCalls.length >= 20;

                  return (
                    <div
                      key={slot}
                      className={`p-3 rounded-lg border transition ${
                        isMet
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : successfulCalls.length >= 10
                          ? 'bg-amber-50/30 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-slate-700 dir-ltr font-mono">
                          {toPersianDigits(slot)}
                        </span>
                        {isMet ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>تارگت محقق شد</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500">
                            تارگت: ۲۰ تماس
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between mt-2">
                        <div>
                          <div className="text-lg font-black text-slate-900">
                            {toPersianDigits(successfulCalls.length)}
                            <span className="text-[10px] font-normal text-slate-500 mr-1">
                              / {toPersianDigits(slotCalls.length)} تماس
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            موفق: {toPersianDigits(slotCalls.length > 0 ? Math.round((successfulCalls.length / slotCalls.length) * 100) : 0)}٪
                          </div>
                        </div>

                        <div className="text-left">
                          <div className="text-xs font-semibold text-slate-800">
                            {formatDurationPersian(totalDuration)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            مدت مکالمه شیفت
                          </div>
                        </div>
                      </div>

                      {/* Mini Progress Bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            isMet ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, (successfulCalls.length / 20) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
