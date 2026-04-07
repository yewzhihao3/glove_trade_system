import React, { useEffect, useState } from 'react';
import { tradeService, type AnalyticalResult } from '../../services/api';
import ChartCard from '../../components/analytics/ChartCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Globe, Package, TrendingUp } from 'lucide-react';

const TradeDashboard: React.FC = () => {
  const [topBuyers, setTopBuyers] = useState<AnalyticalResult[]>([]);
  const [topCountries, setTopCountries] = useState<AnalyticalResult[]>([]);
  const [topProducts, setTopProducts] = useState<AnalyticalResult[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<AnalyticalResult[]>([]);
  const [loading, setLoading] = useState(true);

  // KPIs
  const [totalVolume, setTotalVolume] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [buyers, countries, products, trend] = await Promise.all([
          tradeService.getTopBuyers(5),
          tradeService.getTopCountries(5),
          tradeService.getTopProducts(5),
          tradeService.getMonthlyTrend()
        ]);

        setTopBuyers(buyers);
        setTopCountries(countries);
        setTopProducts(products);
        setMonthlyTrend(trend);

        // Sum up total volume for KPIs from trend
        const total = trend.reduce((sum, item) => sum + item.total_quantity_pcs, 0);
        setTotalVolume(total);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);

  const kpis = [
    { label: 'Total Volume (PCS)', value: formatNumber(totalVolume), icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Top Buyer', value: topBuyers[0]?.company_name || 'N/A', icon: Users, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Top Country', value: topCountries[0]?.ship_to_country || 'N/A', icon: Globe, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Top Product', value: topProducts[0]?.product_code || 'N/A', icon: Package, color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="h-full flex flex-col relative z-10 scroll-smooth">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-outfit mb-2 group flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-500 group-hover:rotate-12 transition-transform" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">High-level overview of global trade operations and performance metrics.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 shadow-sm dark:shadow-lg flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value.length > 20 ? kpi.value.substring(0, 17) + '...' : kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        
        {/* Monthly Trend */}
        <div className="lg:col-span-2">
          <ChartCard title="Monthly Volume Trend" description="Total quantity shipped over time" isLoading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={formatNumber} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Line type="monotone" dataKey="total_quantity_pcs" name="Quantity (PCS)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top Countries */}
        <ChartCard title="Top Destinations" description="Highest volume by country" isLoading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCountries} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="ship_to_country" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={formatNumber} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
              />
              <Bar dataKey="total_quantity_pcs" name="Quantity (PCS)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Buyers */}
        <ChartCard title="Top Customers" description="Highest volume by company" isLoading={loading}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topBuyers} layout="vertical" margin={{ top: 20, right: 30, left: 50, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={formatNumber} />
              <YAxis dataKey="company_name" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
              />
              <Bar dataKey="total_quantity_pcs" name="Quantity (PCS)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
};

export default TradeDashboard;
