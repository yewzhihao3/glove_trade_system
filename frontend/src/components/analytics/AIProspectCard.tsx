import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, Building2, Package, Globe2, Activity, CalendarDays, Hash, FileText } from 'lucide-react';
import type { AIRecommendedBuyer } from '../../services/api';

interface AIProspectCardProps {
  buyer: AIRecommendedBuyer;
  index: number;
}

export default function AIProspectCard({ buyer, index }: AIProspectCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HOT': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'WARM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'COLD': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'High': return 'text-fuchsia-400';
      case 'Medium': return 'text-purple-400';
      case 'Low': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-all duration-300 hover:border-fuchsia-500/30">
      {/* ── Header Section (Always Visible) ── */}
      <div 
        className="p-5 cursor-pointer flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-4 items-start w-full md:w-auto">
          {/* Rank Badge */}
          <div className="w-8 h-8 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
            #{index + 1}
          </div>
          
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-outfit">
                {buyer.buyer_name}
              </h3>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Globe2 className="w-3.5 h-3.5" /> {buyer.country}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(buyer.activity_status)}`}>
                {buyer.activity_status} BUYER
              </span>
              <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20 text-[10px] font-bold uppercase tracking-wider">
                {buyer.archetype}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {buyer.recommendation_strength}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto pl-12 md:pl-0">
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-outfit">
              {buyer.score}
              <span className="text-sm font-medium text-slate-400 ml-1">/ 100</span>
            </div>
            <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getTierColor(buyer.confidence_tier)}`}>
              {buyer.confidence_tier} Confidence
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Summary Line ── */}
      <div className="px-5 pb-5 pl-17">
        <p className="text-sm text-slate-600 dark:text-slate-300 border-l-2 border-fuchsia-500/30 pl-3 py-1">
          {buyer.insight_summary}
        </p>
      </div>

      {/* ── Expanded Section ── */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            
            {/* Opportunity Signals */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Opportunity Signals
              </h4>
              <ul className="flex flex-col gap-2">
                {buyer.opportunity_signals.map((signal, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-fuchsia-500 mt-0.5">•</span>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>

            {/* Behavioral Metrics Grid */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Behavioral Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Package className="w-3 h-3" /> Avg Volume
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {buyer.behavioral_metrics.avg_order_volume}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Freq Pattern
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {buyer.behavioral_metrics.purchase_frequency}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Activity Window
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {buyer.behavioral_metrics.activity_window}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Dominant Size
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {buyer.behavioral_metrics.dominant_size || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
