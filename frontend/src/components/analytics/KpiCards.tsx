import React, { useEffect, useState } from 'react';
import { tradeService, type DateParams, type KpiSummaryResponse, type KpiGrowthStatus } from '../../services/api';
import { Users, Globe, Package, TrendingUp } from 'lucide-react';
import type { DateRangeValue } from '../DateRangePicker';

export interface KpiCardsProps {
  dateRange: DateRangeValue;
  onLoadChange?: (isLoading: boolean) => void;
}

const KpiCards: React.FC<KpiCardsProps> = ({ dateRange, onLoadChange }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalVolume: 0,
    topBuyer: 'N/A',
    topCountry: 'N/A',
    topProduct: 'N/A',
  });
  const [summary, setSummary] = useState<KpiSummaryResponse | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    
    const fetchData = async () => {
      setLoading(true);
      onLoadChange?.(true);
      try {
        const dates: DateParams = {
          date_from: dateRange.dateFrom || undefined,
          date_to: dateRange.dateTo || undefined,
          signal: controller.signal
        };

        const [buyers, countries, products, kpiSummary] = await Promise.all([
          tradeService.getTopBuyers(1, dates),
          tradeService.getTopCountries(1, dates),
          tradeService.getTopProducts(1, dates),
          tradeService.getKpiSummary(dates)
        ]);

        if (!active) return;
        
        setSummary(kpiSummary);
        setMetrics({
          totalVolume: kpiSummary.current_metrics.volume || 0,
          topBuyer: buyers[0]?.company_name || 'N/A',
          topCountry: countries[0]?.ship_to_country || 'N/A',
          topProduct: products[0]?.product_code || 'N/A',
        });
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;
        console.error('Failed to load KPIs', error);
      } finally {
        if (active) {
          setLoading(false);
          onLoadChange?.(false);
        }
      }
    };
    fetchData();
    return () => { 
      active = false; 
      controller.abort();
    };
  }, [dateRange]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);

  const getContextLabel = () => {
    if (dateRange.dateFrom && dateRange.dateTo) {
      return `${dateRange.dateFrom} to ${dateRange.dateTo}`;
    }
    if (dateRange.dateFrom) return `Since ${dateRange.dateFrom}`;
    if (dateRange.dateTo) return `Up to ${dateRange.dateTo}`;
    return 'All Time';
  };

  const getGrowthBadge = (pct: number | null, status?: KpiGrowthStatus) => {
    switch (status) {
      case 'positive':
        return { label: `▲ ${pct?.toFixed(1)}%`, style: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', tooltip: 'Compared with previous equivalent period' };
      case 'negative':
        return { label: `▼ ${Math.abs(pct || 0).toFixed(1)}%`, style: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10', tooltip: 'Compared with previous equivalent period' };
      case 'fully_declined':
        return { label: `▼ 100.0%`, style: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10', tooltip: 'Compared with previous equivalent period' };
      case 'new_activity':
        return { label: 'New Activity', style: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10', tooltip: 'No volume in previous equivalent period' };
      case 'unavailable':
        return { label: 'N/A', style: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10', tooltip: 'No comparison period available' };
      case 'neutral':
      default:
        return { label: '0.0%', style: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10', tooltip: 'Compared with previous equivalent period' };
    }
  };

  const growthPct = summary?.growth?.volume_pct ?? null;
  const growthStatus = summary?.growth_status || 'unavailable';
  const badge = getGrowthBadge(growthPct, growthStatus);

  const kpis = [
    { label: 'Total Volume (PCS)', value: formatNumber(metrics.totalVolume), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Top Buyer', value: metrics.topBuyer, icon: Users, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Top Country', value: metrics.topCountry, icon: Globe, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Top Product', value: metrics.topProduct, icon: Package, color: 'text-amber-600 dark:text-amber-400' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 h-32 animate-pulse flex gap-4">
             <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-700/50 shrink-0" />
             <div className="flex-1 space-y-3 py-1">
               <div className="h-4 bg-slate-200 dark:bg-slate-700/50 rounded w-1/2" />
               <div className="h-6 bg-slate-200 dark:bg-slate-700/50 rounded w-3/4" />
             </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div key={idx} className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm dark:shadow-lg flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
            
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 ${kpi.color} group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 truncate">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {kpi.value.length > 20 ? kpi.value.substring(0, 17) + '...' : kpi.value}
                </p>
              </div>
            </div>

            {/* Context Label & Dynamic Trend */}
            <div className="mt-4 flex items-center justify-between text-[11px] font-medium border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-slate-400 dark:text-slate-500">{getContextLabel()}</span>
              {idx === 0 && (
                <span 
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${badge.style}`}
                  title={badge.tooltip}
                >
                  {badge.label}
                </span>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;
