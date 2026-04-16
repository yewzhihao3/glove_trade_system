import React, { useEffect, useState } from 'react';
import { tradeService, type DateParams } from '../../services/api';
import ChartCard from './ChartCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DateRangeValue } from '../DateRangePicker';
import { Activity } from 'lucide-react';

export interface VolumeChartProps {
  dateRange: DateRangeValue;
  viewMode: 'trend' | 'compare';
  aggregation: 'monthly' | 'yearly';
}

const formatNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const VolumeChart: React.FC<VolumeChartProps> = ({ dateRange, viewMode, aggregation }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeYears, setActiveYears] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const dates: DateParams = {
          date_from: dateRange.dateFrom || undefined,
          date_to: dateRange.dateTo || undefined
        };

        let res: any[] = [];
        
        if (viewMode === 'compare' && aggregation === 'monthly') {
          res = await tradeService.getYoyComparison(dates);
          // Initialize legend states for toggle
          if (res.length > 0) {
            const keys = Object.keys(res[0]).filter(k => k.endsWith('_qty'));
            const initialStates: Record<string, boolean> = {};
            keys.forEach(k => initialStates[k] = true);
            if (active) setActiveYears(initialStates);
          }
        } else if (aggregation === 'yearly') {
          res = await tradeService.getYearlyTrend(dates);
        } else {
          res = await tradeService.getMonthlyTrend(dates);
        }

        if (active) {
          setData(res);
        }
      } catch (error) {
        console.error('Failed to load chart data', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchChartData();
    return () => { active = false; };
  }, [dateRange, viewMode, aggregation]);

  const toggleYear = (key: string) => {
    setActiveYears(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex items-center justify-center gap-4 pt-4">
        {payload.map((entry: any, index: number) => {
          const isActive = activeYears[entry.dataKey] !== false;
          return (
            <li 
              key={`item-${index}`} 
              className="flex items-center gap-2 cursor-pointer text-xs font-medium transition-opacity"
              style={{ opacity: isActive ? 1 : 0.4 }}
              onClick={() => toggleYear(entry.dataKey)}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-700 dark:text-slate-300">{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-400 mb-2 font-medium">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center gap-3 text-sm">
              <span style={{ color: p.color }} className="font-bold">{p.name}:</span>
              <span className="text-white">{formatNumber(p.value)} PCS</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && data.length === 0) {
    return (
      <ChartCard title="Monthly Volume Trend" description="Loading metrics...">
        <div className="w-full h-[400px] flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-slate-400 font-medium">Aggregating dataset...</span>
          </div>
        </div>
      </ChartCard>
    );
  }

  const isCompare = viewMode === 'compare' && aggregation === 'monthly';
  const xKey = isCompare ? 'month_label' : (aggregation === 'yearly' ? 'year' : 'month');
  
  // Empty Check
  const isEmpty = data.length === 0 || (isCompare && Object.keys(activeYears).length === 0);

  return (
    <ChartCard 
      title={isCompare ? "Year-over-Year Comparison" : "Volume Trend Explorer"} 
      description={isCompare ? "Multi-year monthly overlay" : "Total quantity shipped over time"}
    >
      <div className="relative w-full h-[420px] transition-opacity duration-300" style={{ opacity: loading ? 0.5 : 1 }}>
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 z-10 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-slate-800/20">
            <Activity className="w-12 h-12 mb-3 opacity-30" />
            <p>No data available for the selected range.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
              
              <XAxis 
                dataKey={xKey} 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8' }} 
                // Connect nulls applies mostly to the lines, but we ensure missing x points don't break layout
              />
              
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fill: '#94a3b8' }} 
                tickFormatter={formatNumber} 
                width={60}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {isCompare ? (
                <>
                  <Legend content={renderLegend} verticalAlign="bottom" height={36} />
                  {Object.keys(activeYears).sort().map((key, idx) => (
                    activeYears[key] && (
                      <Line 
                        key={key} 
                        type="monotone" 
                        dataKey={key} 
                        name={key.replace('_qty', '')} 
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} 
                        activeDot={{ r: 8, strokeWidth: 0 }}
                        connectNulls={false} 
                      />
                    )
                  ))}
                </>
              ) : (
                <Line 
                  type="monotone" 
                  dataKey="total_quantity_pcs" 
                  name="Volume" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }} 
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
};

export default VolumeChart;
