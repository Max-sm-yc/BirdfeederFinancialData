import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { InventoryPrediction } from '@/lib/api';

export function InventoryTable({ predictions }: { predictions: InventoryPrediction[] }) {
    const getUrgencyIcon = (days: number) => {
        if (days === 0) return <AlertTriangle className="w-5 h-5 text-red-600" />;
        if (days <= 7) return <Clock className="w-5 h-5 text-amber-600" />;
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    };

    const getUrgencyColor = (days: number) => {
        if (days === 0) return "bg-red-50 text-red-700 border-red-200";
        if (days <= 7) return "bg-amber-50 text-amber-700 border-amber-200";
        if (days <= 14) return "bg-blue-50 text-blue-700 border-blue-200";
        return "bg-slate-100 text-slate-500 border-slate-200";
    };

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
            <div className="px-7 py-6 border-b border-[#f1f5f9]">
                <h3 className="text-[#0f172a] text-lg font-semibold">Inventory & Predictions</h3>
                <p className="text-[#64748b] text-sm mt-1">Items sorted by urgency (Days of stock left)</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#f8fafc] text-[#64748b] text-xs uppercase tracking-wider font-semibold">
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Item Name</th>
                            <th className="px-6 py-4">Days Left</th>
                            <th className="px-6 py-4">Suggested Order</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                        {predictions.map((item, idx) => (
                            <tr key={idx} className="hover:bg-[#f8fafc] transition-colors">
                                <td className="px-6 py-5">
                                    {getUrgencyIcon(item.days_numeric)}
                                </td>
                                <td className="px-6 py-5 text-[#0f172a] font-medium">{item.item}</td>
                                <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(item.days_numeric)}`}>
                                        {item.days_left}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-[#64748b]">
                                    {item.order_amount > 0 ? `${item.order_amount.toLocaleString()} units` : "N/A"}
                                </td>
                            </tr>
                        ))}
                        {predictions.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-[#94a3b8]">
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
