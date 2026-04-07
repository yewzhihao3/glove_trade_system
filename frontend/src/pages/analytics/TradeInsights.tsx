import { useEffect, useState, useRef } from 'react';
import { tradeService, type AnalyticalResult, type PotentialBuyer, type DateParams } from '../../services/api';
import ChartCard from '../../components/analytics/ChartCard';
import DateRangePicker, { type DateRangeValue, resolvePresetDates } from '../../components/DateRangePicker';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb, Download, Filter } from 'lucide-react';
import { exportToCSV } from '../../utils/export';

type TabCategory = 'Buyers' | 'Products' | 'Geography' | 'Operations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDateParams(range: DateRangeValue): DateParams {
  return {
    date_from: range.dateFrom ?? undefined,
    date_to: range.dateTo ?? undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeInsights() {
  // Tab & metric
  const [activeTab, setActiveTab]     = useState<TabCategory>('Buyers');
  const [activeMetric, setActiveMetric] = useState<string>('top-buyers');

  // Date range — defaults to "Last 30 Days"
  const initialPreset = resolvePresetDates('last-30');
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    preset: 'last-30',
    dateFrom: initialPreset.dateFrom,
    dateTo: initialPreset.dateTo,
  });

  // Data
  const [chartData, setChartData]             = useState<AnalyticalResult[]>([]);
  const [prevData, setPrevData]               = useState<AnalyticalResult[]>([]);   // kept visible during loads
  const [potentialBuyers, setPotentialBuyers] = useState<PotentialBuyer[]>([]);
  const [loading, setLoading]                 = useState(false);

  // Potential-buyers filters
  const [minTransactions, setMinTransactions] = useState<number>(1);
  const [minValue, setMinValue]               = useState<number>(0);

  // Debounce ref so rapid filter changes don't fire many requests
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Tab config ─────────────────────────────────────────────────────────────

  const TABS: { id: TabCategory; label: string; metrics: { value: string; label: string }[] }[] = [
    {
      id: 'Buyers',
      label: 'Buyers & Leads',
      metrics: [
        { value: 'top-buyers',       label: 'Top Buyers by Volume'        },
        { value: 'potential-buyers', label: 'Potential Buyers (Lead Gen)' },
      ],
    },
    {
      id: 'Products',
      label: 'Products Analysis',
      metrics: [
        { value: 'top-products', label: 'Top Product Codes'      },
        { value: 'top-sizes',    label: 'Top Sizes'              },
        { value: 'top-items',    label: 'Top Item Numbers (SKUs)' },
      ],
    },
    {
      id: 'Geography',
      label: 'Geographic Markets',
      metrics: [
        { value: 'top-countries', label: 'Top Destination Countries' },
      ],
    },
    {
      id: 'Operations',
      label: 'Business Operations',
      metrics: [
        { value: 'monthly-trend',   label: 'Monthly Sales Volume' },
        { value: 'yearly-trend',    label: 'Yearly Sales Volume'  },
        { value: 'top-salespeople', label: 'Top Salespeople'      },
      ],
    },
  ];

  // ─── Effects ─────────────────────────────────────────────────────────────────

  // When the tab changes, auto-select its first metric
  useEffect(() => {
    const defaultMetric = TABS.find(t => t.id === activeTab)?.metrics[0].value;
    if (defaultMetric) setActiveMetric(defaultMetric);
  }, [activeTab]);

  // Fetch whenever metric, date range, or potential-buyer filters change
  // Debounced to avoid double-firing on activeTab → activeMetric cascade
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchActiveData(), 80);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [activeMetric, dateRange, minTransactions, minValue]);

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchActiveData = async () => {
    setLoading(true);
    const dates = buildDateParams(dateRange);

    try {
      if (activeMetric === 'potential-buyers') {
        const pb = await tradeService.getPotentialBuyers(minTransactions, minValue, dates);
        setPotentialBuyers(pb);
        return;
      }

      let res: AnalyticalResult[] = [];
      switch (activeMetric) {
        case 'top-buyers':     res = await tradeService.getTopBuyers(20, dates);     break;
        case 'top-products':   res = await tradeService.getTopProducts(20, dates);   break;
        case 'top-sizes':      res = await tradeService.getTopSizes(20, dates);      break;
        case 'top-items':      res = await tradeService.getTopItems(20, dates);      break;
        case 'top-countries':  res = await tradeService.getTopCountries(20, dates);  break;
        case 'monthly-trend':  res = await tradeService.getMonthlyTrend(dates);      break;
        case 'yearly-trend':   res = await tradeService.getYearlyTrend(dates);       break;
        case 'top-salespeople': res = await tradeService.getTopSalespeople(20, dates); break;
      }

      setPrevData(res);   // keep for smooth transition
      setChartData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const handleExport = () => {
    if (activeMetric === 'potential-buyers') {
      exportToCSV(potentialBuyers, 'Potential_Buyers_Report');
    } else {
      exportToCSV(chartData, `${activeMetric}_Report`);
    }
  };

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);

  // ─── Render active view ───────────────────────────────────────────────────────

  const renderActiveView = () => {
    // While loading, show previous data faded so there's no blank flash
    const displayData = loading ? prevData : chartData;

    if (activeMetric === 'potential-buyers') {
      return (
        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden mt-4 transition-opacity duration-300 shadow-sm dark:shadow-none" style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
            <Filter className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">Min. Transactions:</span>
              <input
                type="number" min="1"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-20 text-sm outline-none focus:border-emerald-500 transition-colors"
                value={minTransactions}
                onChange={(e) => setMinTransactions(Number(e.target.value) || 1)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">Min. Total Qty:</span>
              <input
                type="number" min="0"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1 w-24 text-sm outline-none focus:border-emerald-500 transition-colors"
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wider">
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Company Name</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Country</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Orders</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Total Quantity</th>
                  <th className="p-4 border-b border-slate-200 dark:border-slate-700">Activity Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 text-sm">
                {potentialBuyers.length > 0 ? (
                  potentialBuyers.map((pb, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-slate-700 dark:text-slate-200">
                      <td className="p-4 max-w-[200px] truncate" title={pb.company_name}>{pb.company_name}</td>
                      <td className="p-4">{pb.country}</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-medium">{pb.total_orders}</td>
                      <td className="p-4">{pb.total_quantity_pcs.toLocaleString()} PCS</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          pb.activity_period.includes('Recent')
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {pb.activity_period}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      {loading ? 'Loading…' : 'No buyers match the current criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // ── Category axis key lookup ─────────────────────────────────────
    const KEY_MAP: Record<string, string> = {
      'top-buyers':     'company_name',
      'top-countries':  'ship_to_country',
      'top-products':   'product_code',
      'top-sizes':      'size',
      'top-items':      'item_no',
      'monthly-trend':  'month',
      'yearly-trend':   'year',
      'top-salespeople':'salesperson',
    };
    const categoryKey = KEY_MAP[activeMetric] ?? 'company_name';
    const isHorizontal = ['top-countries','top-products','top-sizes','top-items','top-salespeople'].includes(activeMetric);
    const isTrend      = activeMetric.includes('trend');
    const chartTitle   = TABS.flatMap(t => t.metrics).find(m => m.value === activeMetric)?.label ?? 'Analysis';
    const barFill      = ['top-products','top-sizes','top-items'].includes(activeMetric) ? '#10b981' : '#3b82f6';

    if (isTrend) {
      return (
        <div className="mt-4 transition-opacity duration-300" style={{ opacity: loading ? 0.6 : 1 }}>
          <ChartCard title={chartTitle}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey={categoryKey} stroke="#94a3b8" tick={{ fill:'#94a3b8' }} angle={-45} textAnchor="end" />
                <YAxis stroke="#94a3b8" tick={{ fill:'#94a3b8' }} tickFormatter={formatNumber} />
                <RechartsTooltip contentStyle={{ backgroundColor:'#0f172a', border:'1px solid #334155', borderRadius:'0.5rem' }} />
                <Line type="monotone" dataKey="total_quantity_pcs" name="Quantity (PCS)" stroke="#3b82f6" strokeWidth={3} dot={{ r:4, fill:'#0f172a', strokeWidth:2 }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      );
    }

    return (
      <div className="mt-4 transition-opacity duration-300" style={{ opacity: loading ? 0.6 : 1 }}>
        <ChartCard title={chartTitle}>
          <ResponsiveContainer width="100%" height={isHorizontal ? 450 : 400}>
            <BarChart
              data={displayData}
              layout={isHorizontal ? 'vertical' : 'horizontal'}
              margin={isHorizontal ? { top:20, right:30, left:100, bottom:5 } : { top:20, right:30, left:20, bottom:80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={!isHorizontal} vertical={isHorizontal} />
              {isHorizontal ? (
                <>
                  <XAxis type="number"   stroke="#94a3b8" tick={{ fill:'#94a3b8' }} tickFormatter={formatNumber} />
                  <YAxis dataKey={categoryKey} type="category" stroke="#94a3b8" tick={{ fill:'#94a3b8', fontSize:12 }} width={90} />
                </>
              ) : (
                <>
                  <XAxis dataKey={categoryKey} stroke="#94a3b8" tick={{ fill:'#94a3b8', fontSize:11 }} angle={-45} textAnchor="end" />
                  <YAxis stroke="#94a3b8" tick={{ fill:'#94a3b8' }} tickFormatter={formatNumber} />
                </>
              )}
              <RechartsTooltip cursor={{ fill:'rgba(59,130,246,0.1)' }} contentStyle={{ backgroundColor:'#0f172a', border:'1px solid #334155', borderRadius:'0.5rem' }} />
              <Bar dataKey="total_quantity_pcs" name="Quantity (PCS)" fill={barFill} radius={isHorizontal ? [0,4,4,0] : [4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    );
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col relative z-10 scroll-smooth pb-12">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-outfit mb-2 flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-amber-500" />
            Data Analysis Explorer
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Deep aggregated analytics to uncover strategic advantages.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto scrollbar-hide mb-6 border-b border-slate-200 dark:border-slate-700/50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Filter bar: Date Range + Metric selector ────────────────── */}
      <div className="bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 mb-6 flex flex-wrap items-center gap-6 shadow-sm dark:shadow-none">

        {/* Date Range Picker */}
        <DateRangePicker
          value={dateRange}
          onChange={(v) => setDateRange(v)}
        />

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

        {/* Metric selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Select Metric:</span>
          <select
            value={activeMetric}
            onChange={(e) => setActiveMetric(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 cursor-pointer shadow-inner w-48 md:w-64"
          >
            {TABS.find(t => t.id === activeTab)?.metrics.map(m => (
              <option key={m.value} value={m.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{m.label}</option>
            ))}
          </select>
        </div>

        {/* Loading indicator */}
        {loading && (
          <span className="text-xs text-slate-500 animate-pulse ml-auto">Refreshing data…</span>
        )}
      </div>

      {/* ── Chart / Table content ────────────────────────────────────── */}
      <div className="min-h-[400px]">
        {renderActiveView()}
      </div>

    </div>
  );
}
