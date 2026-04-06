import React, { useState } from 'react';
import { Globe, Loader2, BookOpen, Sparkles, Hash, Fingerprint, CheckCircle2, Circle, Save, Trash2, ShieldCheck } from 'lucide-react';
import { hsCodeService, type HSCode } from '../services/api';
import SearchableSelect from '../components/SearchableSelect';
import { countries } from '../constants/countries';

const HSCodeIntelligence = () => {
  const [productType] = useState('Gloves'); // Defaulted as requested
  const [country, setCountry] = useState('Worldwide');
  const [loading, setLoading] = useState(false);
  const [hsCodes, setHsCodes] = useState<Partial<HSCode>[]>([]); // Using Partial since id might not be present from AI
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHsCodes([]);
    setSelectedIndices([]);
    try {
      const [aiData, existingData] = await Promise.all([
        hsCodeService.generateHSCodes(productType, country),
        hsCodeService.getHSCodes(country)
      ]);
      
      const existingCodes = new Set(existingData.map((c: HSCode) => c.hs_code));
      const processedData = aiData.map((item: Partial<HSCode>) => ({
        ...item,
        isAlreadyVaulted: existingCodes.has(item.hs_code || '')
      }));

      setHsCodes(processedData);
    } catch (error: unknown) {
      console.error("Error generating HS codes:", error);
      let message = "Connection lost.";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        message = axiosError.response?.data?.detail || message;
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    if (hsCodes[index].isAlreadyVaulted) return; // Cannot toggle already vaulted
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const toggleSelectAll = () => {
    const selectableIndices = hsCodes
      .map((item, i) => item.isAlreadyVaulted ? -1 : i)
      .filter(i => i !== -1);

    if (selectedIndices.length === selectableIndices.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(selectableIndices);
    }
  };

  const handleSave = async () => {
    if (selectedIndices.length === 0) return;
    setSaving(true);
    try {
      const selectedCodes = selectedIndices.map(i => hsCodes[i]);
      await hsCodeService.saveHSCodes(selectedCodes, country);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setSelectedIndices([]);
    } catch (error) {
      console.error("Error saving HS codes:", error);
      alert("Failed to save HS codes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 relative">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-8 right-8 z-[100] animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="glass flex items-center gap-4 px-6 py-4 rounded-2xl border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-bold text-xs uppercase tracking-[0.2em]">Data Vaulted</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] tracking-wider">HS Codes successfully archived</p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-indigo-600/10 to-blue-500/5 p-8 md:p-12 border border-black/5 dark:border-white/5 shadow-2xl mx-4 lg:mx-0">
        <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5">
          <Fingerprint className="w-48 h-48 md:w-64 md:h-64 text-slate-900 dark:text-white animate-pulse" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">Global Classification Engine</span>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
          </div>
          <h1 className="text-3xl md:text-5xl font-extralight text-slate-900 dark:text-white mb-4 md:mb-6 tracking-tight leading-tight">
            HS Code <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Intelligence.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-lg font-light leading-relaxed max-w-xl">
            Optimized for <b className="text-indigo-300">{productType}</b>. Identify precise tariff classifications and regulatory requirements using AI-driven lookup.
          </p>
        </div>
      </section>

      {/* Control Panel */}
      <div className="glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-indigo-500/5 transition-all duration-700 mx-4 lg:mx-0">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Target Product</label>
            <div className="relative group">
              <div className="relative bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl p-4 text-slate-900 dark:text-white font-bold opacity-50 cursor-not-allowed">
                {productType}
              </div>
            </div>
          </div>

          <SearchableSelect
            label="Compliance Region"
            options={countries}
            value={country}
            onChange={setCountry}
          />

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-3 lg:col-span-1 relative h-14 group overflow-hidden rounded-2xl transition-all active:scale-95 disabled:opacity-50 mt-4 md:mt-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 transition-all group-hover:scale-105"></div>
            <div className="relative flex items-center justify-center gap-3 px-8 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-[0.2em] h-full">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                  Run Analysis
                </>
              )}
            </div>
          </button>
        </form>
      </div>

      {/* Results Section */}
      <section className="space-y-6 px-4 lg:px-0">
        {hsCodes.length > 0 && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-black/5 dark:border-white/5 justify-between gap-4">
              <div className="flex items-center gap-4"> {/* Added a div to group the button and select */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-slate-900 dark:text-white transition-colors"
                >
                  {selectedIndices.length === hsCodes.filter(c => !c.isAlreadyVaulted).length ? (
                    <>
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      Remove All
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Select All
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={selectedIndices.length === 0 || saving}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 sm:py-3 rounded-xl bg-emerald-600 text-slate-900 dark:text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:grayscale active:scale-95 shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Selected ({selectedIndices.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {hsCodes.map((item, idx) => {
                const isSelected = selectedIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className={`glass rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 border transition-all duration-500 group relative overflow-hidden ${
                      item.isAlreadyVaulted ? 'opacity-60 cursor-default border-black/5 dark:border-white/5' :
                        isSelected ? 'border-emerald-500/50 bg-emerald-500/[0.03] cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-black/5 dark:border-white/5 hover:border-emerald-500/20 cursor-pointer shadow-xl'
                      }`}
                  >
                    {item.isAlreadyVaulted ? (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-bl-[100px] flex items-start justify-end p-6">
                        <ShieldCheck className="w-6 h-6 text-slate-500" />
                      </div>
                    ) : isSelected && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-[100px] flex items-start justify-end p-6 animate-in slide-in-from-top-4 slide-in-from-right-4 duration-500">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                    )}

                    <div className="flex items-start gap-4 mb-6 relative z-10 w-full">
                      <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border flex items-center justify-center transition-all duration-500 shadow-xl shrink-0 ${isSelected ? 'border-emerald-500 text-emerald-400 scale-110' : 'border-black/5 dark:border-white/5 text-slate-500 group-hover:text-emerald-400/50'
                        }`}>
                        <Hash className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1 pr-8">
                        <h3 className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-tighter break-words">{item.hs_code}</h3>
                        <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] break-words block mt-1">Verified Tariff Code</span>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed mb-8 min-h-[4rem]">
                      {item.description}
                    </p>
                    <div className="pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isAlreadyVaulted ? (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Already in Vault</span>
                          </div>
                        ) : isSelected ? (
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Marked for Vault</span>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-700">
                            <Circle className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Tap to Select</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {hsCodes.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8 py-20 md:py-32 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[2rem] md:rounded-[3rem] bg-white/[0.01]">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-black/5 dark:border-white/5 flex items-center justify-center text-slate-700">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 opacity-20" />
            </div>
            <div className="text-center space-y-2 px-6">
              <h3 className="text-lg md:text-xl font-light text-slate-500 dark:text-slate-400 tracking-widest uppercase">Classification Ready</h3>
              <p className="text-slate-600 text-xs md:text-sm font-light">Target set to <b className="text-slate-500 dark:text-slate-400">{productType}</b>. revealing localized patterns.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HSCodeIntelligence;
