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
        <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl p-6 shadow-lg h-[400px]">
            <h3 className="text-[#e6f1ff] text-lg font-semibold mb-6">Revenue Performance</h3>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64ffda" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#64ffda" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="formattedDate"
                        stroke="#8892b0"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#8892b0"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#112240', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#64ffda' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#64ffda"
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
        <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl p-6 shadow-lg h-[400px]">
            <h3 className="text-[#e6f1ff] text-lg font-semibold mb-6">Average Revenue by Day</h3>
            <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="shortName"
                        stroke="#8892b0"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#8892b0"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value: number) => `$${value}`}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#112240', border: '1px solid #1e293b', borderRadius: '8px' }}
                        cursor={{ fill: '#112240' }}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index >= 5 ? '#64ffda' : '#112240'} stroke={index >= 5 ? '#64ffda' : '#1e293b'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
