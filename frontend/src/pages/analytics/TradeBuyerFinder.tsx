import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  tradeService,
  filterService,
  type BuyerByProduct,
  type RecommendedBuyer,
  type BuyerFinderParams,
} from '../../services/api';
import DateRangePicker, {
  type DateRangeValue,
  resolvePresetDates,
} from '../../components/DateRangePicker';
import SearchableSelect from '../../components/SearchableSelect';
import {
  Search,
  RotateCcw,
  Users,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
  Loader2,
  X,
  Info,
  Download,
  Package,
  Tag,
} from 'lucide-react';
import { exportToCSV } from '../../utils/export';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PRESET = 'last-1y';
const KNOWN_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL'];

/** Extract size from the last dash-segment of a product code. */
function extractSizeFromCode(code: string): string | null {
  if (!code) return null;
  const parts = code.split('-');
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1].toUpperCase();
  return KNOWN_SIZES.includes(last) ? last : null;
}

type SortKey   = 'total_volume' | 'transaction_count' | 'last_purchase';
type ResultTab = 'top' | 'recommended';

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <Info
        className="w-3.5 h-3.5 text-slate-500 cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span className="absolute left-5 top-0 z-50 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Filter Tag ───────────────────────────────────────────────────────────────

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/70 border border-slate-200 dark:border-slate-600/60 text-slate-700 dark:text-slate-200 text-xs px-2.5 py-1 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── BuyersTable ──────────────────────────────────────────────────────────────

interface BuyersTableProps {
  data: BuyerByProduct[];
  matchReason?: boolean;
  loading: boolean;
  emptyState: React.ReactNode;
}

