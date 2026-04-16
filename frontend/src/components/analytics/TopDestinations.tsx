import React, { useEffect, useState } from 'react';
import { tradeService, type DateParams } from '../../services/api';
import ChartCard from './ChartCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DateRangeValue } from '../DateRangePicker';

export interface TopDestinationsProps {
  dateRange: DateRangeValue;
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

const TopDestinations: React.FC<TopDestinationsProps> = ({ dateRange }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const dates: DateParams = {
          date_from: dateRange.dateFrom || undefined,
          date_to: dateRange.dateTo || undefined
        };
        const res = await tradeService.getTopCountries(8, dates);
        if (active) setData(res);
      } catch (err) {
        console.error('Failed to load top destinations', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => { active = false; };
  }, [dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-400 mb-1 font-medium">{label}</p>
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: payload[0].color }} className="font-bold">Volume:</span>
            <span className="text-white">{formatNumber(payload[0].value)} PCS</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading && data.length === 0) {
    return (
      <ChartCard title="Top Destinations" description="Highest volume by country">
        <div className="w-full h-[300px] flex items-center justify-center">
            <div className="flex w-full px-8 items-end gap-4 h-48 animate-pulse opacity-50">
                {[40, 70, 50, 90, 30].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
            </div>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Top Destinations" description="Highest volume by country">
      <div className="relative w-full h-[300px] transition-opacity duration-300" style={{ opacity: loading ? 0.5 : 1 }}>
        {data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-slate-800/20">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
              <XAxis dataKey="ship_to_country" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatNumber} width={50} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CustomTooltip />} />
              <Bar dataKey="total_quantity_pcs" name="Quantity (PCS)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
};

export default TopDestinations;
