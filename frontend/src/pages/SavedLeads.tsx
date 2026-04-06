import React, { useState, useEffect } from 'react';
import { Search, Download, Edit2, Trash2, Plus, Globe, Building2, Loader2, X, Check, AlertCircle, Save, ExternalLink, ChevronDown } from 'lucide-react';
import { leadService, type BuyerLead } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import { countries } from '../constants/countries';

const SavedLeads = () => {
    const [leads, setLeads] = useState<BuyerLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [countryFilter, setCountryFilter] = useState('All');
    const [editingLead, setEditingLead] = useState<BuyerLead | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // New lead form state
    const [newLead, setNewLead] = useState<Partial<BuyerLead>>({ 
        company_name: '', 
        company_country: 'Worldwide',
        company_website_link: '',
        description: '',
        hs_code: 'Manual',
        keyword: 'Manual',
        country: 'Worldwide'
    });

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const data = await leadService.getLeads();
            setLeads(data);
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await leadService.deleteLead(id);
            setLeads(leads.filter(l => l.id !== id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting lead:", error);
            alert("Failed to delete record.");
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLead) return;
        setSaving(true);
        try {
            const updated = await leadService.updateLead(editingLead.id, editingLead);
            setLeads(leads.map(l => l.id === updated.id ? updated : l));
            setEditingLead(null);
        } catch (error) {
            console.error("Error updating lead:", error);
            alert("Failed to update record.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddManual = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const saved = await leadService.saveLeadManual(newLead);
            setLeads([saved, ...leads]);
            setIsAddModalOpen(false);
            setNewLead({ 
                company_name: '', 
                company_country: 'Worldwide',
                company_website_link: '',
                description: '',
                hs_code: 'Manual',
                keyword: 'Manual',
                country: 'Worldwide' 
            });
        } catch (error: unknown) {
            console.error("Error adding lead:", error);
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
        const headers = ["ID", "Company Name", "Location", "Website", "Description", "HS Code", "Keyword", "Search Region", "Source", "Date Saved"];
        const rows = filteredLeads.map(l => [
            l.id,
            `"${l.company_name.replace(/"/g, '""')}"`,
            l.company_country,
            l.company_website_link,
            `"${l.description?.replace(/"/g, '""') || ''}"`,
            l.hs_code,
            l.keyword,
            l.country,
            l.source,
            new Date(l.created_at).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `saved_leads_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (l.description && l.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCountry = countryFilter === 'All' || 
            l.company_country?.toLowerCase() === countryFilter?.toLowerCase();
            
        return matchesSearch && matchesCountry;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, countryFilter]);

    // Pagination derived state
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

    const finalFilterOptions = React.useMemo(() => {
        // Find existing country records in countries list
        const knownCountries = countries.filter(c => 
            leads.some(lead => 
                lead.company_country?.trim().toLowerCase() === c.value?.trim().toLowerCase() ||
                lead.company_country?.trim().toLowerCase() === c.label?.trim().toLowerCase()
            )
        );

        // Find countries in data that aren't in our standard list
        const customCountries = [...new Set(leads.map(l => l.company_country))]
            .filter(name => name && !countries.some(c => c.value === name || c.label === name))
            .map(name => ({ label: name!, value: name! }));

        return [
            { label: 'All Countries', value: 'All' },
            ...knownCountries,
            ...customCountries
        ];
    }, [leads]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header Area */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-6 relative z-20">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 md:w-12 h-10 md:h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                            <Building2 className="w-5 md:w-6 h-5 md:h-6" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-light tracking-wider text-slate-900 dark:text-white">LEADS <span className="font-bold text-blue-500">VAULT</span></h1>
                    </div>
                    <p className="text-slate-500 text-[10px] md:text-xs tracking-[0.2em] md:tracking-widest uppercase font-black opacity-60">Manage your verified global buyers</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 w-full xl:w-auto">
                    <button 
                        onClick={handleExport}
                        disabled={filteredLeads.length === 0}
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
                        Add Manual Lead
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass rounded-[2rem] md:rounded-[2.5rem] p-4 lg:p-6 border border-black/5 dark:border-white/5 flex flex-col md:flex-row items-center gap-4 md:gap-6 relative z-30 shadow-2xl">
                <div className="flex-1 relative w-full group">
                    <Search className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder="SEARCH BY COMPANY OR DESCRIPTION..."
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
                        placeholder="FILTER BY LOCATION"
                    />
                </div>
            </div>

            {/* Main List */}
            <div className="glass rounded-[3rem] border border-black/5 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 dark:border-white/5 bg-white/[0.02]">
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identity & Location</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Digital Presence</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Intelligence</th>
                                <th className="px-8 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Origin</th>
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
                            ) : filteredLeads.length === 0 ? (
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
                            ) : currentLeads.map((l, idx) => (
                                <tr key={l.id || idx} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-8 py-8">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-lg font-semibold tracking-tighter text-slate-900 dark:text-white">{l.company_name}</span>
                                            <div className="flex items-center gap-2">
                                                <Globe className="w-3 h-3 text-slate-600" />
                                                <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{l.company_country || 'Unknown Location'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 text-sm">
                                        {l.company_website_link && l.company_website_link !== 'No website available' ? (
                                            <a href={l.company_website_link.startsWith('http') ? l.company_website_link : `https://${l.company_website_link}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-black/5 dark:bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-slate-900 dark:text-white transition-all text-xs font-mono group/link">
                                             Link Established
                                             <ExternalLink className="w-3 h-3 opacity-50 group-hover/link:opacity-100" />
                                           </a>
                                        ) : (
                                            <span className="text-[10px] text-slate-600 uppercase tracking-widest">Discrete Identity</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-8">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-md">
                                            {l.description}
                                        </p>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex flex-col items-start gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                l.source === 'DeepSeek' || l.source?.includes('AI') ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                                {l.source}
                                            </span>
                                            <div className="text-[8px] text-slate-700 font-medium tracking-[0.2em] uppercase">
                                              Saved {new Date(l.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingLead(l)}
                                                className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-all active:scale-90"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteConfirm(l.id)}
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
                            {filteredLeads.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredLeads.length)} of {filteredLeads.length}
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
            {editingLead && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-white dark:bg-slate-950/80 backdrop-blur-xl" onClick={() => setEditingLead(null)} />
                    <form onSubmit={handleUpdate} className="relative w-full max-w-xl glass-modal border border-black/10 dark:border-white/10 rounded-[3rem] p-10 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-light text-slate-900 dark:text-white italic">Refine <span className="font-bold text-blue-500">Lead Record</span></h3>
                            <button type="button" onClick={() => setEditingLead(null)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Company Name</label>
                                <input 
                                    required
                                    type="text"
                                    value={editingLead.company_name}
                                    onChange={(e) => setEditingLead({...editingLead, company_name: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-light text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Company Location</label>
                                <SearchableSelect 
                                    value={editingLead.company_country || 'Worldwide'}
                                    onChange={(val) => setEditingLead({...editingLead, company_country: val})}
                                    options={countries}
                                    placeholder="SELECT REGION"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Website/Link</label>
                                <input 
                                    type="text"
                                    value={editingLead.company_website_link || ''}
                                    onChange={(e) => setEditingLead({...editingLead, company_website_link: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Business Description</label>
                                <textarea 
                                    value={editingLead.description || ''}
                                    onChange={(e) => setEditingLead({...editingLead, description: e.target.value})}
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-light text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-32 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex gap-4">
                            <button 
                                type="button"
                                onClick={() => setEditingLead(null)}
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
                            <h3 className="text-2xl font-light text-slate-900 dark:text-white italic">Vault <span className="font-bold text-emerald-500">New Lead</span></h3>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Company Name</label>
                                <input 
                                    autoFocus
                                    required
                                    type="text"
                                    value={newLead.company_name}
                                    onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                                    placeholder="Enter company identity..."
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Company Location</label>
                                <SearchableSelect 
                                    value={newLead.company_country || 'Worldwide'}
                                    onChange={(val) => setNewLead({...newLead, company_country: val})}
                                    options={countries}
                                    placeholder="SELECT REGION"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Website/Link</label>
                                <input 
                                    type="text"
                                    value={newLead.company_website_link}
                                    onChange={(e) => setNewLead({...newLead, company_website_link: e.target.value})}
                                    placeholder="https://..."
                                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-3xl py-4 px-6 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Business Description</label>
                                <textarea 
                                    value={newLead.description}
                                    onChange={(e) => setNewLead({...newLead, description: e.target.value})}
                                    placeholder="Company operations and intelligence..."
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
                        <h3 className="text-2xl font-light text-slate-900 dark:text-white mb-3">Remove Lead?</h3>
                        <p className="text-slate-500 text-sm font-light leading-relaxed mb-10">This lead record will be permanently deleted from your vault.</p>
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

export default SavedLeads;
