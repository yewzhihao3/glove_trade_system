import React, { useEffect, useState } from 'react';
import { tradeService, type DateParams } from '../../services/api';
import { Users, Globe, Package, TrendingUp } from 'lucide-react';
import type { DateRangeValue } from '../DateRangePicker';

export interface KpiCardsProps {
  dateRange: DateRangeValue;
}

const KpiCards: React.FC<KpiCardsProps> = ({ dateRange }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalVolume: 0,
    topBuyer: 'N/A',
    topCountry: 'N/A',
    topProduct: 'N/A',
  });

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const dates: DateParams = {
          date_from: dateRange.dateFrom || undefined,
          date_to: dateRange.dateTo || undefined
        };

        const [buyers, countries, products, trend] = await Promise.all([
          tradeService.getTopBuyers(1, dates),
          tradeService.getTopCountries(1, dates),
          tradeService.getTopProducts(1, dates),
          tradeService.getMonthlyTrend(dates)
        ]);

        if (!active) return;

        const total = trend.reduce((sum, item) => sum + item.total_quantity_pcs, 0);

        setMetrics({
          totalVolume: total,
          topBuyer: buyers[0]?.company_name || 'N/A',
          topCountry: countries[0]?.ship_to_country || 'N/A',
          topProduct: products[0]?.product_code || 'N/A',
        });
      } catch (error) {
        console.error('Failed to load KPIs', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
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

  const kpis = [
    { label: 'Total Volume (PCS)', value: formatNumber(metrics.totalVolume), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', stat: '+12% vs last' },
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

            {/* Context Label & Fake Trend */}
            <div className="mt-4 flex items-center justify-between text-[11px] font-medium border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-slate-400 dark:text-slate-500">{getContextLabel()}</span>
              {idx === 0 && (
                <span className="text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  ▲ 12%
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
