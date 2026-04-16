import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import DashboardFilters from '../../components/analytics/DashboardFilters';
import KpiCards from '../../components/analytics/KpiCards';
import VolumeChart from '../../components/analytics/VolumeChart';
import TopDestinations from '../../components/analytics/TopDestinations';
import TopCustomers from '../../components/analytics/TopCustomers';
import { resolvePresetDates, type DateRangeValue } from '../../components/DateRangePicker';

const TradeDashboard: React.FC = () => {
  // Global State for the Dashboard Orchestrator
  const initialPreset = resolvePresetDates('last-30');
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: 'last-30',
    dateFrom: initialPreset.dateFrom,
    dateTo: initialPreset.dateTo,
  });

  const [viewMode, setViewMode] = useState<'trend' | 'compare'>('trend');
  const [aggregation, setAggregation] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="h-full flex flex-col relative z-10 scroll-smooth pb-12">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-outfit mb-2 group flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-500 group-hover:rotate-12 transition-transform" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          High-level overview of global trade operations with scalable time-series exploration.
        </p>
      </div>

      {/* Global Filter Bar */}
      <DashboardFilters 
        dateRange={dateRange}
        setDateRange={setDateRange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        aggregation={aggregation}
        setAggregation={setAggregation}
      />

      {/* KPI Row (Dynamic & Reactive to dateRange) */}
      <KpiCards dateRange={dateRange} />

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        
        {/* Main Volume Chart (Takes full width) */}
        <div className="lg:col-span-2">
          <VolumeChart 
            dateRange={dateRange} 
            viewMode={viewMode} 
            aggregation={aggregation} 
          />
        </div>

        {/* Secondary Charts */}
        <TopDestinations dateRange={dateRange} />
        
        <TopCustomers dateRange={dateRange} />

      </div>

    </div>
  );
};

export default TradeDashboard;
