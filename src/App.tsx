/**
 * Advanced Live Telephony Performance Analytics Dashboard
 * Complete Persian (Farsi) RTL Enterprise BI Application
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CallRecord, 
  SystemConfig, 
  ImportValidationResult,
  FilterState 
} from './types/telephony';
import { DEFAULT_CONFIG, aggregateTelephonyData } from './utils/kpiEngine';
import { generateRealisticSampleCalls } from './data/sampleDataset';
import { Navbar } from './components/Navbar';
import { GlobalFilters } from './components/GlobalFilters';
import { KPICards } from './components/KPICards';
import { Leaderboard } from './components/Leaderboard';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { IntradayMonitor } from './components/IntradayMonitor';
import { DailyReportsView } from './components/DailyReportsView';
import { AgentDetailModal } from './components/AgentDetailModal';
import { ImportModal } from './components/ImportModal';
import { SettingsModal } from './components/SettingsModal';
import { TestResultsModal } from './components/TestResultsModal';
import { ExportModal } from './components/ExportModal';
import { 
  Sparkles, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  LayoutDashboard, 
  Clock, 
  CheckCircle,
  HelpCircle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { toPersianDigits } from './utils/persianDate';
import { 
  OFFICIAL_AGENTS_LIST, 
  OFFICIAL_AGENT_REGISTRY,
  UNRESOLVED_AGENT_ID,
  UNRESOLVED_AGENT_NAME 
} from './utils/agentRegistry';

export default function App() {
  // 1. Core State
  const [records, setRecords] = useState<CallRecord[]>(() => generateRealisticSampleCalls());
  const [isSampleData, setIsSampleData] = useState<boolean>(true);
  const [fileName, setFileName] = useState<string>('داده‌های نمونه مرکز تماس');
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_CONFIG);

  // 2. View Tab State
  const [activeWorkspace, setActiveWorkspace] = useState<'overview' | 'daily' | 'charts' | 'intraday'>('overview');

  // 3. Modals State
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTestsOpen, setIsTestsOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // 4. Filters State
  const [filters, setFilters] = useState<FilterState>({
    selectedDate: 'all',
    selectedAgentIds: [],
    performanceStatus: 'all',
    dayType: 'all',
    searchQuery: '',
  });

  const resetFilters = () => {
    setFilters({
      selectedDate: 'all',
      selectedAgentIds: [],
      performanceStatus: 'all',
      dayType: 'all',
      searchQuery: '',
    });
  };

  // 5. Extract available dates and strictly enforce the 7 official agents
  const { allAvailableDates, allAvailableAgents } = useMemo(() => {
    const datesSet = new Set<string>();

    records.forEach(r => {
      if (r.dateStr) datesSet.add(r.dateStr);
    });

    return {
      allAvailableDates: Array.from(datesSet).sort(),
      // Strictly the 7 authorized sales agents
      allAvailableAgents: OFFICIAL_AGENTS_LIST.map(ag => ({
        id: ag.id,
        name: `${ag.name} (داخلی ${ag.id})`
      }))
    };
  }, [records]);

  // Unresolved / unknown agent calls counter
  const unresolvedCallsCount = useMemo(() => {
    return records.filter(c => c.agentId === UNRESOLVED_AGENT_ID).length;
  }, [records]);

  // 6. Filter Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Date filter
      if (filters.selectedDate !== 'all' && r.dateStr !== filters.selectedDate) {
        return false;
      }

      // Agent filter
      if (filters.selectedAgentIds.length > 0 && !filters.selectedAgentIds.includes(r.agentId)) {
        return false;
      }

      // Day Type filter
      if (filters.dayType !== 'all' && r.dayType !== filters.dayType) {
        return false;
      }

      // Search Query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesAgent = (r.agentName || '').toLowerCase().includes(q) || r.agentId.includes(q);
        const matchesDest = r.destination.includes(q);
        const matchesSource = r.source.includes(q);
        if (!matchesAgent && !matchesDest && !matchesSource) {
          return false;
        }
      }

      return true;
    });
  }, [records, filters]);

  // 7. Aggregate Data & Calculate KPIs
  const { agentSummaries, teamMetrics } = useMemo(() => {
    return aggregateTelephonyData(filteredRecords, systemConfig);
  }, [filteredRecords, systemConfig]);

  // 8. Filter Agents by Performance Category if requested
  const visibleAgents = useMemo(() => {
    if (filters.performanceStatus === 'all') return agentSummaries;
    return agentSummaries.filter(a => a.category === filters.performanceStatus);
  }, [agentSummaries, filters.performanceStatus]);

  // Handle Import
  const handleImportComplete = (
    newRecords: CallRecord[],
    validation: ImportValidationResult,
    newFileName: string
  ) => {
    setRecords(newRecords);
    setIsSampleData(false);
    setFileName(newFileName);
    resetFilters();
  };

  const handleLoadSampleData = () => {
    setRecords(generateRealisticSampleCalls());
    setIsSampleData(true);
    setFileName('داده‌های نمونه مرکز تماس');
    resetFilters();
  };

  // Selected Agent Details
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null;
    return agentSummaries.find(a => a.agentId === selectedAgentId) || null;
  }, [selectedAgentId, agentSummaries]);

  const selectedAgentCalls = useMemo(() => {
    if (!selectedAgentId) return [];
    return filteredRecords.filter(c => c.agentId === selectedAgentId);
  }, [selectedAgentId, filteredRecords]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-['Vazirmatn',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        isSampleData={isSampleData}
        fileName={fileName}
        totalCallsCount={filteredRecords.length}
        activeAgentsCount={visibleAgents.length}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Sample Data Banner */}
        {isSampleData && (
          <div className="bg-gradient-to-r from-indigo-50 via-cyan-50 to-emerald-50 border border-indigo-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    داده‌های آزمایشی فعال است (آماده بررسی و تست جامع)
                  </h3>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                    شامل هفته کاری و ۷ کارشناس مجاز
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  می‌توانید تمام امکانات، نمودارها، پایش ساعتی و کارنامه‌ها را مشاهده کنید یا با کلیک روی دکمه زیر، فایل اکسل / CSV واقعی خود را بارگذاری نمایید.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>بارگذاری فایل اکسل شما</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Filters */}
        <GlobalFilters
          filters={filters}
          onFilterChange={setFilters}
          availableDates={allAvailableDates}
          availableAgents={allAvailableAgents}
          totalFilteredRecords={filteredRecords.length}
          totalAllRecords={records.length}
          onReset={resetFilters}
        />

        {/* Executive KPI Summary Cards */}
        <KPICards metrics={teamMetrics} />

        {/* Workspace Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 mb-6 bg-white rounded-xl p-1.5 shadow-xs border">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveWorkspace('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeWorkspace === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>نمای کلی و جدول رتبه‌بندی</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeWorkspace === 'daily'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>گزارش روزانه عملکرد کارشناسان</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('charts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeWorkspace === 'charts'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>نمودارهای تحلیلی ۱۰گانه</span>
            </button>

            <button
              onClick={() => setActiveWorkspace('intraday')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeWorkspace === 'intraday'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>پایش درون‌روزی شیفت‌ها (ساعتی)</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 pl-3">
            <span>تعداد کارشناسان رسمی:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {toPersianDigits(visibleAgents.length)} کارشناس مجاز
            </span>
          </div>
        </div>

        {/* WORKSPACE 1: Overview & Leaderboard */}
        {activeWorkspace === 'overview' && (
          <>
            <Leaderboard
              agents={visibleAgents}
              onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
            />

            <AnalyticsCharts
              agents={visibleAgents}
              teamMetrics={teamMetrics}
              calls={filteredRecords}
              onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
            />
          </>
        )}

        {/* WORKSPACE 2: Dedicated Daily Reports (Jalali Calendar & Persian Week) */}
        {activeWorkspace === 'daily' && (
          <DailyReportsView
            calls={filteredRecords}
            agentSummaries={visibleAgents}
            systemConfig={systemConfig}
            filters={filters}
            onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
          />
        )}

        {/* WORKSPACE 3: Dedicated 10 Analytical Charts */}
        {activeWorkspace === 'charts' && (
          <AnalyticsCharts
            agents={visibleAgents}
            teamMetrics={teamMetrics}
            calls={filteredRecords}
            onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
          />
        )}

        {/* WORKSPACE 4: Dedicated Intraday Shift Monitor */}
        {activeWorkspace === 'intraday' && (
          <IntradayMonitor
            agents={visibleAgents}
            calls={filteredRecords}
            selectedDate={filters.selectedDate}
            availableDates={allAvailableDates}
            onSelectAgent={(agentId) => setSelectedAgentId(agentId)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            سامانه هوشمند تحلیل پیشرفته عملکرد مرکز تماس و کارشناسان فروش © ۱۴۰۳
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>انطباق کامل با تقویم رسمی و ساعات کاری ایران</span>
            <span>•</span>
            <span>محاسبه بلادرنگ شاخص‌های ۶گانه و پاداش</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          agentCalls={selectedAgentCalls}
          onClose={() => setSelectedAgentId(null)}
        />
      )}

      {isImportOpen && (
        <ImportModal
          systemConfig={systemConfig}
          onImportComplete={handleImportComplete}
          onLoadSampleData={handleLoadSampleData}
          onClose={() => setIsImportOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          config={systemConfig}
          onSaveConfig={(newConfig) => setSystemConfig(newConfig)}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isTestsOpen && (
        <TestResultsModal
          onClose={() => setIsTestsOpen(false)}
        />
      )}

      {isExportOpen && (
        <ExportModal
          agents={visibleAgents}
          calls={filteredRecords}
          config={systemConfig}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
}
