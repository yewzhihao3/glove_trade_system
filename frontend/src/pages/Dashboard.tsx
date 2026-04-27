import React, { useState, useEffect } from 'react';
import { Loader2, Building2, Cpu, ExternalLink, ShieldCheck, Sparkles, KeyRound, Search } from 'lucide-react';
import { leadService, hsCodeService } from '../services/api';
import type { BuyerLead, HSCode } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import { countries } from '../constants/countries';

const KEYWORD_OPTIONS = [
  { label: 'Nitrile Gloves', value: 'Nitrile Gloves' },
  { label: 'Latex Gloves', value: 'Latex Gloves' },
  { label: 'Custom Keyword', value: 'Custom Keyword' }
];

const Dashboard = () => {
  const [hsCode, setHsCode] = useState('');
  const [keyword, setKeyword] = useState('Nitrile Gloves');
  const [customKeyword, setCustomKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<BuyerLead[]>([]);

  const [allHSCodes, setAllHSCodes] = useState<HSCode[]>([]);
  const [availableCountries, setAvailableCountries] = useState<{label: string, value: string}[]>([]);
  const [availableHSCodes, setAvailableHSCodes] = useState<{label: string, value: string}[]>([]);

  useEffect(() => {
    const fetchHSCodes = async () => {
      try {
        const codes: HSCode[] = await hsCodeService.getHSCodes();
        setAllHSCodes(codes);
        const uniqueCountries = Array.from(new Set(codes.map(c => c.country).filter(Boolean))).sort() as string[];
        setAvailableCountries(uniqueCountries.map(c => {
          const matchedCountry = countries.find(constC => constC.value === c);
          return { label: matchedCountry ? matchedCountry.label : c, value: c };
        }));
      } catch (error) {
        console.error("Error fetching HS Codes:", error);
      }
    };
    fetchHSCodes();
  }, []);

  useEffect(() => {
    if (country) {
      const filtered = allHSCodes.filter(c => c.country === country);
      setAvailableHSCodes(filtered.map(c => ({
        label: `${c.hs_code} - ${c.description}`,
        value: `${c.hs_code} - ${c.description}`
      })));
      setHsCode('');
    } else {
      setAvailableHSCodes([]);
      setHsCode('');
    }
  }, [country, allHSCodes]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalKeyword = keyword === 'Custom Keyword' ? customKeyword : keyword;
    if (!hsCode || !finalKeyword || !country) return;

    setLoading(true);
    try {
      const actualHsCode = hsCode.split(' - ')[0];
      const data = await leadService.generateLeads(actualHsCode, finalKeyword, country);
      setLeads(data);
    } catch (error) {
      console.error("Error generating leads:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600/10 to-emerald-500/5 p-12 border border-black/5 dark:border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5">
            <Sparkles className="w-64 h-64 text-slate-900 dark:text-white animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-[0.2em]">DeepSeek R1 Integration Active</span>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
          </div>
          <h1 className="text-5xl font-extralight text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
            Lead <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Finder.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-light leading-relaxed max-w-xl">
            Uncover high-intent buyers by merging HS Code classification with real-time market discovery logic.
          </p>
        </div>
      </section>

      {/* Control Panel */}
      <div className="glass rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 lg:p-10 border border-black/5 dark:border-white/5 relative shadow-2xl z-30">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem] md:rounded-[3rem]">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        </div>

        <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col gap-2 border-b border-black/5 dark:border-white/5 pb-6">
                <h2 className="text-lg md:text-xl font-light text-slate-900 dark:text-white tracking-widest flex items-center gap-3">
                    <Search className="w-5 h-5 text-blue-400" />
                    Target <span className="font-bold">Parameters</span>
                </h2>
                <p className="text-[10px] md:text-xs text-slate-500 font-mono tracking-widest uppercase">Configure intelligence scanning criteria</p>
            </div>

            <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 items-end">
                <SearchableSelect
                    label="Operational Region"
                    options={availableCountries}
                    value={country}
                    onChange={setCountry}
                    placeholder="Select Region"
                />

                <SearchableSelect
                    label="HS Classification"
                    options={availableHSCodes.length > 0 ? availableHSCodes : [{ label: 'Select a region first', value: '' }]}
                    value={hsCode}
                    onChange={setHsCode}
                    placeholder="Select HS Code"
                />

                <SearchableSelect
                    label="Product Keyword"
                    options={KEYWORD_OPTIONS}
                    value={keyword}
                    onChange={setKeyword}
                    placeholder="Select Keyword"
                />

                {keyword === 'Custom Keyword' && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Custom Keyword</label>
                        <div className="relative group">
                            <div className="relative bg-white dark:bg-slate-950 border border-black/10 dark:border-white/10 rounded-2xl p-1">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={customKeyword}
                                    onChange={(e) => setCustomKeyword(e.target.value)}
                                    placeholder="e.g. Surgical Gloves"
                                    className="w-full bg-transparent border-none py-3.5 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-0 transition-all font-mono text-sm tracking-widest placeholder:text-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !hsCode || !country || (keyword === 'Custom Keyword' ? !customKeyword : !keyword)}
                    className="col-span-1 lg:col-span-4 relative h-14 group overflow-hidden rounded-2xl transition-all active:scale-95 disabled:opacity-50 mt-4"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 transition-all group-hover:scale-105"></div>
                    <div className="relative flex items-center justify-center gap-3 px-8 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-[0.2em] h-full">
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Cpu className="w-5 h-5 text-blue-200" />
                                Initialize Discovery Scan
                            </>
                        )}
                    </div>
                </button>
            </form>
        </div>
      </div>

      {/* Results Section */}
      <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {leads.length > 0 && (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-4 md:pb-6">
                <h3 className="text-xl md:text-2xl font-light text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4" />
                    </span>
                    Verified <span className="font-bold">Leads</span>
                </h3>
                <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase self-start sm:self-auto">
                    {leads.length} Targets Acquired
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {leads.map((lead, idx) => (
                    <div key={lead.id || idx} className="group glass rounded-3xl p-6 md:p-8 border border-black/5 dark:border-white/5 hover:bg-white/[0.02] hover:border-blue-500/30 transition-all duration-500 flex flex-col relative overflow-hidden shadow-xl hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
                        
                        <div className="flex items-start justify-between mb-6 md:mb-8 gap-4 w-full">
                            <div className="flex gap-4 flex-1">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 flex items-center justify-center shadow-inner group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all duration-500 shrink-0">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1 group-hover:text-blue-300 transition-colors break-words">{lead.company_name}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black break-words">{lead.company_country || 'Unknown Location'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 mb-6 md:mb-8 text-sm text-slate-500 dark:text-slate-400 font-light leading-relaxed transition-all duration-500">
                            {lead.description}
                        </div>

                        <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black bg-white dark:bg-slate-900 text-slate-500 border border-black/5 dark:border-white/5 px-2 py-1 tracking-[0.2em] rounded-lg uppercase group-hover:border-blue-500/20 transition-all ${lead.source === 'DeepSeek' || lead.source?.includes('AI') ? 'group-hover:text-blue-400' : 'group-hover:text-emerald-400'}`}>
                                    {lead.source}
                                </span>
                            </div>

                            {lead.company_website_link && lead.company_website_link !== 'No website available' ? (
                                <a href={lead.company_website_link.startsWith('http') ? lead.company_website_link : `https://${lead.company_website_link}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-black/5 dark:bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-slate-900 dark:text-white transition-all text-xs font-mono group/link">
                                    Link Established
                                    <ExternalLink className="w-3 h-3 opacity-50 group-hover/link:opacity-100" />
                                </a>
                            ) : (
                                <span className="text-[10px] text-slate-600 uppercase tracking-widest">Discrete Identity</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {leads.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center space-y-8 py-20 md:py-32 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2rem] md:rounded-[3rem] bg-white/[0.01] mx-4 md:mx-0">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-black/5 dark:border-white/5 flex items-center justify-center text-slate-700">
              <Building2 className="w-6 md:w-8 h-6 md:h-8 opacity-20" />
            </div>
            <div className="text-center space-y-2 px-6">
              <h3 className="text-lg md:text-xl font-light text-slate-500 dark:text-slate-400 tracking-widest uppercase">Lead Finder Standby</h3>
              <p className="text-slate-600 text-xs md:text-sm font-light">Waiting for parameters to initialize deep market scan.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
