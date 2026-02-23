import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { InventoryPrediction } from '@/lib/api';

export function InventoryTable({ predictions }: { predictions: InventoryPrediction[] }) {
    const getUrgencyIcon = (days: number) => {
        if (days === 0) return <AlertTriangle className="w-5 h-5 text-rose-500" />;
        if (days <= 7) return <Clock className="w-5 h-5 text-amber-500" />;
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    };

    const getUrgencyColor = (days: number) => {
        if (days === 0) return "bg-rose-500/10 text-rose-500 border-rose-500/20";
        if (days <= 7) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        if (days <= 14) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    };

    return (
        <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-[#1e293b]">
                <h3 className="text-[#e6f1ff] text-lg font-semibold">Inventory & Predictions</h3>
                <p className="text-[#8892b0] text-sm mt-1">Items sorted by urgency (Days of stock left)</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#112240] text-[#64ffda] text-xs uppercase tracking-wider font-semibold">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Item Name</th>
                            <th className="px-6 py-4">Days Left</th>
                            <th className="px-6 py-4">Suggested Order</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                        {predictions.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#112240]/50 transition-colors">
                                <td className="px-6 py-4">
                                    {getUrgencyIcon(item.days_numeric)}
                                </td>
                                <td className="px-6 py-4 text-[#e6f1ff] font-medium">{item.item}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(item.days_numeric)}`}>
                                        {item.days_left}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[#8892b0]">
                                    {item.order_amount > 0 ? `${item.order_amount.toLocaleString()} units` : "N/A"}
                                </td>
                            </tr>
                        ))}
                        {predictions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-[#8892b0]">
                                    No prediction data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
