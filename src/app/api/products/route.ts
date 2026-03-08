import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error('Supabase credentials not configured');
    return createClient(url, key);
}

export async function GET() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('products')
            .select('id, name, cogs')
            .order('name', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, cogs } = await req.json();

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }
        const cogsNum = parseFloat(cogs);
        if (isNaN(cogsNum) || cogsNum < 0) {
            return NextResponse.json({ error: 'cogs must be a non-negative number' }, { status: 400 });
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('products')
            .insert({ name: name.trim(), cogs: cogsNum })
            .select('id, name, cogs')
            .single();

        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        const isDuplicate = err.code === '23505';
        return NextResponse.json(
            { error: isDuplicate ? 'A product with that name already exists' : err.message },
            { status: isDuplicate ? 409 : 500 }
        );
    }
}
