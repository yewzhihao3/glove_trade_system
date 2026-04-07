import React, { useEffect, useState } from 'react';
import { tradeService, type AnalyticalResult } from '../../services/api';
import ChartCard from '../../components/analytics/ChartCard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb } from 'lucide-react';

const TradeInsights: React.FC = () => {
  const [topBuyers, setTopBuyers] = useState<AnalyticalResult[]>([]);
  const [topCountries, setTopCountries] = useState<AnalyticalResult[]>([]);
  const [topProducts, setTopProducts] = useState<AnalyticalResult[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyTrend, setCompanyTrend] = useState<AnalyticalResult[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const [buyers, countries, products] = await Promise.all([
          tradeService.getTopBuyers(15), 
          tradeService.getTopCountries(15),
          tradeService.getTopProducts(15)
        ]);
        setTopBuyers(buyers);
        setTopCountries(countries);
        setTopProducts(products);
      } catch (error) {
        console.error('Failed to load insights', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  // Fetch trend when a company is clicked
  useEffect(() => {
    if (selectedCompany) {
      const fetchTrend = async () => {
        setTrendLoading(true);
        try {
          const trend = await tradeService.getCompanyTrend(selectedCompany);
          setCompanyTrend(trend);
        } catch (error) {
          console.error('Failed to load company trend', error);
        } finally {
          setTrendLoading(false);
        }
      };
      fetchTrend();
    }
  }, [selectedCompany]);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);

  const handleBuyerClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      setSelectedCompany(data.activePayload[0].payload.company_name);
      // smoothly scroll down to trend area
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    }
  };

  return (
    <div className="h-full flex flex-col relative z-10 scroll-smooth pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 font-outfit mb-2 flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-amber-500" />
          Market Insights
        </h1>
        <p className="text-slate-400">Deep aggregated analytics to uncover strategic advantages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Top Buyers */}
        <div className="lg:col-span-2">
          <ChartCard 
            title="Top 15 Global Buyers" 
            description="Click a bar to reveal the company's historical purchasing trend" 
            isLoading={loading}
          >
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={topBuyers} margin={{ top: 20, right: 30, left: 20, bottom: 60 }} onClick={handleBuyerClick}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="company_name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-45} textAnchor="end" />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={formatNumber} />
                <Tooltip 
                  cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
                />
                <Bar dataKey="total_quantity_pcs" name="Quantity (PCS)" fill="#3b82f6" radius={[4, 4, 0, 0]} className="cursor-pointer hover:opacity-80 transition-opacity" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Selected Company Trend (Conditional) */}
        {selectedCompany && (
          <div className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChartCard 
              title={`Purchasing Trend: ${selectedCompany === "" ? "Unknown" : selectedCompany}`} 
              description="Historical analysis of monthly orders" 
              isLoading={trendLoading}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={companyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={formatNumber} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#f59e0b' }}
                  />
                  <Line type="monotone" dataKey="total_quantity_pcs" name="Quantity (PCS)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Top Countries */}
        <ChartCard title="Strategic Corridors (Top 15 Countries)" isLoading={loading}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topCountries} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={formatNumber} />
              <YAxis dataKey="ship_to_country" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
              />
              <Bar dataKey="total_quantity_pcs" name="Quantity (PCS)" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top Products */}
        <ChartCard title="Leading Product Codes" isLoading={loading}>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={formatNumber} />
              <YAxis dataKey="product_code" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
              />
              <Bar dataKey="total_quantity_pcs" name="Quantity (PCS)" fill="#14b8a6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
};

export default TradeInsights;
