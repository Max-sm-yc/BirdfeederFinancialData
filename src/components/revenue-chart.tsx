"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import type { DailyKPI } from '@/lib/api';

export function RevenueChart({ data }: { data: DailyKPI[] }) {
    // Calculate cumulative revenue
    let cumulative = 0;
    const chartData = data.map(item => {
        cumulative += item.revenue;
        return {
            ...item,
            cumulative,
            formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
    });

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-7 shadow-sm h-[420px]">
            <h3 className="text-[#0f172a] text-lg font-semibold mb-6">Revenue Performance</h3>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        itemStyle={{ color: '#2563eb' }}
                        labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        fillOpacity={1}
                        fill="url(#colorRev)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DayOfWeekChart({ data }: { data: DailyKPI[] }) {
    const dowOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Aggregate revenue by DOW
    const dowMap = data.reduce((acc: Record<string, number>, item) => {
        acc[item.day_of_week] = (acc[item.day_of_week] || 0) + item.revenue;
        return acc;
    }, {});

    const chartData = dowOrder.map(day => ({
        name: day,
        revenue: dowMap[day] || 0,
        shortName: day.substring(0, 3)
    }));

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-7 shadow-sm h-[420px]">
            <h3 className="text-[#0f172a] text-lg font-semibold mb-6">Average Revenue by Day</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="shortName"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                        cursor={{ fill: '#f8fafc' }}
                        labelStyle={{ color: '#0f172a', fontWeight: 600 }}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index >= 5 ? '#2563eb' : '#e2e8f0'} stroke={index >= 5 ? '#2563eb' : '#e2e8f0'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
