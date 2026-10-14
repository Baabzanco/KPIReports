import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Sliders, 
  ArrowLeft, 
  FileCheck, 
  Shield, 
  Eye, 
  RefreshCw, 
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  ColumnMappingConfig, 
  ImportValidationResult, 
  CallRecord,
  SystemConfig 
} from '../types/telephony';
import { 
  parseRawFile, 
  getSheetData, 
  transformAndValidateRecords,
  ParsedWorkbookData
} from '../utils/fileImporter';
import { toPersianDigits, formatPersianNumber } from '../utils/persianDate';

interface ImportModalProps {
  systemConfig: SystemConfig;
  onImportComplete: (records: CallRecord[], validation: ImportValidationResult, fileName: string) => void;
  onLoadSampleData: () => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  systemConfig,
  onImportComplete,
  onLoadSampleData,
  onClose
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'validation'>('upload');
  const [parsedData, setParsedData] = useState<ParsedWorkbookData | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [mapping, setMapping] = useState<ColumnMappingConfig | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [processedRecords, setProcessedRecords] = useState<CallRecord[]>([]);
  const [previewPage, setPreviewPage] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setIsLoading(true);
    setErrorMessage('');
    setCurrentFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const data = parseRawFile(buffer, file.name);

        setParsedData(data);
        setActiveSheet(data.activeSheet);
        setMapping(data.detectedMapping);
        setStep('mapping');
        setIsLoading(false);
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(`خطا در بازخوانی فایل اکسل یا CSV: ${err.message || 'فرمت فایل پشتیبانی نمی‌شود'}`);
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      setErrorMessage('خطا در خواندن فایل از روی حافظه دستگاه.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (sheetName: string) => {
    if (!parsedData) return;
    setActiveSheet(sheetName);
    const { headers, rawRows } = getSheetData(parsedData.workbook, sheetName);
    setParsedData({
      ...parsedData,
      activeSheet: sheetName,
      headers,
      rawRows
    });
  };

  const runValidation = () => {
    if (!parsedData || !mapping) return;
    setIsLoading(true);

    try {
      const { records, validation } = transformAndValidateRecords(
        parsedData.rawRows,
        mapping,
        systemConfig,
        currentFileName,
        activeSheet
      );

      setProcessedRecords(records);
      setValidationResult(validation);
      setStep('validation');
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(`خطا در اعتبارسنجی رکوردها: ${err.message}`);
    }
  };

  const handleConfirmImport = () => {
    if (processedRecords.length > 0 && validationResult) {
      onImportComplete(processedRecords, validationResult, currentFileName);
      onClose();
    }
  };

