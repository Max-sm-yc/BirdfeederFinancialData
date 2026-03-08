import { supabase } from './supabase';

export interface DailyKPI {
    date: string;
    revenue: number;
    cogs: number;
    comps: number;
    processing: number;
    net_income: number;
    day_of_week: string;
    net_margin: number;
}

export interface InventoryPrediction {
    item: string;
    days_left: string;
    order_amount: number;
    days_numeric: number;
}

export async function fetchKPIs(): Promise<DailyKPI[]> {
    const { data, error } = await supabase
        .from('daily_kpis')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching KPIs:', error);
        return [];
    }

    return (data || []).map((item: any) => {
        const revenue = item.revenue || 0;
        const net_income = item.net_income || 0;
        return {
            ...item,
            net_margin: revenue !== 0 ? (net_income / revenue) * 100 : 0,
            day_of_week: new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' }),
        };
    });
}

export interface Product {
    id: number;
    name: string;
    cogs: number;
}

export async function fetchProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function createProduct(name: string, cogs: number): Promise<Product> {
    const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cogs }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create product');
    return json;
}

export async function updateProduct(id: number, name: string, cogs: number): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cogs }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update product');
    return json;
}

export async function deleteProduct(id: number): Promise<void> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to delete product');
    }
}

export async function fetchInventoryPredictions(): Promise<InventoryPrediction[]> {
    const url = process.env.WEBHOOK_URL!;
    const key = process.env.WEBHOOK_KEY!;
    const value = process.env.WEBHOOK_VALUE!;

    try {
        const response = await fetch(url, {
            headers: {
                [key]: value,
            },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        const rawData = result.data?.data || [];

        const cleanDays = (val: any) => {
            const s = String(val).toUpperCase().trim();
            if (s.includes('NOW')) return 0;
            const numericPart = s.replace(/[^0-9]/g, '');
            return numericPart ? parseInt(numericPart, 10) : 0;
        };

        return rawData.map((item: any) => ({
            item: item.item,
            days_left: item.days_left,
            order_amount: item.order_amount,
            days_numeric: cleanDays(item.days_left),
        })).sort((a: any, b: any) => a.days_numeric - b.days_numeric);

    } catch (error) {
        console.error('Inventory API Error:', error);
        return [];
    }
}
