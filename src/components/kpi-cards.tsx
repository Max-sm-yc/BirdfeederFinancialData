import { ArrowUpRight, ArrowDownRight, DollarSign, Percent, TrendingUp, CreditCard } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ReactNode } from 'react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface KpiCardProps {
    title: string;
    value: string;
    delta: string;
    isPositive: boolean;
    icon: ReactNode;
}

export function KpiCard({ title, value, delta, isPositive, icon }: KpiCardProps) {
    return (
        <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl p-6 shadow-lg transition-all hover:border-[#64ffda]/30">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-[#112240] rounded-lg text-[#64ffda]">
                    {icon}
                </div>
                <div className={cn(
                    "flex items-center text-sm font-medium",
                    isPositive ? "text-emerald-400" : "text-rose-400"
                )}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    {delta}
                </div>
            </div>
            <div>
                <h3 className="text-[#8892b0] text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-[#e6f1ff]">{value}</p>
            </div>
        </div>
    );
}

export function KpiGrid({ revenue, netIncome, netMargin, cogs }: { revenue: number, netIncome: number, netMargin: number, cogs: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard
                title="Total Revenue"
                value={`$${revenue.toLocaleString()}`}
                delta="vs last week"
                isPositive={true}
                icon={<DollarSign className="w-6 h-6" />}
            />
            <KpiCard
                title="Net Income"
                value={`$${netIncome.toLocaleString()}`}
                delta="vs last week"
                isPositive={netIncome > 0}
                icon={<TrendingUp className="w-6 h-6" />}
            />
            <KpiCard
                title="Net Margin"
                value={`${netMargin.toFixed(1)}%`}
                delta="Efficiency"
                isPositive={netMargin > 15}
                icon={<Percent className="w-6 h-6" />}
            />
            <KpiCard
                title="COGS %"
                value={`${cogs.toFixed(1)}%`}
                delta="Cost Control"
                isPositive={cogs < 40}
                icon={<CreditCard className="w-6 h-6" />}
            />
        </div>
    );
}
