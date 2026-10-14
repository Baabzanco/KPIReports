import React from 'react';
import { 
  Filter, 
  Calendar, 
  Users, 
  Activity, 
  RotateCcw, 
  Search,
  Check
} from 'lucide-react';
import { DayOfWeekType, PerformanceCategory, FilterState } from '../types/telephony';
import { toPersianDigits, formatJalaliShort } from '../utils/persianDate';


interface GlobalFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableDates: string[];
  availableAgents: { id: string; name: string }[];
  totalFilteredRecords: number;
  totalAllRecords: number;
  onReset: () => void;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  onFilterChange,
  availableDates,
  availableAgents,
  totalFilteredRecords,
  totalAllRecords,
  onReset
}) => {
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = React.useState(false);

  const toggleAgent = (agentId: string) => {
    let next: string[];
    if (filters.selectedAgentIds.includes(agentId)) {
      next = filters.selectedAgentIds.filter(id => id !== agentId);
    } else {
      next = [...filters.selectedAgentIds, agentId];
    }
    onFilterChange({ ...filters, selectedAgentIds: next });
  };

  const selectAllAgents = () => {
    onFilterChange({ ...filters, selectedAgentIds: [] });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 mb-6 transition-all">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          {/* 1. Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>بازه / روز انتخابی</span>
            </label>
            <select
              value={filters.selectedDate}
              onChange={(e) => onFilterChange({ ...filters, selectedDate: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">تمام روزهای گزارش ({toPersianDigits(availableDates.length)} روز)</option>
              {availableDates.map(date => {
                const d = new Date(date);
                const jalali = formatJalaliShort(d);
                return (
                  <option key={date} value={date}>
                    {jalali} ({date})
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Agent Multi-Select Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>کارشناسان فروش</span>
              {filters.selectedAgentIds.length > 0 && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full">
                  {toPersianDigits(filters.selectedAgentIds.length)}
                </span>
              )}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 text-right flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <span className="truncate">
                  {filters.selectedAgentIds.length === 0
                    ? `همه کارشناسان (${toPersianDigits(availableAgents.length)})`
                    : `${toPersianDigits(filters.selectedAgentIds.length)} کارشناس انتخاب‌شده`}
                </span>
                <span className="text-slate-400 text-[10px]">▼</span>
              </button>

              {isAgentDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsAgentDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-medium">انتخاب کارشناس</span>
                      <button
                        type="button"
                        onClick={selectAllAgents}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        انتخاب همه
                      </button>
                    </div>
                    <div className="space-y-1">
                      {availableAgents.map(agent => {
                        const isSelected = filters.selectedAgentIds.includes(agent.id);
                        return (
                          <div
                            key={agent.id}
                            onClick={() => toggleAgent(agent.id)}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-slate-50 cursor-pointer transition text-slate-700"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <span className="truncate flex-1">{agent.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. Performance Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-500" />
              <span>سطح عملکرد KPI</span>
            </label>
            <select
              value={filters.performanceStatus}
              onChange={(e) => onFilterChange({ ...filters, performanceStatus: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">همه سطوح عملکرد</option>
              <option value="optimal">عملکرد مطلوب (۹۱ تا ۱۰۰)</option>
              <option value="needs_attention">نیازمند توجه (۸۱ تا ۹۰)</option>
              <option value="substandard">عملکرد نامطلوب (۶۱ تا ۸۰)</option>
              <option value="critical">بسیار ضعیف (کمتر از ۶۰)</option>
            </select>
          </div>

          {/* 4. Day of Week Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-500" />
              <span>نوع روز کاری</span>
            </label>
            <select
              value={filters.dayType}
              onChange={(e) => onFilterChange({ ...filters, dayType: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 px-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">همه روزها</option>
              <option value="sat_to_wed">شنبه تا چهارشنبه (تارگت ۱۲۰ دقیقه)</option>
              <option value="thursday">پنج‌شنبه (تارگت ۹۰ دقیقه)</option>
            </select>
          </div>
        </div>

        {/* Search & Reset */}
        <div className="flex items-center gap-2 pt-2 lg:pt-5 border-t lg:border-t-0 border-slate-100">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="جستجوی شماره / داخلی..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-2 pr-8 pl-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={onReset}
            title="بازنشانی فیلترها"
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">بازنشانی</span>
          </button>
        </div>
      </div>

      {/* Filter Statistics Strip */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>تعداد رکوردهای فیلترشده:</span>
          <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
            {toPersianDigits(totalFilteredRecords)} از {toPersianDigits(totalAllRecords)} رکورد
          </span>
          {totalFilteredRecords < totalAllRecords && (
            <span className="text-amber-600 font-medium">
              (فیلتر فعال است)
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          تقویم کاری رسمی: شنبه تا چهارشنبه (۰۹:۰۰ الی ۱۷:۰۰) | پنج‌شنبه (۰۹:۰۰ الی ۱۵:۰۰)
        </div>
      </div>
    </div>
  );
};
