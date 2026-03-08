import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error('Supabase credentials not configured');
    return createClient(url, key);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
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
            .update({ name: name.trim(), cogs: cogsNum, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, name, cogs')
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json(data);
    } catch (err: any) {
        const isDuplicate = err.code === '23505';
        return NextResponse.json(
            { error: isDuplicate ? 'A product with that name already exists' : err.message },
            { status: isDuplicate ? 409 : 500 }
        );
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = getSupabase();
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return new NextResponse(null, { status: 204 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
