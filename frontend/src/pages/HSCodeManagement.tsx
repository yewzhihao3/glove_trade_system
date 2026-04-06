import React, { useState, useEffect } from 'react';
import { Database, Search, Download, Edit2, Trash2, Plus, Globe, Hash, Loader2, X, Check, AlertCircle, Save, ChevronDown } from 'lucide-react';
import { hsCodeService, type HSCode } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import { countries } from '../constants/countries';

const HSCodeManagement = () => {
    const [codes, setCodes] = useState<HSCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [countryFilter, setCountryFilter] = useState('All');
    const [editingCode, setEditingCode] = useState<HSCode | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // New code form state
    const [newCode, setNewCode] = useState({ hs_code: '', description: '', country: 'Worldwide' });

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const data = await hsCodeService.getHSCodes();
            setCodes(data);
        } catch (error) {
            console.error("Error fetching codes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await hsCodeService.deleteHSCode(id);
            setCodes(codes.filter(c => c.id !== id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting code:", error);
            alert("Failed to delete record.");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCode) return;
        setSaving(true);
        try {
            const updated = await hsCodeService.updateHSCode(editingCode.id, editingCode);
            setCodes(codes.map(c => c.id === updated.id ? updated : c));
            setEditingCode(null);
        } catch (error) {
            console.error("Error updating code:", error);
            alert("Failed to update record.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const saved = await hsCodeService.saveHSCodeManual(newCode);
            setCodes([saved, ...codes]);
            setIsAddModalOpen(false);
            setNewCode({ hs_code: '', description: '', country: 'Worldwide' });
        } catch (error: unknown) {
            console.error("Error adding code:", error);
            let message = "Failed to add manual entry.";
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { detail?: string } } };
                message = axiosError.response?.data?.detail || message;
            }
            alert(message);
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        const headers = ["ID", "HS Code", "Description", "Country", "Source", "Date Saved"];
        const rows = filteredCodes.map(c => [
            c.id,
            c.hs_code,
            `"${c.description.replace(/"/g, '""')}"`,
            c.country,
            c.source,
            new Date(c.created_at).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `hs_codes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredCodes = codes.filter(c => {
        const matchesSearch = c.hs_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCountry = countryFilter === 'All' || 
            c.country?.toLowerCase() === countryFilter?.toLowerCase();
            
        return matchesSearch && matchesCountry;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, countryFilter]);

    // Pagination derived state
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCodes = filteredCodes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);

    const finalFilterOptions = React.useMemo(() => {
        // Find existing country records in countries list
        const knownCountries = countries.filter(c => 
            codes.some(code => 
                code.country?.trim().toLowerCase() === c.value?.trim().toLowerCase() ||
                code.country?.trim().toLowerCase() === c.label?.trim().toLowerCase()
            )
        );

        // Find countries in data that aren't in our standard list
        const customCountries = [...new Set(codes.map(c => c.country))]
            .filter(name => name && !countries.some(c => c.value === name || c.label === name))
            .map(name => ({ label: name!, value: name! }));

        return [
            { label: 'All Countries', value: 'All' },
            ...knownCountries,
            ...customCountries
        ];
    }, [codes]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-6 relative z-20">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                            <Database className="w-5 md:w-6 h-5 md:h-6" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-light tracking-wider text-slate-900 dark:text-white">CODE <span className="font-bold text-blue-500">VAULT</span></h1>
                    </div>
                    <p className="text-slate-500 text-[10px] md:text-xs tracking-[0.2em] md:tracking-widest uppercase font-black opacity-60">Manage your global classification portfolio</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full xl:w-auto">
                    <button 
                        onClick={handleExport}
                        disabled={filteredCodes.length === 0}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 md:py-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-all text-[10px] md:text-xs font-black uppercase tracking-widest disabled:opacity-20 backdrop-blur-md"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-slate-900 dark:text-white text-[10px] md:text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Manual Code
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass rounded-[2rem] md:rounded-[2.5rem] p-4 lg:p-6 border border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-30 shadow-2xl">
                <div className="flex-1 relative w-full group">
                    <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder="SEARCH BY CODE OR DESCRIPTION..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-3.5 md:py-4 pl-12 md:pl-16 pr-6 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-700 tracking-widest uppercase"
                    />
                </div>
                <div className="w-full md:w-72">
                    <SearchableSelect 
                        value={countryFilter}
                        onChange={setCountryFilter}
                        options={finalFilterOptions}
                        placeholder="FILTER BY COUNTRY"
                    />
                </div>
            </div>

            {/* Main List */}
            <div className="glass rounded-[3rem] border border-black/5 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 dark:border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tariff Code</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Description</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Context</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-32">
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-600">
                                            <Loader2 className="w-10 h-10 animate-spin opacity-20" />
                                            <span className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Scanning Vault...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredCodes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32">
                                        <div className="flex flex-col items-center justify-center gap-6 text-slate-700">
                                            <div className="w-16 h-16 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 flex items-center justify-center italic">
                                                ?
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-40">No entries found matching filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentCodes.map((c) => (
                                <tr key={c.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all duration-500">
                                                <Hash className="w-4 h-4" />
                                            </div>
                                            <span className="text-xl font-mono font-bold tracking-tighter text-slate-900 dark:text-white">{c.hs_code}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-md">
                                            {c.description}
                                        </p>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3 h-3 text-slate-600" />
                                                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{c.country}</span>
                                            </div>
                                            <div className="text-[8px] text-slate-700 font-medium tracking-[0.2em] uppercase">Saved {new Date(c.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                            c.source === 'DeepSeek' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                            {c.source}
                                        </span>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingCode(c)}
                                                className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-all active:scale-90"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirm(c.id)}
                                                className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-white/[0.02] border-t border-black/5 dark:border-white/5 gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Rows per page:</span>
                        <div className="relative">
                            <select 
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 py-2 pl-3 pr-8 focus:ring-2 focus:ring-blue-500/50 cursor-pointer outline-none appearance-none w-full"
                            >
                                <option value={10}>10</option>
                                <option value={30}>30</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                            {filteredCodes.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCodes.length)} of {filteredCodes.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300"
                            >
                                Prev
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages || totalPages === 0}
                                className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            {editingCode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white dark:bg-slate-950/80 backdrop-blur-xl" onClick={() => setEditingCode(null)} />
                    <form onSubmit={handleUpdate} className="relative w-full max-w-xl glass-modal border border-black/10 dark:border-white/10 rounded-[3rem] p-10 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-light text-slate-900 dark:text-white italic">Refine <span className="font-bold text-blue-500">Record</span></h3>
                            <button type="button" onClick={() => setEditingCode(null)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">HS Code ID</label>
                                <div className="bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-4 px-6 text-xl font-mono text-slate-900 dark:text-white opacity-50 cursor-not-allowed">
                                    {editingCode.hs_code}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Country/Region</label>
                                <SearchableSelect 
                                    value={editingCode.country}
                                    onChange={(val) => setEditingCode({...editingCode, country: val})}
                                    options={countries}
                                    placeholder="SELECT REGION"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Tariff Description</label>
                                <textarea 
                                    value={editingCode.description}
                                    onChange={(e) => setEditingCode({...editingCode, description: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-32 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setEditingCode(null)}
                                className="flex-1 py-4 rounded-2xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-black/10 dark:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-4 rounded-2xl bg-blue-600 text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Sync Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white dark:bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)} />
                    <form onSubmit={handleAddManual} className="relative w-full max-w-xl glass-modal border border-emerald-500/20 rounded-[3rem] p-10 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-light text-slate-900 dark:text-white italic">Vault <span className="font-bold text-emerald-500">New Entry</span></h3>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">HS Code</label>
                                <input 
                                    autoFocus
                                    required
                                    type="text"
                                    value={newCode.hs_code}
                                    onChange={(e) => setNewCode({...newCode, hs_code: e.target.value})}
                                    placeholder="Enter 4-10 digit code..."
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Country/Region</label>
                                <SearchableSelect 
                                    value={newCode.country}
                                    onChange={(val) => setNewCode({...newCode, country: val})}
                                    options={countries}
                                    placeholder="SELECT REGION"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Tariff Description</label>
                                <textarea 
                                    required
                                    value={newCode.description}
                                    onChange={(e) => setNewCode({...newCode, description: e.target.value})}
                                    placeholder="Primary classification details..."
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-32 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-4 rounded-2xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-black/10 dark:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-4 rounded-2xl bg-emerald-600 text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Add to Vault
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* DELETE CONFIRMATION MINI-MODAL */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white dark:bg-slate-950/80 backdrop-blur-xl" onClick={() => setDeleteConfirm(null)} />
                    <div className="relative w-full max-w-sm glass-modal border border-rose-500/20 rounded-[2.5rem] p-10 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-8 border border-rose-500/20">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-light text-slate-900 dark:text-white mb-3">Remove Entry?</h3>
                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-10">This classification will be permanently deleted from your global data portfolio.</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-4 rounded-2xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-black/10 dark:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 py-4 rounded-2xl bg-rose-600 text-slate-900 dark:text-white font-bold text-[10px] uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HSCodeManagement;
