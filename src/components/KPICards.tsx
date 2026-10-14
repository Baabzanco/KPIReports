import React from 'react';
import { 
  Phone, 
  PhoneIncoming, 
  CheckCircle, 
  Clock, 
  Timer, 
  ShieldCheck, 
  Award, 
  TrendingUp,
  Info
} from 'lucide-react';
import { TeamAggregateMetrics } from '../types/telephony';
import { 
  toPersianDigits, 
  formatPersianNumber, 
  formatDurationPersian, 
  formatTimeDigitalPersian 
} from '../utils/persianDate';

interface KPICardsProps {
  metrics: TeamAggregateMetrics;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Calls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">کل تماس‌های ارزیابی‌شده</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {formatPersianNumber(metrics.totalCalls)}
          </span>
          <span className="text-xs font-medium text-slate-500">تماس</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>شامل تماس‌های خروجی و ورودی</span>
          <span className="text-blue-600 font-semibold">{toPersianDigits(metrics.activeDaysCount)} روز کاری</span>
        </div>
      </div>

      {/* 2. Successful Calls */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">تماس‌های موفق پاسخ‌داده‌شده</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PhoneIncoming className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {formatPersianNumber(metrics.successfulCalls)}
          </span>
          <span className="text-xs font-medium text-slate-500">مکالمه موفق</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>ناموفق یا بی‌پاسخ:</span>
          <span className="text-slate-700 font-semibold">
            {formatPersianNumber(metrics.totalCalls - metrics.successfulCalls)} تماس
          </span>
        </div>
      </div>

      {/* 3. Success Rate */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">نرخ موفقیت تماس (KPI 2)</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            ٪{toPersianDigits(metrics.successRate)}
          </span>
          <span className="text-xs font-medium text-slate-500">میانگین</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>آستانه امتیاز کامل: ٪۵۵</span>
          <span className={`font-semibold ${metrics.successRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {metrics.successRate >= 55 ? '۲۰ امتیاز کامل' : metrics.successRate >= 50 ? '۱۵ امتیاز' : 'نیازمند بهبود'}
          </span>
        </div>
      </div>

      {/* 4. Total Effective Conversation Duration */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">مجموع مدت مکالمات موثر</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xl font-black text-slate-900 tracking-tight">
            {formatDurationPersian(metrics.totalDurationSeconds)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>معادل دیجیتال:</span>
          <span className="text-slate-800 font-mono font-semibold">
            {formatTimeDigitalPersian(metrics.totalDurationSeconds)}
          </span>
        </div>
      </div>

      {/* 5. Average Duration per Successful Call */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">میانگین هر مکالمه موفق</span>
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <Timer className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {formatDurationPersian(metrics.averageDurationPerSuccess)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>بازه هدف استاندارد:</span>
          <span className="text-indigo-600 font-semibold">۲ الی ۳:۳۰ دقیقه</span>
        </div>
      </div>

      {/* 6. Approved Duration Compliance (KPI 5) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">انطباق با مدت مجاز (KPI 5)</span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            ٪{toPersianDigits(metrics.approvedDurationPercent)}
          </span>
          <span className="text-xs font-medium text-slate-500">
            ({toPersianDigits(metrics.approvedDurationCount)} تماس)
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>فراتر از ۳:۳۰ دقیقه:</span>
          <span className="text-rose-600 font-semibold">
            {toPersianDigits(metrics.exceedingDurationCount)} تماس
          </span>
        </div>
      </div>

      {/* 7. Target Achievers */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">تحقق تارگت مدت مکالمه</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {toPersianDigits(metrics.agentsMeetingDurationTargetCount)}
          </span>
          <span className="text-xs font-medium text-slate-500">
            از {toPersianDigits(metrics.totalActiveAgents)} کارشناس
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>تارگت روزانه:</span>
          <span className="text-slate-800 font-medium">۱۲۰ دقیقه (شنبه-چهارشنبه)</span>
        </div>
      </div>

      {/* 8. Average Daily Score */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500">میانگین امتیاز عملکرد تیم</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {toPersianDigits(metrics.averageTeamScore)}
          </span>
          <span className="text-xs font-medium text-slate-500">از ۱۰۰ امتیاز</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>مجموع پاداش تجمعی:</span>
          <span className="text-emerald-600 font-bold">
            {toPersianDigits(metrics.totalCumulativeBonusPoints)} امتیاز پاداش
          </span>
        </div>
      </div>
    </div>
  );
};
