import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import { AgentAggregateSummary, CallRecord, SystemConfig } from '../types/telephony';
import { 
  toPersianDigits, 
  formatJalaliShort, 
  formatTimePersian, 
  maskPhoneNumber,
  formatDurationPersian
} from '../utils/persianDate';
import { getCategoryLabelPersian } from '../utils/kpiEngine';

interface ExportModalProps {
  agents: AgentAggregateSummary[];
  calls: CallRecord[];
  config: SystemConfig;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  agents,
  calls,
  config,
  onClose
}) => {
  const [exportType, setExportType] = useState<'agents_summary' | 'calls_detail'>('agents_summary');
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [includeMasking, setIncludeMasking] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = () => {
    setIsExporting(true);

    try {
      if (exportType === 'agents_summary') {
        const rows = agents.map((a, idx) => ({
          'رتبه': idx + 1,
          'شناسه کارشناس': a.agentId,
          'نام کارشناس': a.agentName,
          'تعداد کل تماس‌ها': a.totalCalls,
          'تماس‌های موفق': a.successfulCalls,
          'نرخ موفقیت (٪)': a.successRate,
          'مدت کل مکالمات موثر': formatDurationPersian(a.totalDurationSeconds),
          'امتیاز کل KPI (از ۱۰۰)': a.averageDailyScore,
          'سطح عملکرد': getCategoryLabelPersian(a.category),
          'پاداش تجمعی (امتیاز)': a.cumulativeBonusPoints,
          'انطباق با بازه مجاز (٪)': a.approvedDurationPercent,
          'پایداری عملکرد (٪)': a.stabilityAverage,
        }));

        downloadData(rows, `گزارش_رتبه‌بندی_کارشناسان_${Date.now()}`);
      } else {
        const rows = calls.map((c, idx) => ({
          'ردیف': idx + 1,
          'شناسه کارشناس': c.agentId,
          'نام کارشناس': c.agentName,
          'تاریخ شروع': formatJalaliShort(c.startTime),
          'ساعت شروع': formatTimePersian(c.startTime),
          'مبدا': c.source,
          'مقصد': includeMasking ? maskPhoneNumber(c.destination) : c.destination,
          'نوع تماس': c.callType === 'outbound' ? 'خروجی' : 'ورودی',
          'وضعیت پاسخ': c.isSuccessful ? 'پاسخ داده شده' : 'ناموفق',
          'مدت مکالمه (ثانیه)': c.durationSeconds,
          'مدت مکالمه (خوانا)': formatDurationPersian(c.durationSeconds),
          'بازه شیفت': c.intervalSlot,
        }));

        downloadData(rows, `ریز_رکوردهای_تماس_${Date.now()}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  const downloadData = (data: any[], fileName: string) => {
    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'گزارش');

      if (exportFormat === 'csv') {
        XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
      } else {
        XLSX.writeFile(workbook, `${fileName}.xlsx`, { bookType: 'xlsx' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                خروجی گرفتن از اطلاعات گزارش
              </h2>
              <p className="text-xs text-slate-400">
                دریافت خلاصه ارزیابی یا ریز مکالمات فیلترشده در فرمت‌های مختلف
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
        <div className="p-6 space-y-4 text-xs">
          {/* Export Type */}
          <div>
            <label className="font-bold text-slate-800 block mb-2">محدوده گزارش خروجی:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportType('agents_summary')}
                className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                  exportType === 'agents_summary'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div>خلاصه عملکرد کارشناسان</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  شامل نمرات ۶ شاخص و پاداش ({toPersianDigits(agents.length)} کارشناس)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportType('calls_detail')}
                className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                  exportType === 'calls_detail'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div>ریز رکوردهای تماس‌ها</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  شامل زمان و مدت مکالمات ({toPersianDigits(calls.length)} رکورد)
                </div>
              </button>
            </div>
          </div>

          {/* Format selection */}
          <div>
            <label className="font-bold text-slate-800 block mb-2">فرمت خروجی فایل:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`p-2.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                  exportFormat === 'xlsx'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                اکسل (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-2.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                فایل CSV (UTF-8)
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`p-2.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                  exportFormat === 'json'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                داده JSON
              </button>
            </div>
          </div>

          {/* Privacy Toggle */}
          {exportType === 'calls_detail' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">ماسک کردن شماره‌های مشتری</span>
                <span className="text-[11px] text-slate-500">حفظ محرمانگی شماره تلفن‌های مقصد در فایل خروجی</span>
              </div>
              <input
                type="checkbox"
                checked={includeMasking}
                onChange={(e) => setIncludeMasking(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>
          )}
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
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل گزارش</span>
          </button>
        </div>
      </div>
    </div>
  );
};
