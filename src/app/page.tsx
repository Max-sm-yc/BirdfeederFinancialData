"use client";

import { useEffect, useState } from 'react';
import { fetchKPIs, fetchInventoryPredictions } from '@/lib/api';
import type { DailyKPI, InventoryPrediction } from '@/lib/api';
import { KpiGrid } from '@/components/kpi-cards';
import { InventoryTable } from '@/components/inventory-table';
import { RevenueChart, DayOfWeekChart } from '@/components/revenue-chart';
import { RefreshCw, Filter, Calendar, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState<DailyKPI[]>([]);
  const [predictions, setPredictions] = useState<InventoryPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [rangeType, setRangeType] = useState<'preset' | 'custom'>('preset');
  const [days, setDays] = useState<number>(7);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const [isComparing, setIsComparing] = useState(true);
  const [comparisonMode, setComparisonMode] = useState<'period' | 'year'>('period');
  const [showFilters, setShowFilters] = useState(false);

  async function loadData() {
    setRefreshing(true);
    const [kpiData, predData] = await Promise.all([
      fetchKPIs(),
      fetchInventoryPredictions()
    ]);
    setKpis(kpiData);
    setPredictions(predData);

    // Set default custom dates based on data if not set
    if (kpiData.length > 0 && !customStart) {
      const end = new Date(kpiData[kpiData.length - 1].date);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      setCustomEnd(end.toISOString().split('T')[0]);
      setCustomStart(start.toISOString().split('T')[0]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#2563eb] font-medium animate-pulse">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  // --- DATA FILTERING & COMPARISON LOGIC ---

  const getPeriodStats = (data: DailyKPI[]) => {
    const revenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
    const netIncome = data.reduce((acc, curr) => acc + curr.net_income, 0);
    const cogs = data.reduce((acc, curr) => acc + curr.cogs, 0);
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;
    const cogsPerc = revenue > 0 ? (cogs / revenue) * 100 : 0;

    return { revenue, netIncome, netMargin, cogs: cogsPerc };
  };

  let currentData: DailyKPI[] = [];
  let previousData: DailyKPI[] = [];

  // Determine current range
  let start: Date, end: Date;
  if (rangeType === 'preset') {
    end = kpis.length > 0 ? new Date(kpis[kpis.length - 1].date) : new Date();
    start = new Date(end);
    start.setDate(start.getDate() - days + 1);
  } else {
    start = new Date(customStart);
    end = new Date(customEnd);
  }

  currentData = kpis.filter(k => {
    const d = new Date(k.date);
    return d >= start && d <= end;
  });

  if (isComparing && currentData.length > 0) {
    let prevStart: Date, prevEnd: Date;

    if (comparisonMode === 'period') {
      const duration = end.getTime() - start.getTime();
      prevEnd = new Date(start.getTime() - 86400000);
      prevStart = new Date(prevEnd.getTime() - duration);
    } else {
      // Previous Year (YoY)
      prevStart = new Date(start);
      prevStart.setFullYear(prevStart.getFullYear() - 1);
      prevEnd = new Date(end);
      prevEnd.setFullYear(prevEnd.getFullYear() - 1);
    }

    previousData = kpis.filter(k => {
      const d = new Date(k.date);
      return d >= prevStart && d <= prevEnd;
    });
  }

  const currentStats = getPeriodStats(currentData);
  const previousStats = previousData.length > 0 ? getPeriodStats(previousData) : undefined;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a] p-6 md:p-10 lg:p-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-[#2563eb]" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Birdfeeder <span className="text-[#2563eb]">Analyst Suite</span>
            </h1>
          </div>
          <p className="text-[#64748b] flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {rangeType === 'preset' ? `Last ${days} Days` : `${customStart} to ${customEnd}`}
            {isComparing && ` vs ${comparisonMode === 'period' ? 'Previous Period' : 'Previous Year'}`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white hover:bg-[#f1f5f9] text-[#2563eb] px-5 py-2.5 rounded-lg border border-[#e2e8f0] transition-all font-medium shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg transition-all font-bold shadow-[0_4px_14px_0_rgba(37,99,235,0.25)]"
            >
              <Filter className="w-4 h-4" />
              Analyze
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e2e8f0] rounded-xl shadow-2xl p-6 z-50">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs uppercase font-bold text-[#64748b] tracking-widest">Timeframe</p>
                  <div className="flex bg-[#f1f5f9] rounded-lg p-1">
                    <button
                      onClick={() => setRangeType('preset')}
                      className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${rangeType === 'preset' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}
                    >Presets</button>
                    <button
                      onClick={() => setRangeType('custom')}
                      className={`px-3 py-1 text-xs rounded-md transition-all font-medium ${rangeType === 'custom' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}
                    >Custom</button>
                  </div>
                </div>

                {rangeType === 'preset' ? (
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDays(d); setRangeType('preset'); }}
                        className={`px-3 py-2.5 rounded-lg text-sm transition-all font-medium ${days === d && rangeType === 'preset' ? 'bg-[#2563eb] text-white shadow-sm' : 'bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}
                      >
                        {d} Days
                      </button>
                    ))}
                    <button
                      onClick={() => { setDays(kpis.length); setRangeType('preset'); }}
                      className={`px-3 py-2.5 rounded-lg text-sm transition-all font-medium ${days === kpis.length && rangeType === 'preset' ? 'bg-[#2563eb] text-white shadow-sm' : 'bg-[#f8fafc] text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f1f5f9]'}`}
                    >
                      All Time
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="text-[10px] text-[#64748b] uppercase mb-1.5 block font-bold tracking-widest">Start Date</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748b] uppercase mb-1.5 block font-bold tracking-widest">End Date</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-white border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 mt-2 border-t border-[#f1f5f9] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#0f172a]">Compare Data</span>
                    <button
                      onClick={() => setIsComparing(!isComparing)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isComparing ? 'bg-[#2563eb]' : 'bg-[#e2e8f0]'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isComparing ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  {isComparing && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setComparisonMode('period')}
                        className={`text-[10px] uppercase font-bold py-2.5 rounded-lg border transition-all ${comparisonMode === 'period' ? 'border-[#2563eb] text-[#2563eb] bg-blue-50' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}
                      >Previous Period</button>
                      <button
                        onClick={() => setComparisonMode('year')}
                        className={`text-[10px] uppercase font-bold py-2.5 rounded-lg border transition-all ${comparisonMode === 'year' ? 'border-[#2563eb] text-[#2563eb] bg-blue-50' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'}`}
                      >Previous Year</button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-6 bg-[#2563eb] text-white py-2.5 rounded-lg text-xs font-bold hover:bg-[#1d4ed8] transition-all shadow-sm"
                >Apply Analytics</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <KpiGrid
        current={currentStats}
        previous={previousStats}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-8">
          <RevenueChart data={currentData} />
          <DayOfWeekChart data={currentData} />
        </div>

        {/* Operational Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <InventoryTable predictions={predictions} />

          <div className="p-7 bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
            <h3 className="text-[#0f172a] text-lg font-semibold mb-2">Operational Insight</h3>
            <p className="text-[#64748b] text-sm leading-relaxed">
              Showing performance for the last {days} days. Comparing against the identical preceding period.
              Revenue is {((currentStats.revenue / (previousStats?.revenue || 1)) * 100 - 100).toFixed(1)}% changed vs previous.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Raw Data Expander */}
      <div className="mt-16 pt-8 border-t border-[#e2e8f0] flex flex-col md:flex-row justify-between items-center gap-4 text-[#94a3b8] text-sm">
        <p>&copy; 2026 Birdfeeder Data & Analytics. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#2563eb] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#2563eb] transition-colors">Documentation</a>
          <a href="#" className="hover:text-[#2563eb] transition-colors">Support</a>
        </div>
      </div>
    </main>
  );
}

// Minimal TrendingUp import for the alert box
function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