function BuyersTable({ data, matchReason, loading, emptyState }: BuyersTableProps) {
  const [sortKey,  setSortKey]  = useState<SortKey>('total_volume');
  const [sortDesc, setSortDesc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(d => !d);
    else { setSortKey(key); setSortDesc(true); }
  };

  const sorted = [...data].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey];
    if (typeof va === 'number' && typeof vb === 'number') return sortDesc ? vb - va : va - vb;
    return sortDesc
      ? String(vb).localeCompare(String(va))
      : String(va).localeCompare(String(vb));
  });

  const SortTh = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="p-4 border-b border-slate-200 dark:border-slate-700/50 cursor-pointer select-none whitespace-nowrap hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === col ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-600'}`} />
      </span>
    </th>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm">Searching buyers…</span>
      </div>
    );
  }

  if (!data.length) return <>{emptyState}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <th className="p-4 border-b border-slate-200 dark:border-slate-700/50 w-10">#</th>
            <th className="p-4 border-b border-slate-200 dark:border-slate-700/50">Company</th>
            <th className="p-4 border-b border-slate-200 dark:border-slate-700/50">Country</th>
            <SortTh col="total_volume"      label="Volume (PCS)" />
            <SortTh col="transaction_count" label="Orders" />
            <SortTh col="last_purchase"     label="Last Purchase" />
            {matchReason && <th className="p-4 border-b border-slate-200 dark:border-slate-700/50">Match Reason</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/30">
          {sorted.map((row, idx) => {
            const rec    = row as RecommendedBuyer;
            const isTop3 = idx < 3;
            return (
              <tr
                key={idx}
                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20 ${
                  isTop3 && !rec.is_exact_match ? 'bg-emerald-50 dark:bg-emerald-950/10' : ''
                } ${rec.is_exact_match ? 'opacity-70' : ''}`}
              >
                <td className="p-4">
                  {isTop3 ? (
                    <span className="inline-flex w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-mono text-xs">{idx + 1}</span>
                  )}
                </td>
                <td className="p-4">
                  <span className="text-slate-900 dark:text-slate-100 font-medium truncate block" title={row.company_name}>
                    {row.company_name}
                  </span>
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.country}</td>
                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                  {row.total_volume.toLocaleString()}
                </td>
                <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">{row.transaction_count}</td>
                <td className="p-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {row.last_purchase?.slice(0, 10) || '—'}
                </td>
                {matchReason && (
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${
                        rec.is_exact_match
                          ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600/40'
                          : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
                      }`}>
                        {rec.match_reason}
                      </span>
                      {rec.is_exact_match && (
                        <span className="text-[10px] text-slate-600">Existing buyer — ranked lower</span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TradeBuyerFinder() {
  // Filters
  const initDate = resolvePresetDates(DEFAULT_PRESET);
  const [dateRange,    setDateRange]    = useState<DateRangeValue>({ preset: DEFAULT_PRESET, ...initDate });
  const [productCode,  setProductCode]  = useState('');
  const [size,         setSize]         = useState('');
  const [country,      setCountry]      = useState('');
  const [sizeOptions,  setSizeOptions]  = useState<string[]>(KNOWN_SIZES);
  // Track whether user manually picked size so auto-detect doesn't override it
  const [sizeManual,   setSizeManual]   = useState(false);

  // Results
  const [topBuyers,   setTopBuyers]   = useState<BuyerByProduct[]>([]);
  const [recBuyers,   setRecBuyers]   = useState<RecommendedBuyer[]>([]);
  const [activeTab,   setActiveTab]   = useState<ResultTab>('top');
  const [loadingTop,  setLoadingTop]  = useState(false);
  const [loadingRec,  setLoadingRec]  = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-fetch sizes whenever country changes (country-aware filtering)
  useEffect(() => {
    filterService.getSizes(country.trim() || undefined)
      .then(s => {
        const available = s.length ? s : KNOWN_SIZES;
        setSizeOptions(available);
        // Auto-clear size if it's no longer available in this country
        if (size && available.length > 0 && !available.includes(size)) {
          setSize('');
          setSizeManual(false);
        }
      })
      .catch(() => setSizeOptions(KNOWN_SIZES));
  }, [country]);

  // Derived
  const hasFilters = productCode.trim() !== '' || size !== '' || country.trim() !== '';
  const isLoading  = loadingTop || loadingRec;

  const PRESET_LABELS: Record<string, string> = {
    'last-7':  'Last 7 Days',
    'last-30': 'Last 30 Days',
    'last-3m': 'Last 3 Months',
    'last-1y': 'Last 1 Year',
    'custom':  `${dateRange.dateFrom ?? '?'} → ${dateRange.dateTo ?? '?'}`,
  };
  const dateLabel = PRESET_LABELS[dateRange.preset] ?? dateRange.preset;

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const buildParams = useCallback((): BuyerFinderParams => ({
    product_code: productCode.trim() || undefined,
    size:         size || undefined,
    country:      country.trim() || undefined,
    date_from:    dateRange.dateFrom ?? undefined,
    date_to:      dateRange.dateTo   ?? undefined,
    limit: 50,
  }), [productCode, size, country, dateRange]);

  const runFetch = useCallback(async () => {
    const params = buildParams();
    setHasSearched(true);
    setLoadingTop(true);
    setLoadingRec(true);

    tradeService.getBuyersByProduct(params)
      .then(setTopBuyers)
      .catch(() => setTopBuyers([]))
      .finally(() => setLoadingTop(false));

    tradeService.getRecommendedBuyers(params)
      .then(setRecBuyers)
      .catch(() => setRecBuyers([]))
      .finally(() => setLoadingRec(false));
  }, [buildParams]);

  // Auto-fetch debounced
  useEffect(() => {
    if (!hasFilters) {
      setTopBuyers([]);
      setRecBuyers([]);
      setHasSearched(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runFetch, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [productCode, size, country, dateRange, hasFilters]);

  const handleApply = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    runFetch();
  };

  const handleReset = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setProductCode('');
    setSize('');
    setSizeManual(false);
    setCountry('');
    const d = resolvePresetDates(DEFAULT_PRESET);
    setDateRange({ preset: DEFAULT_PRESET, ...d });
    setTopBuyers([]);
    setRecBuyers([]);
    setHasSearched(false);
  };

  const handleExport = () => {
    const data = activeTab === 'top' ? topBuyers : recBuyers;
    exportToCSV(data, activeTab === 'top' ? 'Top_Buyers' : 'Recommended_Buyers');
  };

  // ─── Active filter tags ──────────────────────────────────────────────────────

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (productCode.trim()) activeFilters.push({ label: `Product: ${productCode.trim()}`, onRemove: () => setProductCode('') });
  if (size)               activeFilters.push({ label: `Size: ${size}`,                  onRemove: () => setSize('') });
  if (country.trim())     activeFilters.push({ label: `Country: ${country.trim()}`,      onRemove: () => setCountry('') });
  activeFilters.push({ label: `Date: ${dateLabel}`, onRemove: () => {} }); // date is always active, no remove

  // ─── Result header string ────────────────────────────────────────────────────

  const currentData   = activeTab === 'top' ? topBuyers : recBuyers;
  const currentLoading = activeTab === 'top' ? loadingTop : loadingRec;
  const buyerWord      = activeTab === 'top' ? 'buyer' : 'prospect';

  function resultHeader(): string {
    if (!hasSearched || currentLoading) return '';
    const n      = currentData.length;
    const prod   = productCode.trim();
    const ctr    = country.trim();
    let suffix = '';
    if (prod) {
      suffix = `for Product ${prod.length > 16 ? prod.slice(0, 16) + '…' : prod}${size ? ` (Size ${size})` : ''}`;
    } else if (size) {
      suffix = `for Size ${size}${ctr ? ` · ${ctr}` : ''}`;
    } else if (ctr) {
      suffix = `for ${ctr}`;
    }
    return n === 0
      ? `0 ${buyerWord}s found ${suffix}`.trim()
      : `Showing ${n} ${buyerWord}${n > 1 ? 's' : ''} ${suffix}`.trim();
  }

  // ─── Empty states ─────────────────────────────────────────────────────────────

  const NoFilterState = (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Search className="w-7 h-7 text-slate-400 dark:text-slate-600" />
      </div>
      <div>
        <p className="text-slate-800 dark:text-slate-300 font-medium mb-1">Start exploring buyers</p>
        <p className="text-slate-500 text-sm">
          Enter a product code, select a size, or choose a country to discover matching buyers.
        </p>
      </div>
    </div>
  );

  const NoTopResultsState = (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Users className="w-6 h-6 text-slate-400 dark:text-slate-600" />
      </div>
      <div>
        <p className="text-slate-800 dark:text-slate-300 font-medium mb-2">No buyers found for the selected filters</p>
        <div className="flex flex-col gap-1.5 text-sm text-slate-600 dark:text-slate-500">
          {size    && <p>→ Try removing the <button onClick={() => setSize('')}    className="text-emerald-600 dark:text-emerald-400 hover:underline">size filter ({size})</button></p>}
          {productCode && <p>→ Try removing the <button onClick={() => setProductCode('')} className="text-emerald-600 dark:text-emerald-400 hover:underline">product code filter</button></p>}
          <p>→ Try expanding the date range in the filter panel</p>
        </div>
      </div>
    </div>
  );

  const NoRecProductState = (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Package className="w-6 h-6 text-slate-400 dark:text-slate-600" />
      </div>
      <div>
        <p className="text-slate-800 dark:text-slate-300 font-medium mb-1.5">Product code required</p>
        <p className="text-slate-500 text-sm max-w-xs">
          Recommended buyers are matched using similar product patterns. Enter a product code to activate this view.
        </p>
      </div>
    </div>
  );

  const NoRecResultsState = (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-slate-400 dark:text-slate-600" />
      </div>
      <div>
        <p className="text-slate-800 dark:text-slate-300 font-medium mb-1.5">No recommended buyers found</p>
        <p className="text-slate-500 text-sm">Try expanding the date range or using a broader product code prefix.</p>
      </div>
    </div>
  );

  const topEmptyState   = !hasFilters ? NoFilterState : NoTopResultsState;
  const recEmptyState   = !productCode.trim()
    ? NoRecProductState
    : NoRecResultsState;

  // ─── JSX ──────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-12">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-outfit mb-2 flex items-center gap-3">
          <Search className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          Buyer Finder
        </h1>
        <p className="text-slate-600 dark:text-slate-400">Discover top buyers and lookalike prospects for any product or size.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Filter Panel ──────────────────────────────────────────── */}
        <aside className="w-full lg:w-72 shrink-0 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none rounded-2xl overflow-hidden lg:sticky lg:top-4">

          {/* Panel header */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/40 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Filters</span>
            {hasFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="p-5 flex flex-col gap-5 max-h-[calc(100vh-220px)] overflow-y-auto">

            {/* ── Primary group: Product & Size ───────── */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Product & Size
              </p>

              {!hasFilters && (
                <p className="text-xs text-slate-500 italic">
                  Enter a product code, select a size, or choose a country.
                </p>
              )}

              {/* Product Code — searchable combobox */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700 dark:text-slate-300 font-medium">Product Code</label>
                <SearchableSelect
                  value={productCode}
                  onChange={(val) => {
                    setProductCode(val);
                    // Auto-detect size from product code unless user manually set it
                    if (!sizeManual) {
                      const detected = extractSizeFromCode(val);
                      if (detected) setSize(detected);
                      else if (!val) setSize('');
                    }
                  }}
                  placeholder="e.g. G-OCEF55NBAB-L"
                  fetchOptions={(q) => filterService.getProductCodes(q)}
                  allowCustomInput
                />
                {productCode && extractSizeFromCode(productCode) && !sizeManual && (
                  <p className="text-xs text-emerald-500/80 flex items-center gap-1">
                    ✦ Size auto-detected from product code
                  </p>
                )}
              </div>

              {/* Country — searchable combobox */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                  Country
                  <span className="text-slate-600 text-xs font-normal">(optional)</span>
                  {country && (
                    <button
                      onClick={() => setCountry('')}
                      className="text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </label>
                <SearchableSelect
                  value={country}
                  onChange={setCountry}
                  placeholder="e.g. United States"
                  fetchOptions={(q) => filterService.getCountries(q)}
                  allowCustomInput
                />
              </div>

              {/* Size — country-aware dynamic dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                  Size
                  {country.trim() && (
                    <span className="text-[10px] text-emerald-600/70 font-normal">
                      {sizeOptions.length} available in {country.trim()}
                    </span>
                  )}
                  {size && (
                    <button
                      onClick={() => { setSize(''); setSizeManual(false); }}
                      className="text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </label>
                  <select
                    value={size}
                    onChange={(e) => { setSize(e.target.value); setSizeManual(true); }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors cursor-pointer w-full"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">All Sizes</option>
                    {sizeOptions.map(s => <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{s}</option>)}
                  </select>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700/40" />

            {/* ── Date Range ─────────────────────────── */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Date Range
              </p>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                mode="panel"
              />
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700/40" />

            {/* Apply */}
            <button
              onClick={handleApply}
              disabled={!hasFilters || isLoading}
              title={!hasFilters ? 'Select a product code, size, or country to search' : ''}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-900/20"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
                : <><Search className="w-4 h-4" />Apply Filters</>
              }
            </button>

            <p className="text-xs text-slate-600 text-center -mt-2">
              Results also update automatically as you type.
            </p>
          </div>
        </aside>

        {/* ── Results Panel ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Active filter bar */}
          {activeFilters.length > 0 && hasSearched && (
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-xs text-slate-500 shrink-0">Active:</span>
              {activeFilters.map((f, i) => (
                f.label.startsWith('Date:')
                  ? <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400">{f.label}</span>
                  : <FilterTag key={i} label={f.label} onRemove={f.onRemove} />
              ))}
            </div>
          )}

          {/* Tabs row */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex">
              <button
                onClick={() => setActiveTab('top')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'top'
                    ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Top Buyers
                {hasSearched && !loadingTop && (
                  <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-full">
                    {topBuyers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('recommended')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'recommended'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Recommended
                {hasSearched && !loadingRec && (
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                    {recBuyers.length}
                  </span>
                )}
              </button>
            </div>

            {hasSearched && currentData.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors pr-1"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}
          </div>

          {/* Recommended tab explainer */}
          {activeTab === 'recommended' && hasSearched && !loadingRec && recBuyers.length > 0 && (
            <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300/80">
              <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-400" />
              Recommended buyers are identified based on similar product patterns and historical purchase behaviour.
            </div>
          )}

          {/* Result summary + table card */}
          <div className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none rounded-2xl overflow-hidden">

            {/* Result header */}
            {resultHeader() && (
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700/40 flex items-center gap-2">
                <span className="text-sm text-slate-800 dark:text-slate-300">{resultHeader()}</span>
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
              </div>
            )}

            <BuyersTable
              data={currentData}
              matchReason={activeTab === 'recommended'}
              loading={currentLoading}
              emptyState={activeTab === 'top' ? topEmptyState : recEmptyState}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
