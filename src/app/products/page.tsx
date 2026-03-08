"use client";

import { useEffect, useState } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api';
import type { Product } from '@/lib/api';
import { LayoutDashboard, Plus, Pencil, Trash2, Check, X, PackageSearch } from 'lucide-react';
import Link from 'next/link';

type Banner = { type: 'success' | 'error'; message: string };

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [banner, setBanner] = useState<Banner | null>(null);

    // Add-row state
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCogs, setNewCogs] = useState('');

    // Edit-row state
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editCogs, setEditCogs] = useState('');

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [saving, setSaving] = useState(false);

    function showBanner(type: 'success' | 'error', message: string) {
        setBanner({ type, message });
        setTimeout(() => setBanner(null), 4000);
    }

    async function load() {
        setLoading(true);
        try {
            const data = await fetchProducts();
            setProducts(data);
        } catch (e: any) {
            showBanner('error', e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    async function handleAdd() {
        if (!newName.trim()) return showBanner('error', 'Product name is required.');
        const cogsNum = parseFloat(newCogs);
        if (isNaN(cogsNum) || cogsNum < 0) return showBanner('error', 'COGS must be a non-negative number.');
        setSaving(true);
        try {
            const created = await createProduct(newName.trim(), cogsNum);
            setProducts(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            setAdding(false);
            setNewName('');
            setNewCogs('');
            showBanner('success', `"${created.name}" added successfully.`);
        } catch (e: any) {
            showBanner('error', e.message);
        } finally {
            setSaving(false);
        }
    }

    function startEdit(product: Product) {
        setEditingId(product.id);
        setEditName(product.name);
        setEditCogs(String(product.cogs));
        setDeletingId(null);
    }

    async function handleSaveEdit() {
        if (!editName.trim()) return showBanner('error', 'Product name is required.');
        const cogsNum = parseFloat(editCogs);
        if (isNaN(cogsNum) || cogsNum < 0) return showBanner('error', 'COGS must be a non-negative number.');
        setSaving(true);
        try {
            const updated = await updateProduct(editingId!, editName.trim(), cogsNum);
            setProducts(prev =>
                prev.map(p => p.id === updated.id ? updated : p)
                    .sort((a, b) => a.name.localeCompare(b.name))
            );
            setEditingId(null);
            showBanner('success', `"${updated.name}" updated successfully.`);
        } catch (e: any) {
            showBanner('error', e.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number, name: string) {
        setSaving(true);
        try {
            await deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
            setDeletingId(null);
            showBanner('success', `"${name}" removed.`);
        } catch (e: any) {
            showBanner('error', e.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-[#040a21] text-[#e6f1ff] p-4 md:p-8 lg:p-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <PackageSearch className="w-8 h-8 text-[#64ffda]" />
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                            Product <span className="text-[#64ffda]">Management</span>
                        </h1>
                    </div>
                    <p className="text-[#8892b0] text-sm">
                        Add, edit, or remove products and their cost of goods sold (COGS).
                        Changes take effect on the next daily pipeline run.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 bg-[#112240] hover:bg-[#1e293b] text-[#64ffda] px-5 py-2.5 rounded-lg border border-[#64ffda]/20 transition-all font-medium text-sm"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <button
                        onClick={() => { setAdding(true); setEditingId(null); setDeletingId(null); }}
                        disabled={adding}
                        className="flex items-center gap-2 bg-[#64ffda] hover:bg-[#64ffda]/90 disabled:opacity-50 text-[#0a192f] px-5 py-2.5 rounded-lg transition-all font-bold text-sm shadow-[0_4px_14px_0_rgba(100,255,218,0.39)]"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Banner */}
            {banner && (
                <div className={`mb-6 px-5 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${banner.type === 'success' ? 'bg-emerald-900/40 border border-emerald-500/40 text-emerald-300' : 'bg-rose-900/40 border border-rose-500/40 text-rose-300'}`}>
                    <span>{banner.message}</span>
                    <button onClick={() => setBanner(null)} className="ml-4 opacity-60 hover:opacity-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#0b112b] border border-[#1e293b] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_120px] text-[10px] uppercase font-bold text-[#64ffda] tracking-widest px-6 py-3 border-b border-[#1e293b]">
                    <span>Product Name</span>
                    <span>COGS (per unit)</span>
                    <span className="text-right">Actions</span>
                </div>

                {/* Add row */}
                {adding && (
                    <div className="grid grid-cols-[1fr_140px_120px] items-center gap-3 px-6 py-3 border-b border-[#64ffda]/20 bg-[#64ffda]/5">
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Gatorade Blue"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                            className="bg-[#112240] border border-[#1e293b] focus:border-[#64ffda] rounded px-3 py-1.5 text-sm text-[#e6f1ff] outline-none w-full"
                        />
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892b0] text-sm">$</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={newCogs}
                                onChange={e => setNewCogs(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                                className="bg-[#112240] border border-[#1e293b] focus:border-[#64ffda] rounded pl-7 pr-3 py-1.5 text-sm text-[#e6f1ff] outline-none w-full"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="p-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-50"
                                title="Save"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { setAdding(false); setNewName(''); setNewCogs(''); }}
                                className="p-1.5 rounded bg-[#112240] hover:bg-[#1e293b] text-[#8892b0] border border-[#1e293b] transition-all"
                                title="Cancel"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-[#64ffda] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 && !adding ? (
                    <div className="text-center py-16 text-[#8892b0]">
                        <PackageSearch className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No products yet. Click <strong className="text-[#64ffda]">Add Product</strong> to get started.</p>
                    </div>
                ) : (
                    products.map((product, i) => {
                        const isEditing = editingId === product.id;
                        const isDeleting = deletingId === product.id;
                        const isEven = i % 2 === 0;

                        if (isEditing) {
                            return (
                                <div
                                    key={product.id}
                                    className="grid grid-cols-[1fr_140px_120px] items-center gap-3 px-6 py-3 border-b border-[#64ffda]/20 bg-[#64ffda]/5"
                                >
                                    <input
                                        autoFocus
                                        type="text"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                        className="bg-[#112240] border border-[#1e293b] focus:border-[#64ffda] rounded px-3 py-1.5 text-sm text-[#e6f1ff] outline-none w-full"
                                    />
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8892b0] text-sm">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editCogs}
                                            onChange={e => setEditCogs(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                                            className="bg-[#112240] border border-[#1e293b] focus:border-[#64ffda] rounded pl-7 pr-3 py-1.5 text-sm text-[#e6f1ff] outline-none w-full"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={saving}
                                            className="p-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-50"
                                            title="Save"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1.5 rounded bg-[#112240] hover:bg-[#1e293b] text-[#8892b0] border border-[#1e293b] transition-all"
                                            title="Cancel"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        if (isDeleting) {
                            return (
                                <div
                                    key={product.id}
                                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-3 border-b border-rose-500/20 bg-rose-900/10"
                                >
                                    <span className="text-sm text-rose-300">
                                        Delete <strong>"{product.name}"</strong>? This cannot be undone.
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDelete(product.id, product.name)}
                                            disabled={saving}
                                            className="px-3 py-1.5 rounded bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setDeletingId(null)}
                                            className="px-3 py-1.5 rounded bg-[#112240] hover:bg-[#1e293b] text-[#8892b0] border border-[#1e293b] text-xs font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={product.id}
                                className={`grid grid-cols-[1fr_140px_120px] items-center px-6 py-3.5 border-b border-[#1e293b] last:border-b-0 transition-colors hover:bg-[#112240]/60 ${isEven ? 'bg-transparent' : 'bg-[#0d1428]/40'}`}
                            >
                                <span className="text-sm font-medium text-[#e6f1ff]">{product.name}</span>
                                <span className="text-sm font-mono text-[#64ffda]">${Number(product.cogs).toFixed(2)}</span>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => startEdit(product)}
                                        className="p-1.5 rounded bg-[#112240] hover:bg-[#1e293b] text-[#8892b0] hover:text-[#64ffda] border border-[#1e293b] transition-all"
                                        title="Edit"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => { setDeletingId(product.id); setEditingId(null); }}
                                        className="p-1.5 rounded bg-[#112240] hover:bg-rose-900/30 text-[#8892b0] hover:text-rose-400 border border-[#1e293b] hover:border-rose-500/30 transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <p className="mt-6 text-[#8892b0] text-xs text-center">
                {products.length} product{products.length !== 1 ? 's' : ''} — Changes are reflected in the next daily pipeline run.
            </p>
        </main>
    );
}
