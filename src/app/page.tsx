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
      <div className="min-h-screen bg-[#040a21] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-[#64ffda] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(100,255,218,0.5)]"></div>
          <p className="text-[#64ffda] font-medium animate-pulse">Loading Analytics...</p>
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

  if (rangeType === 'preset') {
    currentData = kpis.slice(-days);
    if (isComparing) {
      previousData = kpis.slice(-(days * 2), -days);
    }
  } else {
    // Custom date logic
    const start = new Date(customStart);
    const end = new Date(customEnd);
    currentData = kpis.filter(k => {
      const d = new Date(k.date);
      return d >= start && d <= end;
    });

    if (isComparing && currentData.length > 0) {
      // Calculate length of current period in ms
      const duration = end.getTime() - start.getTime();
      const prevEnd = new Date(start.getTime() - 86400000); // Day before current start
      const prevStart = new Date(prevEnd.getTime() - duration);

      previousData = kpis.filter(k => {
        const d = new Date(k.date);
        return d >= prevStart && d <= prevEnd;
      });
    }
  }

  const currentStats = getPeriodStats(currentData);
  const previousStats = previousData.length > 0 ? getPeriodStats(previousData) : undefined;

  return (
    <main className="min-h-screen bg-[#040a21] text-[#e6f1ff] p-4 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 relative">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-[#64ffda]" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Birdfeeder <span className="text-[#64ffda]">Analyst Suite</span>
            </h1>
          </div>
          <p className="text-[#8892b0] flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {rangeType === 'preset' ? `Last ${days} Days` : `${customStart} to ${customEnd}`} Analytics {isComparing && "with Comparisons"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[#112240] hover:bg-[#1e293b] text-[#64ffda] px-5 py-2.5 rounded-lg border border-[#64ffda]/20 transition-all font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-[#64ffda] hover:bg-[#64ffda]/90 text-[#0a192f] px-5 py-2.5 rounded-lg transition-all font-bold shadow-[0_4px_14px_0_rgba(100,255,218,0.39)]"
            >
              <Filter className="w-4 h-4" />
              Custom Range
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0b112b] border border-[#1e293b] rounded-xl shadow-2xl p-6 z-50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs uppercase font-bold text-[#64ffda]">Select Period</p>
                  <div className="flex bg-[#112240] rounded-md p-1">
                    <button
                      onClick={() => setRangeType('preset')}
                      className={`px-3 py-1 text-xs rounded transition-all ${rangeType === 'preset' ? 'bg-[#64ffda] text-[#0a192f]' : 'text-[#8892b0]'}`}
                    >Presets</button>
                    <button
                      onClick={() => setRangeType('custom')}
                      className={`px-3 py-1 text-xs rounded transition-all ${rangeType === 'custom' ? 'bg-[#64ffda] text-[#0a192f]' : 'text-[#8892b0]'}`}
                    >Custom</button>
                  </div>
                </div>

                {rangeType === 'preset' ? (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[7, 30, 90].map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDays(d); setRangeType('preset'); setShowFilters(false); }}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${days === d && rangeType === 'preset' ? 'bg-[#64ffda] text-[#0a192f]' : 'bg-[#112240] text-[#e6f1ff] hover:bg-[#1e293b]'}`}
                      >
                        {d} Days
                      </button>
                    ))}
                    <button
                      onClick={() => { setDays(kpis.length); setRangeType('preset'); setShowFilters(false); }}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${days === kpis.length && rangeType === 'preset' ? 'bg-[#64ffda] text-[#0a192f]' : 'bg-[#112240] text-[#e6f1ff] hover:bg-[#1e293b]'}`}
                    >
                      All Time
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-[10px] text-[#8892b0] uppercase mb-1 block font-bold">Start Date</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full bg-[#112240] border border-[#1e293b] rounded px-3 py-2 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#8892b0] uppercase mb-1 block font-bold">End Date</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full bg-[#112240] border border-[#1e293b] rounded px-3 py-2 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#64ffda]"
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full bg-[#112240] text-[#64ffda] py-2 rounded text-xs font-bold hover:bg-[#1e293b]"
                    >Apply Custom Range</button>
                  </div>
                )}

                <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
                  <span className="text-sm font-medium">Compare Previous</span>
                  <button
                    onClick={() => setIsComparing(!isComparing)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isComparing ? 'bg-[#64ffda]' : 'bg-[#1e293b]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isComparing ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-[#8892b0] mt-2 italic">
                  Comparisons use equal length trailing periods.
                </p>
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

          <div className="p-6 bg-[#0b112b] border border-[#1e293b] rounded-xl">
            <h3 className="text-[#e6f1ff] text-lg font-semibold mb-2">Operational Insight</h3>
            <p className="text-[#8892b0] text-sm leading-relaxed">
              Showing performance for the last {days} days. Comparing against the identical preceding period.
              Revenue is {((currentStats.revenue / (previousStats?.revenue || 1)) * 100 - 100).toFixed(1)}% changed vs previous.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Raw Data Expander */}
      <div className="mt-16 pt-8 border-t border-[#112240] flex flex-col md:flex-row justify-between items-center gap-4 text-[#8892b0] text-sm">
        <p>&copy; 2026 Birdfeeder Data & Analytics. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#64ffda] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#64ffda] transition-colors">Documentation</a>
          <a href="#" className="hover:text-[#64ffda] transition-colors">Support</a>
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
