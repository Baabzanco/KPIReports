import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Check, 
  AlertTriangle, 
  Sliders, 
  ShieldCheck, 
  Award,
  HelpCircle
} from 'lucide-react';
import { SystemConfig } from '../types/telephony';
import { toPersianDigits } from '../utils/persianDate';

interface SettingsModalProps {
  config: SystemConfig;
  onSaveConfig: (newConfig: SystemConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig,
  onClose
}) => {
  const [form, setForm] = useState<SystemConfig>({ ...config });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSave = () => {
    onSaveConfig(form);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                تنظیمات سیستم و رفع ابهام قوانین محاسباتی
              </h2>
              <p className="text-xs text-slate-400">
                پیکربندی مرزهای شاخص‌ها، سقف نمرات و آستانه پاداش
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* 1. Score 60 Boundary Config */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <label className="font-bold text-slate-800">
                تعیین تکلیف مرز امتیاز دقیقاً ۶۰ (رفع ابهام صورت‌مسئله):
              </label>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              در مستندات اولیه، نمره بین ۶۱ تا ۸۰ «عملکرد نامطلوب» و کمتر از ۶۰ «بسیار ضعیف» تعیین شده و نمره ۶۰ بلاتکلیف مانده بود. ضابطه را انتخاب کنید:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, score60Boundary: 'substandard' })}
                className={`p-2.5 rounded-lg border text-right font-medium transition cursor-pointer ${
                  form.score60Boundary === 'substandard'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="font-bold">عملکرد نامطلوب (پیش‌فرض)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">امتیاز ۶۰ در رده نامطلوب قرار می‌گیرد</div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, score60Boundary: 'critical' })}
                className={`p-2.5 rounded-lg border text-right font-medium transition cursor-pointer ${
                  form.score60Boundary === 'critical'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div className="font-bold">بسیار ضعیف (سخت‌گیرانه)</div>
                <div className="text-[10px] text-slate-500 mt-0.5">امتیاز ۶۰ در رده بسیار ضعیف قرار می‌گیرد</div>
              </button>
            </div>
          </div>

          {/* 2. KPI 3 Over-target behavior */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                سقف امتیاز شاخص ۳ (تعداد کل تماس‌ها):
              </label>
              <input
                type="checkbox"
                checked={form.kpi3AllowOverTargetBonus}
                onChange={(e) => setForm({ ...form, kpi3AllowOverTargetBonus: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              وزن رسمی شاخص ۳ برابر با ۱۰ امتیاز است، اما مستندات به پاداش تا ۱۵ نمره اشاره داشت. در صورت غیرفعال بودن (حالت استاندارد)، سقف ۱۰ امتیاز جهت عدم تجاوز نمره کل از ۱۰۰ حفظ می‌شود.
            </p>
          </div>

          {/* 3. Bonus Milestone Threshold */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">
                آستانه پاداش نهایی (امتیاز تارگت جایزه):
              </label>
              <input
                type="number"
                min={100}
                max={2000}
                step={50}
                value={form.bonusRewardThreshold}
                onChange={(e) => setForm({ ...form, bonusRewardThreshold: parseInt(e.target.value, 10) || 500 })}
                className="w-24 text-left font-mono bg-white border border-slate-300 rounded px-2 py-1 text-slate-800"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              پیش‌فرض سیستم ۵۰۰ امتیاز پاداش تجمعی است.
            </p>
          </div>

          {/* 4. Privacy and Deduplication */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">حذف خودکار رکوردهای تکراری</span>
                <span className="text-[11px] text-slate-500">جلوگیری از دوبار محاسبه تماس‌های همزمان با مبدا و مقصد یکسان</span>
              </div>
              <input
                type="checkbox"
                checked={form.deduplicateRecords}
                onChange={(e) => setForm({ ...form, deduplicateRecords: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
              <div>
                <span className="font-bold text-slate-800 block">ماسک کردن شماره تلفن‌های مشتریان</span>
                <span className="text-[11px] text-slate-500">حفظ محرمانگی با نمایش ستاره‌ای (مثال: ۰۹۱۲***۶۷۸۹)</span>
              </div>
              <input
                type="checkbox"
                checked={form.maskPhoneNumbers}
                onChange={(e) => setForm({ ...form, maskPhoneNumbers: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : null}
            <span>{isSaved ? 'تنظیمات ذخیره شد' : 'ذخیره و اعمال تنظیمات'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
