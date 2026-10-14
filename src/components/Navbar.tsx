import React from 'react';
import { 
  PhoneCall, 
  Upload, 
  Settings, 
  CheckCircle2, 
  FileSpreadsheet, 
  Download, 
  HelpCircle,
  Database,
  Sparkles
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

interface NavbarProps {
  isSampleData: boolean;
  fileName?: string;
  totalCallsCount: number;
  activeAgentsCount: number;
  onOpenImport: () => void;
  onOpenSettings: () => void;
  onOpenTests: () => void;
  onOpenExport: () => void;
  onLoadSampleData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSampleData,
  fileName,
  totalCallsCount,
  activeAgentsCount,
  onOpenImport,
  onOpenSettings,
  onOpenTests,
  onOpenExport,
  onLoadSampleData
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  سامانه پایش عملکرد مرکز تماس
                </h1>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  نسخه سازمانی
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                ارزیابی هوشمند شاخص‌های کلیدی عملکرد (KPI)، پایداری و پاداش کارشناسان فروش
              </p>
            </div>
          </div>

          {/* Data Source Badge */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs">
            {isSampleData ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-medium">داده‌های نمونه فعال است</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">
                  {toPersianDigits(totalCallsCount)} تماس ({toPersianDigits(activeAgentsCount)} کارشناس)
                </span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-400 font-medium">فایل اکسل اختصاصی:</span>
                <span className="text-slate-200 font-medium truncate max-w-[150px]">{fileName || 'فایل بارگذاری‌شده'}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">{toPersianDigits(totalCallsCount)} رکورد</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isSampleData && (
              <button
                onClick={onLoadSampleData}
                title="بارگذاری مجدد داده‌های نمونه"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                داده‌های نمونه
              </button>
            )}

            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-600/30 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>واردسازی اکسل / CSV</span>
            </button>

            <button
              onClick={onOpenExport}
              title="خروجی گزارش"
              className="flex items-center justify-center p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenTests}
              title="بررسی صحت محاسبات و آزمون فرمول‌ها"
              className="flex items-center justify-center p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={onOpenSettings}
              title="تنظیمات سامانه و قوانین"
              className="flex items-center justify-center p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
