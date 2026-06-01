import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import DashboardFilters from '../../components/analytics/DashboardFilters';
import KpiCards from '../../components/analytics/KpiCards';
import VolumeChart from '../../components/analytics/VolumeChart';
import TopDestinations from '../../components/analytics/TopDestinations';
import TopCustomers from '../../components/analytics/TopCustomers';
import { resolvePresetDates, type DateRangeValue } from '../../components/DateRangePicker';

const TradeDashboard: React.FC = () => {
  const initialPreset = resolvePresetDates('last-30');
  
  // Draft State (Controlled by DashboardFilters)
  const [draftDateRange, setDraftDateRange] = useState<DateRangeValue>({
    preset: 'last-30',
    dateFrom: initialPreset.dateFrom,
    dateTo: initialPreset.dateTo,
  });
  const [draftViewMode, setDraftViewMode] = useState<'trend' | 'compare'>('trend');
  const [draftAggregation, setDraftAggregation] = useState<'monthly' | 'yearly'>('monthly');

  // Applied State (Drives the dashboard widgets)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRangeValue>(draftDateRange);
  const [appliedViewMode, setAppliedViewMode] = useState<'trend' | 'compare'>(draftViewMode);
  const [appliedAggregation, setAppliedAggregation] = useState<'monthly' | 'yearly'>(draftAggregation);

  const [loadingWidgets, setLoadingWidgets] = useState<Record<string, boolean>>({});

  const handleLoadingChange = (widgetId: string, isLoading: boolean) => {
    setLoadingWidgets(prev => ({ ...prev, [widgetId]: isLoading }));
  };

  const isAnyLoading = Object.values(loadingWidgets).some(Boolean);

  const isDirty = 
    draftDateRange.preset !== appliedDateRange.preset ||
    draftDateRange.dateFrom !== appliedDateRange.dateFrom ||
    draftDateRange.dateTo !== appliedDateRange.dateTo ||
    draftViewMode !== appliedViewMode ||
    draftAggregation !== appliedAggregation;

  const handleApply = () => {
    setAppliedDateRange(draftDateRange);
    setAppliedViewMode(draftViewMode);
    setAppliedAggregation(draftAggregation);
  };

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
        dateRange={draftDateRange}
        setDateRange={setDraftDateRange}
        viewMode={draftViewMode}
        setViewMode={setDraftViewMode}
        aggregation={draftAggregation}
        setAggregation={setDraftAggregation}
        isDirty={isDirty}
        onApply={handleApply}
        isLoading={isAnyLoading}
      />

      {/* KPI Row (Dynamic & Reactive to dateRange) */}
      <KpiCards 
        dateRange={appliedDateRange} 
        onLoadChange={(l) => handleLoadingChange('kpi', l)} 
      />

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        
        {/* Main Volume Chart (Takes full width) */}
        <div className="lg:col-span-2">
          <VolumeChart 
            dateRange={appliedDateRange} 
            viewMode={appliedViewMode} 
            aggregation={appliedAggregation} 
            onLoadChange={(l) => handleLoadingChange('volume', l)} 
          />
        </div>

        {/* Secondary Charts */}
        <TopDestinations 
          dateRange={appliedDateRange} 
          onLoadChange={(l) => handleLoadingChange('destinations', l)} 
        />
        
        <TopCustomers 
          dateRange={appliedDateRange} 
          onLoadChange={(l) => handleLoadingChange('customers', l)} 
        />

      </div>

    </div>
  );
};

export default TradeDashboard;
