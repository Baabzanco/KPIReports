import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  RefreshCw, 
  Layers
} from 'lucide-react';
import { runKPITestSuite, TestCaseResult } from '../utils/kpiEngine.test';
import { toPersianDigits } from '../utils/persianDate';

interface TestResultsModalProps {
  onClose: () => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({ onClose }) => {
  const [results, setResults] = useState<TestCaseResult[]>(() => runKPITestSuite());

  const handleRerun = () => {
    setResults(runKPITestSuite());
  };

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  // Group by suite
  const suiteMap = new Map<string, TestCaseResult[]>();
  results.forEach(r => {
    if (!suiteMap.has(r.suite)) suiteMap.set(r.suite, []);
    suiteMap.get(r.suite)!.push(r);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                آزمون خودکار صحت محاسبات و فرمول‌های KPI
              </h2>
              <p className="text-xs text-slate-400">
                بررسی مرزهای شرطی، تارگت‌های پنج‌شنبه، پایداری، بازه مجاز و سیستم پاداش
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

        {/* Stats Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{toPersianDigits(passedCount)} آزمون موفق</span>
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                <XCircle className="w-3.5 h-3.5" />
                <span>{toPersianDigits(failedCount)} آزمون ناموفق</span>
              </span>
            )}
            <span className="text-slate-500 font-normal">
              کل تست‌ها: {toPersianDigits(results.length)} مورد
            </span>
          </div>

          <button
            onClick={handleRerun}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>اجرای مجدد آزمون‌ها</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {Array.from(suiteMap.entries()).map(([suiteName, tests]) => (
            <div key={suiteName} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>مجموعه آزمون: {suiteName}</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {toPersianDigits(tests.length)} تست
                </span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {tests.map((test, idx) => (
                  <div key={idx} className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/50">
                    <div className="flex items-start gap-2">
                      {test.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium text-slate-800">{test.name}</div>
                        {test.notes && <div className="text-[11px] text-slate-400 mt-0.5">{test.notes}</div>}
                      </div>
                    </div>

                    <div className="text-left font-mono text-[11px] shrink-0 text-slate-600">
                      خروجی: {toPersianDigits(String(test.actual))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
