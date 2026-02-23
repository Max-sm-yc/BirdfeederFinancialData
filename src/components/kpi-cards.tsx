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
    delta?: string; // Made optional as it might not always be present
    isPositive: boolean;
    icon: ReactNode;
    subtext?: string; // Added subtext
}

export function KpiCard({ title, value, delta, isPositive, icon, subtext }: KpiCardProps) {
    return (
        <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl p-6 shadow-lg transition-all hover:border-[#64ffda]/30">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-[#112240] rounded-lg text-[#64ffda]">
                    {icon}
                </div>
                {delta && ( // Conditionally render delta
                    <div className={cn(
                        "flex items-center text-sm font-medium",
                        isPositive ? "text-emerald-400" : "text-rose-400"
                    )}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                        {delta}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-[#8892b0] text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-[#e6f1ff]">{value}</p>
                {subtext && <p className="text-xs text-[#8892b0] mt-1">{subtext}</p>}
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
        if (prev === 0) return null; // Avoid division by zero
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                isPositive={!(cogsDelta?.isPositive ?? false)} // COGS increase is usually negative
                icon={<CreditCard className="w-6 h-6" />}
                subtext={previous ? `vs ${previous.cogs.toFixed(1)}%` : "Cost Control"}
            />
        </div>
    );
}
