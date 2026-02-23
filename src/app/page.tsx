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

  async function loadData() {
    setRefreshing(true);
    const [kpiData, predData] = await Promise.all([
      fetchKPIs(),
      fetchInventoryPredictions()
    ]);
    setKpis(kpiData);
    setPredictions(predData);
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

  // Calculate totals for the KPI grid
  const totalRevenue = kpis.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalNetIncome = kpis.reduce((acc, curr) => acc + curr.net_income, 0);
  const avgMargin = kpis.length > 0 ? (totalNetIncome / totalRevenue) * 100 : 0;
  const totalCogs = kpis.reduce((acc, curr) => acc + curr.cogs, 0);
  const cogsPercentage = totalRevenue > 0 ? (totalCogs / totalRevenue) * 100 : 0;

  return (
    <main className="min-h-screen bg-[#040a21] text-[#e6f1ff] p-4 md:p-8 lg:p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-8 h-8 text-[#64ffda]" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Birdfeeder <span className="text-[#64ffda]">Analyst Suite</span>
            </h1>
          </div>
          <p className="text-[#8892b0] flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Operational & Financial Intelligence Dashboard
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[#112240] hover:bg-[#1e293b] text-[#64ffda] px-5 py-2.5 rounded-lg border border-[#64ffda]/20 transition-all font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh Data'}
          </button>
          <button className="flex items-center gap-2 bg-[#64ffda] hover:bg-[#64ffda]/90 text-[#0a192f] px-5 py-2.5 rounded-lg transition-all font-bold shadow-[0_4px_14px_0_rgba(100,255,218,0.39)]">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <KpiGrid
        revenue={totalRevenue}
        netIncome={totalNetIncome}
        netMargin={avgMargin}
        cogs={cogsPercentage}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-8">
          <RevenueChart data={kpis} />
          <DayOfWeekChart data={kpis} />
        </div>

        {/* Operational Sidebar */}
        <div className="lg:col-span-1">
          <InventoryTable predictions={predictions} />

          <div className="mt-8 bg-gradient-to-br from-[#112240] to-[#0b112b] border border-[#64ffda]/20 rounded-xl p-6">
            <h4 className="text-[#64ffda] font-bold mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Efficiency Alert
            </h4>
            <p className="text-sm text-[#8892b0] leading-relaxed">
              Net income is tracking <span className="text-emerald-400 font-semibold">+12% higher</span> than the rolling 7-day average. Inventory levels for key items are stable.
            </p>
            <button className="mt-4 text-xs font-bold uppercase tracking-wider text-[#64ffda] hover:underline underline-offset-4">
              View AI Insights &rarr;
            </button>
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
