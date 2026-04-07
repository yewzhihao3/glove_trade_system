import React, { useState, useEffect } from 'react';
import { tradeService, type TradeHistory, type PaginatedHistoryResponse } from '../../services/api';
import FilterPanel, { type FilterState } from '../../components/analytics/FilterPanel';
import { Database, ChevronLeft, ChevronRight } from 'lucide-react';

const initialFilters: FilterState = {
  search: '',
  date_from: '',
  date_to: '',
  company_name: '',
  country: '',
  product_code: '',
  item_no: '',
  posting_group: ''
};

const TradeExplore: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilters);
  
  const [data, setData] = useState<TradeHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 50; // default page size

  const fetchHistory = async (currentPage: number, appliedFilters: FilterState) => {
    setLoading(true);
    try {
      // Build params filtering out empty strings
      const params: any = { page: currentPage, page_size: pageSize };
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const response: PaginatedHistoryResponse = await tradeService.getHistory(params);
      setData(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when page or active filters change
  useEffect(() => {
    fetchHistory(page, activeFilters);
  }, [page, activeFilters]);

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    setPage(1); // Reset to page 1 on new filter
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setActiveFilters(initialFilters);
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="h-full flex flex-col relative z-10 scroll-smooth">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 font-outfit mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-emerald-500" />
            Data Explorer
          </h1>
          <p className="text-slate-400">Deep dive into millions of raw trade history records.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <FilterPanel 
            filters={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Table Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
          
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/30">
            <h3 className="text-slate-200 font-medium">
              Showing {data.length > 0 ? ((page - 1) * pageSize) + 1 : 0} - {Math.min(page * pageSize, total)} of <span className="text-emerald-400 font-bold">{total}</span> records
            </h3>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400">
                Page <span className="text-slate-200">{page}</span> of {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar relative">
            {loading && (
              <div className="absolute inset-0 z-10 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            )}
            
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 sticky top-0 z-0">
                <tr>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 font-medium">Company</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Product Code</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Item No</th>
                  <th className="px-6 py-4 font-medium text-right">Quantity</th>
                  <th className="px-6 py-4 font-medium">Country</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Invoice No</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      No records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{row.posting_date}</td>
                      <td className="px-6 py-4 font-medium text-emerald-400">{row.company_name}</td>
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{row.product_code}</td>
                      <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{row.item_no}</td>
                      <td className="px-6 py-4 text-slate-300 text-right font-mono">{row.total_quantity_pcs.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-300">{row.ship_to_country}</td>
                      <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{row.invoice_no}</td>
                      <td className="px-6 py-4 text-slate-400 break-words max-w-[200px]" title={row.description_brand}>{row.description_brand}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TradeExplore;
