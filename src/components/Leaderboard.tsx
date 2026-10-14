import React, { useState } from 'react';
import { 
  Trophy, 
  ArrowUpDown, 
  Search, 
  ExternalLink, 
  Gift, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  HelpCircle,
  ChevronLeft
} from 'lucide-react';
import { AgentAggregateSummary, PerformanceCategory } from '../types/telephony';
import { 
  toPersianDigits, 
  formatPersianNumber, 
  formatDurationPersian 
} from '../utils/persianDate';
import { getCategoryLabelPersian, getCategoryBadgeClasses } from '../utils/kpiEngine';

interface LeaderboardProps {
  agents: AgentAggregateSummary[];
  onSelectAgent: (agentId: string) => void;
}

type SortField = 
  | 'score' 
  | 'totalCalls' 
  | 'successfulCalls' 
  | 'successRate' 
  | 'duration' 
  | 'bonus' 
  | 'name';

export const Leaderboard: React.FC<LeaderboardProps> = ({ agents, onSelectAgent }) => {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.agentName.toLowerCase().includes(search.toLowerCase()) ||
    a.agentId.toLowerCase().includes(search.toLowerCase())
  );

  const sortedAgents = [...filteredAgents].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case 'score':
        diff = a.averageDailyScore - b.averageDailyScore;
        break;
      case 'totalCalls':
        diff = a.totalCalls - b.totalCalls;
        break;
      case 'successfulCalls':
        diff = a.successfulCalls - b.successfulCalls;
        break;
      case 'successRate':
        diff = a.successRate - b.successRate;
        break;
      case 'duration':
        diff = a.totalDurationSeconds - b.totalDurationSeconds;
        break;
      case 'bonus':
        diff = a.cumulativeBonusPoints - b.cumulativeBonusPoints;
        break;
      case 'name':
        diff = a.agentName.localeCompare(b.agentName);
        break;
    }
    return sortAsc ? diff : -diff;
  });

  const getCategoryIcon = (category: PerformanceCategory) => {
    switch (category) {
      case 'optimal':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'needs_attention':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'substandard':
        return <AlertCircle className="w-3.5 h-3.5 text-orange-600" />;
      case 'critical':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden mb-6">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              جدول رتبه‌بندی و مقایسه عملکرد کارشناسان فروش
            </h2>
            <p className="text-xs text-slate-500">
              ارزیابی بر اساس نمره رسمی ۱۰۰ امتیازی، نرخ موفقیت و مدت مکالمات موثر
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی نام یا داخلی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg py-1.5 pr-8 pl-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold select-none">
              <th className="py-3 px-3 w-12 text-center">رتبه</th>
              <th className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">
                  <span>نام و شناسه کارشناس</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition" onClick={() => handleSort('totalCalls')}>
                <div className="flex items-center gap-1">
                  <span>کل تماس‌ها</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition" onClick={() => handleSort('successfulCalls')}>
                <div className="flex items-center gap-1">
                  <span>تماس‌های موفق</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition" onClick={() => handleSort('successRate')}>
                <div className="flex items-center gap-1">
                  <span>نرخ موفقیت</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition" onClick={() => handleSort('duration')}>
                <div className="flex items-center gap-1">
                  <span>مدت مکالمه موثر</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition" onClick={() => handleSort('score')}>
                <div className="flex items-center gap-1">
                  <span>امتیاز KPI روزانه</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">وضعیت عملکرد</th>
              <th className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition" onClick={() => handleSort('bonus')}>
                <div className="flex items-center gap-1">
                  <span>امتیاز پاداش تجمعی</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedAgents.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                  هیچ کارشناسی با مشخصات جستجویافته یافت نشد.
                </td>
              </tr>
            ) : (
              sortedAgents.map((agent, index) => {
                const badge = getCategoryBadgeClasses(agent.category);
                const isTop3 = index < 3;

                return (
                  <tr
                    key={agent.agentId}
                    onClick={() => onSelectAgent(agent.agentId)}
                    className="hover:bg-indigo-50/40 transition cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700 border border-slate-300'
                          : index === 2
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'text-slate-500'
                      }`}>
                        {toPersianDigits(index + 1)}
                      </span>
                    </td>

                    {/* Agent Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                          {agent.agentName.slice(0, 2)}
                        </div>
                        <div>
                          <div>{agent.agentName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            شناسه: {toPersianDigits(agent.agentId)} | {toPersianDigits(agent.daysCount)} روز کاری
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Calls */}
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {formatPersianNumber(agent.totalCalls)}
                    </td>

                    {/* Successful Calls */}
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {formatPersianNumber(agent.successfulCalls)}
                    </td>

                    {/* Success Rate */}
                    <td className="py-3.5 px-3 font-medium">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        agent.successRate >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        ٪{toPersianDigits(agent.successRate)}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-3 font-medium text-slate-700">
                      {formatDurationPersian(agent.totalDurationSeconds)}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-slate-900">
                          {toPersianDigits(agent.averageDailyScore)}
                        </span>
                        <span className="text-[10px] text-slate-400">/ ۱۰۰</span>
                      </div>
                    </td>

                    {/* Performance Category Badge */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {getCategoryIcon(agent.category)}
                        <span>{getCategoryLabelPersian(agent.category)}</span>
                      </span>
                    </td>

                    {/* Cumulative Bonus */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1 text-emerald-700 font-bold">
                        <Gift className="w-3.5 h-3.5 text-emerald-500" />
                        <span>+{toPersianDigits(agent.cumulativeBonusPoints)} امتیاز</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {toPersianDigits(agent.rewardProgressPercent)}٪ تا پاداش ۵۰۰
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAgent(agent.agentId);
                        }}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                        title="مشاهده کارنامه جامع کارشناس"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
