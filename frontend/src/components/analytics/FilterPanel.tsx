import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export interface FilterState {
  search: string;
  date_from: string;
  date_to: string;
  company_name: string;
  country: string;
  product_code: string;
  item_no: string;
  posting_group: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onApply: () => void;
  onClear: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange, onApply, onClear }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-xl p-6 h-full flex flex-col relative overflow-hidden shadow-sm dark:shadow-none">
      <div className="flex items-center gap-2 mb-6 text-slate-900 dark:text-slate-200">
        <Filter className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
        <h3 className="text-lg font-semibold">Filters</h3>
      </div>

      <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Global Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search anything..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">From</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">To</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleChange}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Direct Fields */}
        {[
          { name: 'company_name', label: 'Company Name' },
          { name: 'country', label: 'Country' },
          { name: 'product_code', label: 'Product Code' },
          { name: 'item_no', label: 'Item No' },
          { name: 'posting_group', label: 'Posting Group' }
        ].map(field => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{field.label}</label>
            <input
              type="text"
              name={field.name}
              value={filters[field.name as keyof FilterState]}
              onChange={handleChange}
              placeholder={`Filter by ${field.label.toLowerCase()}...`}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
        <button
          onClick={onApply}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20"
        >
          Apply Filters
        </button>
        <button
          onClick={onClear}
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
