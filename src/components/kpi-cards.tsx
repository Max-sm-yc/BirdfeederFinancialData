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
    delta?: string;
    isPositive: boolean;
    icon: ReactNode;
    subtext?: string;
}

export function KpiCard({ title, value, delta, isPositive, icon, subtext }: KpiCardProps) {
    return (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-7 shadow-sm transition-all hover:border-[#2563eb]/30 hover:shadow-md">
            <div className="flex items-center justify-between mb-5">
                <div className="p-2.5 bg-[#eff6ff] rounded-lg text-[#2563eb]">
                    {icon}
                </div>
                {delta && (
                    <div className={cn(
                        "flex items-center text-sm font-semibold",
                        isPositive ? "text-green-600" : "text-red-600"
                    )}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {delta}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-[#64748b] text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
                {subtext && <p className="text-xs text-[#94a3b8] mt-1">{subtext}</p>}
            </div>
        </div>
    );
}

interface Analytics {
    revenue: number;
    netIncome: number;
    netMargin: number;
    cogs: number;
}

export function KpiGrid({ current, previous }: { current: Analytics, previous?: Analytics }) {
    const calculateDelta = (curr: number, prev: number) => {
        if (prev === 0) return null;
        const diff = ((curr - prev) / prev) * 100;
        return {
            text: `${Math.abs(diff).toFixed(1)}%`,
            isPositive: diff >= 0
        };
    };

    const revDelta = previous ? calculateDelta(current.revenue, previous.revenue) : null;
    const niDelta = previous ? calculateDelta(current.netIncome, previous.netIncome) : null;
    const nmDelta = previous ? calculateDelta(current.netMargin, previous.netMargin) : null;
    const cogsDelta = previous ? calculateDelta(current.cogs, previous.cogs) : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <KpiCard
                title="Total Revenue"
                value={`$${current.revenue.toLocaleString()}`}
                delta={revDelta?.text}
                isPositive={revDelta?.isPositive ?? true}
                icon={<DollarSign className="w-6 h-6" />}
                subtext={previous ? `vs $${previous.revenue.toLocaleString()}` : undefined}
            />
            <KpiCard
                title="Net Income"
                value={`$${current.netIncome.toLocaleString()}`}
                delta={niDelta?.text}
                isPositive={niDelta?.isPositive ?? true}
                icon={<TrendingUp className="w-6 h-6" />}
                subtext={previous ? `vs $${previous.netIncome.toLocaleString()}` : undefined}
            />
            <KpiCard
                title="Net Margin"
                value={`${current.netMargin.toFixed(1)}%`}
                delta={nmDelta?.text}
                isPositive={nmDelta?.isPositive ?? true}
                icon={<Percent className="w-6 h-6" />}
                subtext={previous ? `vs ${previous.netMargin.toFixed(1)}%` : "Efficiency"}
            />
            <KpiCard
                title="COGS %"
                value={`${current.cogs.toFixed(1)}%`}
                delta={cogsDelta?.text}
                isPositive={!(cogsDelta?.isPositive ?? false)}
                icon={<CreditCard className="w-6 h-6" />}
                subtext={previous ? `vs ${previous.cogs.toFixed(1)}%` : "Cost Control"}
            />
        </div>
    );
}