  // Download rejected rows error report as CSV with UTF-8 BOM
  const downloadErrorsCsv = () => {
    if (!validationResult || validationResult.rejectedDetails.length === 0) return;

    const errorRows = validationResult.rejectedDetails.map(err => ({
      'شماره سطر در اکسل': err.rowNumber,
      'نام ستون': err.columnName,
      'مقدار خام': err.originalValue,
      'علت رد سطر': err.reason
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'سطور نامعتبر');
    XLSX.writeFile(workbook, `گزارش_سطور_ردشده_${Date.now()}.csv`, { bookType: 'csv' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                مرکز واردسازی و نگاشت فایل گزارش تماس (Excel / CSV)
              </h2>
              <p className="text-xs text-slate-400">
                پردازش کامل تمامی سطور (بیش از ۱۴٬۰۰۰ سطر) با پشتیبانی تاریخ‌های جلالی و فرمت «۱۵:۰۵ - ۱۴۰۵/۰۷/۲۱»
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

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-6">
            <span className={`flex items-center gap-1.5 ${step === 'upload' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>۱</span>
              انتخاب فایل
            </span>
            <span className="text-slate-300">›</span>
            <span className={`flex items-center gap-1.5 ${step === 'mapping' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'mapping' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>۲</span>
              نگاشت ستون‌ها و شیت
            </span>
            <span className="text-slate-300">›</span>
            <span className={`flex items-center gap-1.5 ${step === 'validation' ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'validation' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>۳</span>
              اعتبارسنجی و تایید
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>پردازش ۱۰۰٪ محلی در مرورگر (بدون نشت اطلاعات)</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-10 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-110 flex items-center justify-center mx-auto mb-4 transition">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  فایل اکسل (.xlsx یا .xls) یا گزارش CSV را اینجا بکشید و رها کنید
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  پشتیبانی کامل از فایل‌های حجیم گزارش مرکز تماس (حاوی بیش از ۱۴٬۰۰۰ ردیف)
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition">
                  <Upload className="w-4 h-4" />
                  <span>انتخاب فایل گزارش</span>
                </div>
              </div>

              {/* Sample Data Fast Option */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      هنوز فایل اکسل اختصاصی آماده نکرده‌اید؟
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      می‌توانید داده‌های نمونه پیش‌فرض (شامل ۶ روز هفته و ۷ کارشناس مجاز) را مشاهده کنید.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onLoadSampleData();
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition shrink-0 cursor-pointer"
                >
                  بارگذاری داده‌های نمونه
                </button>
              </div>

              {/* Format Compatibility Guide */}
              <div className="text-xs text-slate-600 bg-slate-100/60 p-4 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                  <span>فرمت‌های تاریخ و زمان مورد شناسایی:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  سامانه تمامی قالب‌های زمانی از جمله <strong>«۱۵:۰۵ - ۱۴۰۵/۰۷/۲۱»</strong> (ساعت قبل از خط تیره، تاریخ جلالی بعد از خط تیره)، ارقام فارسی و انگلیسی، و فاصله‌های خالی را به صورت خودکار شناسایی و با دقت ۱۰۰٪ پردازش می‌نماید.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 'mapping' && parsedData && mapping && (
            <div className="space-y-5">
              {/* Dataset Scope Notification */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-indigo-950">
                    تعداد کل سطور شناسایی‌شده در فایل: {formatPersianNumber(parsedData.rawRows.length)} سطر داده
                  </span>
                </div>
                <span className="text-[11px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded font-medium">
                  تمامی سطور در محاسبات وارد خواهند شد
                </span>
              </div>

              {/* Sheet selector if multi-sheet */}
              {parsedData.sheetNames.length > 1 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">انتخاب کاربرگ (Sheet):</span>
                  <select
                    value={activeSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded-lg py-1 px-3"
                  >
                    {parsedData.sheetNames.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Column Mapping Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ستون مبدا تماس (Caller / Source):
                  </label>
                  <select
                    value={mapping.sourceCol}
                    onChange={(e) => setMapping({ ...mapping, sourceCol: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="">-- انتخاب ستون --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Destination */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ستون مقصد تماس (Callee / Customer):
                  </label>
                  <select
                    value={mapping.destinationCol}
                    onChange={(e) => setMapping({ ...mapping, destinationCol: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="">-- انتخاب ستون --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Start Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ستون تاریخ و زمان شروع: *
                  </label>
                  <select
                    value={mapping.startTimeCol}
                    onChange={(e) => setMapping({ ...mapping, startTimeCol: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="">-- انتخاب ستون (اجباری) --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Duration */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ستون طول تماس (مدت مکالمه): *
                  </label>
                  <select
                    value={mapping.durationCol}
                    onChange={(e) => setMapping({ ...mapping, durationCol: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="">-- انتخاب ستون (اجباری) --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Answer Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ستون وضعیت پاسخ تماس: *
                  </label>
                  <select
                    value={mapping.answerStatusCol}
                    onChange={(e) => setMapping({ ...mapping, answerStatusCol: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="">-- انتخاب ستون (اجباری) --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* 6. Call Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ستون وضعیت تماس (اختیاری):
                  </label>
                  <select
                    value={mapping.callStatusCol || ''}
                    onChange={(e) => setMapping({ ...mapping, callStatusCol: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="">-- فاقد این ستون --</option>
                    {parsedData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* 7. Agent Identification Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نحوه شناسایی کارشناس فروش:
                  </label>
                  <select
                    value={mapping.agentIdentificationMode}
                    onChange={(e: any) => setMapping({ ...mapping, agentIdentificationMode: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="source">کارشناس در ستون مبدا است (تماس‌های خروجی)</option>
                    <option value="destination">کارشناس در ستون مقصد است (تماس‌های ورودی)</option>
                    <option value="auto_by_extension">تشخیص خودکار بر اساس داخلی کوتاه</option>
                  </select>
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-500" />
                    <span>پیش‌نمایش داده‌های سطرها (نمایش نمونه جهت بازبینی):</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    نمایش سطور ۱ الی {Math.min(parsedData.rawRows.length, 15)} از مجموع {formatPersianNumber(parsedData.rawRows.length)} سطر
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56 text-[11px]">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2 border-b border-slate-200 text-center w-12">ردیف</th>
                        {parsedData.headers.map((h, i) => (
                          <th key={i} className="p-2 border-b border-slate-200 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.rawRows.slice(0, 15).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          <td className="p-2 text-center text-slate-400 font-mono">{toPersianDigits(rIdx + 1)}</td>
                          {parsedData.headers.map((h, cIdx) => (
                            <td key={cIdx} className="p-2 whitespace-nowrap text-slate-700 font-mono">
                              {String(row[h] !== undefined ? row[h] : '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VALIDATION RESULTS */}
          {step === 'validation' && validationResult && (
            <div className="space-y-4">
              {/* Detailed Statistics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] text-slate-600 font-bold">کل سطور فایل</span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {formatPersianNumber(validationResult.totalRawRows)}
                  </div>
                  <span className="text-[10px] text-slate-500">سطر داده خوانده‌شده</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] text-emerald-800 font-bold">رکوردهای معتبر</span>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {formatPersianNumber(validationResult.validRecordsCount)}
                  </div>
                  <span className="text-[10px] text-emerald-600">آماده ورود به داشبورد</span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[11px] text-amber-800 font-bold">هشدار / وضعیت مبهم</span>
                  <div className="text-xl font-black text-amber-700 mt-1">
                    {formatPersianNumber(validationResult.warningRecordsCount)}
                  </div>
                  <span className="text-[10px] text-amber-600">واردشده با ضابطه ایمن</span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[11px] text-rose-800 font-bold">سطور نامعتبر ردشده</span>
                  <div className="text-xl font-black text-rose-700 mt-1">
                    {formatPersianNumber(validationResult.rejectedRowsCount)}
                  </div>
                  <span className="text-[10px] text-rose-600">فاقد زمان یا ساختار معتبر</span>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <span className="text-[11px] text-indigo-800 font-bold">کارشناسان</span>
                  <div className="text-xl font-black text-indigo-700 mt-1">
                    {toPersianDigits(validationResult.detectedAgents.length)}
                  </div>
                  <span className="text-[10px] text-indigo-600">شناسایی‌شده در فایل</span>
                </div>
              </div>

              {/* Detected Agents */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="font-bold text-slate-700 block mb-1">کارشناسان حاضر در این گزارش:</span>
                <div className="flex flex-wrap gap-1.5">
                  {validationResult.detectedAgents.map(ag => (
                    <span key={ag} className="px-2 py-0.5 bg-white border border-slate-300 rounded-md font-mono text-slate-800">
                      داخلی {toPersianDigits(ag)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rejected Rows Table & Export Option */}
              {validationResult.rejectedRowsCount > 0 && (
                <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>جزئیات سطور ردشده ({toPersianDigits(validationResult.rejectedRowsCount)} سطر):</span>
                    </div>

                    <button
                      type="button"
                      onClick={downloadErrorsCsv}
                      className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود گزارش خطاهای اکسل (CSV)</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-rose-200 rounded-lg max-h-40 bg-white">
                    <table className="w-full text-right text-[11px]">
                      <thead className="bg-rose-100/60 text-rose-900 font-bold sticky top-0">
                        <tr>
                          <th className="p-2 border-b border-rose-200">شماره سطر اکسل</th>
                          <th className="p-2 border-b border-rose-200">ستون خطا</th>
                          <th className="p-2 border-b border-rose-200">مقدار خام</th>
                          <th className="p-2 border-b border-rose-200">علت رد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {validationResult.rejectedDetails.slice(0, 10).map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/50">
                            <td className="p-2 font-mono font-bold text-rose-800">سطر {toPersianDigits(err.rowNumber)}</td>
                            <td className="p-2 font-mono text-slate-700">{err.columnName}</td>
                            <td className="p-2 font-mono text-slate-600">{err.originalValue || '(خالی)'}</td>
                            <td className="p-2 text-rose-700">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validationResult.rejectedDetails.length > 10 && (
                    <div className="text-[10px] text-rose-700 text-left">
                      نمایش ۱۰ سطر اول. برای دیدن تمام موارد، گزارش CSV را دانلود کنید.
                    </div>
                  )}
                </div>
              )}

              {/* Warnings List */}
              {validationResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>هشدارهای اعتبارسنجی:</span>
                  </div>
                  <ul className="list-disc list-inside text-amber-800 text-[11px] space-y-0.5">
                    {validationResult.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div>
            {step === 'mapping' && (
              <button
                onClick={() => setStep('upload')}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                ← بازگشت به انتخاب فایل
              </button>
            )}
            {step === 'validation' && (
              <button
                onClick={() => setStep('mapping')}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
              >
                ← ویرایش نگاشت ستون‌ها
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
            >
              انصراف
            </button>

            {step === 'mapping' && (
              <button
                onClick={runValidation}
                disabled={!mapping?.startTimeCol || !mapping?.durationCol || !mapping?.answerStatusCol}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm cursor-pointer"
              >
                اعتبارسنجی تمامی سطور ({formatPersianNumber(parsedData?.rawRows.length || 0)} سطر)
              </button>
            )}

            {step === 'validation' && (
              <button
                onClick={handleConfirmImport}
                disabled={processedRecords.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  تایید نهایی و محاسبه داشبورد ({formatPersianNumber(processedRecords.length)} تماس)
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
