import React from 'react';
import DateRangePicker, { type DateRangeValue } from '../DateRangePicker';

export interface DashboardFiltersProps {
  dateRange: DateRangeValue;
  setDateRange: (val: DateRangeValue) => void;
  viewMode: 'trend' | 'compare';
  setViewMode: (mode: 'trend' | 'compare') => void;
  aggregation: 'monthly' | 'yearly';
  setAggregation: (agg: 'monthly' | 'yearly') => void;
  isDirty?: boolean;
  onApply?: () => void;
  isLoading?: boolean;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  dateRange,
  setDateRange,
  viewMode,
  setViewMode,
  aggregation,
  setAggregation,
  isDirty = false,
  onApply,
  isLoading = false
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 mb-6 flex flex-wrap items-center gap-6 shadow-sm dark:shadow-none">
      
      {/* Date Range Selection */}
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
      />

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

      {/* Mode Toggle */}
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setViewMode('trend')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
            viewMode === 'trend'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Trend
        </button>
        <button
          onClick={() => setViewMode('compare')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
            viewMode === 'compare'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Compare (YoY)
        </button>
      </div>

      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

      {/* Aggregation Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Aggregation:</span>
        <select
          value={aggregation}
          onChange={(e) => setAggregation(e.target.value as 'monthly' | 'yearly')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 cursor-pointer shadow-inner w-32"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="flex-1" />

      {/* Apply Button */}
      {onApply && (
        <button
          onClick={onApply}
          disabled={!isDirty || isLoading}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all ${
            isDirty && !isLoading
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              Applying...
            </>
          ) : (
            'Apply Filters'
          )}
        </button>
      )}

    </div>
  );
};

export default DashboardFilters;
