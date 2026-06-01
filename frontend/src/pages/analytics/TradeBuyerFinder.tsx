import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  tradeService,
  filterService,
  type BuyerByProduct,
  type RecommendedBuyer,
  type AIRecommendedBuyer,
  type BuyerFinderParams,
} from '../../services/api';
import {
  type DateRangeValue,
  resolvePresetDates,
} from '../../components/DateRangePicker';
import DateRangePicker from '../../components/DateRangePicker';
import SearchableSelect from '../../components/SearchableSelect';
import AIProspectCard from '../../components/analytics/AIProspectCard';
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
  Zap,
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

type SortKey = 'total_volume' | 'transaction_count' | 'last_purchase';
type ResultTab = 'top' | 'recommended' | 'ai';

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
  const [sortKey, setSortKey] = useState<SortKey>('total_volume');
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
            <SortTh col="total_volume" label="Volume (PCS)" />
            <SortTh col="transaction_count" label="Orders" />
            <SortTh col="last_purchase" label="Last Purchase" />
            {matchReason && <th className="p-4 border-b border-slate-200 dark:border-slate-700/50">Match Reason</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700/30">
          {sorted.map((row, idx) => {
            const rec = row as RecommendedBuyer;
            const isTop3 = idx < 3;
            return (
              <tr
                key={idx}
                className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/20 ${isTop3 && !rec.is_exact_match ? 'bg-emerald-50 dark:bg-emerald-950/10' : ''
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
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${rec.is_exact_match
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

// AIBuyersTable has been replaced by AIProspectCard

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TradeBuyerFinder() {
  // Filters (Draft)
  const initDate = resolvePresetDates(DEFAULT_PRESET);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: DEFAULT_PRESET, ...initDate });
  const [productCode, setProductCode] = useState('');
  const [size, setSize] = useState('');
  const [country, setCountry] = useState('');
  // Track whether user manually picked size so auto-detect doesn't override it
  const [sizeManual, setSizeManual] = useState(false);
  const [diversityMode, setDiversityMode] = useState(false);

  // Filters (Applied)
  const [appliedDateRange, setAppliedDateRange] = useState<DateRangeValue>(dateRange);
  const [appliedProductCode, setAppliedProductCode] = useState('');
  const [appliedSize, setAppliedSize] = useState('');
  const [appliedCountry, setAppliedCountry] = useState('');
  const [appliedDiversityMode, setAppliedDiversityMode] = useState(false);

  // Results
  const [topBuyers, setTopBuyers] = useState<BuyerByProduct[]>([]);
  const [searchFallback, setSearchFallback] = useState(false);
  const [recBuyers, setRecBuyers] = useState<RecommendedBuyer[]>([]);
  const [aiRecBuyers, setAiRecBuyers] = useState<AIRecommendedBuyer[]>([]);
  const [aiVersion, setAiVersion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('top');
  const [loadingTop, setLoadingTop] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Derived
  const draftHasFilters = productCode.trim() !== '' || (size !== '' && size !== 'All') || country.trim() !== '';
  const appliedHasFilters = appliedProductCode.trim() !== '' || (appliedSize !== '' && appliedSize !== 'All') || appliedCountry.trim() !== '';
  const isLoading = loadingTop || loadingRec || loadingAi;

  const isDirty =
    dateRange.preset !== appliedDateRange.preset ||
    dateRange.dateFrom !== appliedDateRange.dateFrom ||
    dateRange.dateTo !== appliedDateRange.dateTo ||
    productCode !== appliedProductCode ||
    size !== appliedSize ||
    country !== appliedCountry ||
    diversityMode !== appliedDiversityMode;

  const PRESET_LABELS: Record<string, string> = {
    'last-7': 'Last 7 Days',
    'last-30': 'Last 30 Days',
    'last-3m': 'Last 3 Months',
    'last-1y': 'Last 1 Year',
    'custom': `${appliedDateRange.dateFrom ?? '?'} → ${appliedDateRange.dateTo ?? '?'}`,
  };
  const dateLabel = PRESET_LABELS[appliedDateRange.preset] ?? appliedDateRange.preset;

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const buildParams = useCallback((): BuyerFinderParams => ({
    product_code: appliedProductCode.trim() || undefined,
    size: (appliedSize === 'All' ? undefined : appliedSize) || undefined,
    country: appliedCountry.trim() || undefined,
    date_from: appliedDateRange.dateFrom ?? undefined,
    date_to: appliedDateRange.dateTo ?? undefined,
    limit: 50,
    diversity_mode: appliedDiversityMode,
  }), [appliedProductCode, appliedSize, appliedCountry, appliedDateRange, appliedDiversityMode]);

  const runFetch = useCallback(async () => {
    const params = buildParams();
    setHasSearched(true);
    setLoadingTop(true);
    setLoadingRec(true);
    setLoadingAi(true);

    tradeService.getBuyersByProduct(params)
      .then(res => {
        setTopBuyers(res.data);
        setSearchFallback(res.fallback);
      })
      .catch(() => {
        setTopBuyers([]);
        setSearchFallback(false);
      })
      .finally(() => setLoadingTop(false));

    tradeService.getRecommendedBuyers(params)
      .then(setRecBuyers)
      .catch(() => setRecBuyers([]))
      .finally(() => setLoadingRec(false));

    tradeService.getAIRecommendedBuyers(params)
      .then(res => {
        setAiRecBuyers(res.data);
        setAiVersion(res.recommendation_version);
      })
      .catch(() => {
        setAiRecBuyers([]);
        setAiVersion(null);
      })
      .finally(() => setLoadingAi(false));
  }, [buildParams]);

  // Auto-fetch ONLY when applied state changes
  useEffect(() => {
    if (!appliedHasFilters) {
      setTopBuyers([]);
      setRecBuyers([]);
      setAiRecBuyers([]);
      setSearchFallback(false);
      setHasSearched(false);
      return;
    }
    runFetch();
  }, [appliedProductCode, appliedSize, appliedCountry, appliedDateRange, appliedHasFilters, appliedDiversityMode]);

  const handleApply = () => {
    setAppliedDateRange(dateRange);
    setAppliedProductCode(productCode);
    setAppliedSize(size);
    setAppliedCountry(country);
    setAppliedDiversityMode(diversityMode);
  };

  const handleReset = () => {
    setProductCode('');
    setSize('');
    setSizeManual(false);
    setCountry('');
    setDiversityMode(false);
    const d = resolvePresetDates(DEFAULT_PRESET);
    setDateRange({ preset: DEFAULT_PRESET, ...d });

    // Also clear applied immediately
    setAppliedProductCode('');
    setAppliedSize('');
    setAppliedCountry('');
    setAppliedDiversityMode(false);
    setAppliedDateRange({ preset: DEFAULT_PRESET, ...d });

    setTopBuyers([]);
    setRecBuyers([]);
    setAiRecBuyers([]);
    setSearchFallback(false);
    setHasSearched(false);
  };

  const handleExport = () => {
    const data = activeTab === 'top' ? topBuyers : activeTab === 'ai' ? aiRecBuyers : recBuyers;
    const name = activeTab === 'top' ? 'Top_Buyers' : activeTab === 'ai' ? 'AI_Recommended_Buyers' : 'Recommended_Buyers';
    exportToCSV(data, name);
  };

  // ─── Active filter tags (uses Applied state) ──────────────────────────────────────────────────────

  const activeFilters: { label: string; onRemove: () => void }[] = [];

  const removeFilter = (key: string) => {
    if (key === 'product') { setProductCode(''); setAppliedProductCode(''); }
    if (key === 'size') { setSize(''); setAppliedSize(''); }
    if (key === 'country') { setCountry(''); setAppliedCountry(''); }
    if (key === 'diversity') { setDiversityMode(false); setAppliedDiversityMode(false); }
  };

  if (appliedProductCode.trim()) activeFilters.push({ label: `Product: ${appliedProductCode.trim()}`, onRemove: () => removeFilter('product') });
  if (appliedSize && appliedSize !== 'All') activeFilters.push({ label: `Size: ${appliedSize}`, onRemove: () => removeFilter('size') });
  if (appliedCountry.trim()) activeFilters.push({ label: `Country: ${appliedCountry.trim()}`, onRemove: () => removeFilter('country') });
  activeFilters.push({ label: `Date: ${dateLabel}`, onRemove: () => { } }); // date is always active, no remove
  if (appliedDiversityMode) activeFilters.push({ label: `Diversity Mode`, onRemove: () => removeFilter('diversity') });

  // ─── Result header string ────────────────────────────────────────────────────

  const currentData = activeTab === 'top' ? topBuyers : activeTab === 'ai' ? aiRecBuyers : recBuyers;
  const currentLoading = activeTab === 'top' ? loadingTop : activeTab === 'ai' ? loadingAi : loadingRec;
  const buyerWord = activeTab === 'top' ? 'buyer' : 'prospect';

  function resultHeader(): string {
    if (!hasSearched || currentLoading) return '';
    const n = currentData.length;
    const prod = appliedProductCode.trim();
    const ctr = appliedCountry.trim();
    const sz = appliedSize.trim();
    let suffix = '';
    if (prod) {
      suffix = `for Product ${prod.length > 16 ? prod.slice(0, 16) + '…' : prod}${sz ? ` (Size ${sz})` : ''}`;
    } else if (sz) {
      suffix = `for Size ${sz}${ctr ? ` · ${ctr}` : ''}`;
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
          {size && size !== 'All' && <p>→ Try removing the <button onClick={() => setSize('')} className="text-emerald-600 dark:text-emerald-400 hover:underline">size filter ({size})</button></p>}
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

  const topEmptyState = !appliedHasFilters ? NoFilterState : NoTopResultsState;
  const recEmptyState = !appliedProductCode.trim()
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
            {draftHasFilters && (
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

              {!draftHasFilters && (
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
                  fetchOptions={(q) => filterService.getProductCodes(q, 20, country.trim() || undefined, size || undefined)}
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
                  fetchOptions={(q) => filterService.getCountries(q, 20, productCode.trim() || undefined, size || undefined)}
                  allowCustomInput
                />
              </div>

              {/* Size — Searchable Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                  Size
                  {size && (
                    <button
                      onClick={() => { setSize(''); setSizeManual(false); }}
                      className="text-slate-500 hover:text-rose-400 transition-colors ml-auto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </label>
                <SearchableSelect
                  value={size}
                  onChange={(val) => { setSize(val); setSizeManual(true); }}
                  placeholder="e.g. M, L, XL"
                  fetchOptions={async (q) => {
                    const response = await filterService.getSizes(country.trim() || undefined, productCode.trim() || undefined);
                    if (!q || 'all'.includes(q.toLowerCase())) {
                      return { data: ['All', ...response.data], fallback: response.fallback };
                    }
                    return response;
                  }}
                  allowCustomInput
                />
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

            {/* ── Settings ─────────────────────────── */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Settings
              </p>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={diversityMode}
                    onChange={(e) => setDiversityMode(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-500"></div>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Diversity Mode
                </span>
                <InfoTooltip text="Limits the number of recommendations from a single country to highlight a broader variety of prospects." />
              </label>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700/40" />

            {/* Apply */}
            <button
              onClick={handleApply}
              disabled={!draftHasFilters || !isDirty || isLoading}
              title={!draftHasFilters ? 'Select a product code, size, or country to search' : ''}
              className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${draftHasFilters && isDirty && !isLoading
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
                : <><Search className="w-4 h-4" />Apply Filters</>
              }
            </button>
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
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'top'
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
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'recommended'
                    ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                <Sparkles className="w-4 h-4" />
                Lookalikes
                {hasSearched && !loadingRec && (
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                    {recBuyers.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ai'
                    ? 'border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                <Zap className="w-4 h-4" />
                AI Recommended
                {hasSearched && !loadingAi && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                    {aiRecBuyers.length}
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
              Lookalike buyers are identified based on similar product patterns and historical purchase behaviour.
            </div>
          )}

          {activeTab === 'ai' && hasSearched && !loadingAi && aiRecBuyers.length > 0 && (
            <div className="flex items-center justify-between bg-purple-500/5 border border-purple-500/20 rounded-xl px-4 py-3 text-xs text-purple-600 dark:text-purple-300/80">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-500 dark:text-purple-400" />
                AI Engine scores prospects using a multi-factor weighted algorithm, applying decay to inactive accounts and excluding existing buyers of this exact configuration.
              </div>
              {aiVersion && (
                <span className="font-mono text-[10px] bg-purple-500/10 text-purple-500 dark:text-purple-400 px-2 py-0.5 rounded-md">
                  Engine {aiVersion}
                </span>
              )}
            </div>
          )}

          {/* Result summary + table card */}
          <div className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none rounded-2xl overflow-hidden">

            {/* Result header */}
            {(resultHeader() || (hasSearched && searchFallback && activeTab === 'top' && topBuyers.length > 0)) && (
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-800 dark:text-slate-300">{resultHeader()}</span>
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />}
                </div>
                {hasSearched && searchFallback && activeTab === 'top' && topBuyers.length > 0 && !loadingTop && (
                  <span className="text-[11px] font-medium px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-500/20">
                    No exact matches found. Showing closest results.
                  </span>
                )}
              </div>
            )}

            {activeTab === 'ai' ? (
              loadingAi ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span className="text-sm">Running AI Recommendation Engine…</span>
                </div>
              ) : aiRecBuyers.length === 0 ? (
                <>{recEmptyState}</>
              ) : (
                <div className="flex flex-col gap-4 p-5">
                  {aiRecBuyers.map((buyer, idx) => (
                    <AIProspectCard key={idx} buyer={buyer} index={idx} />
                  ))}
                </div>
              )
            ) : (
              <BuyersTable
                data={currentData as BuyerByProduct[]}
                matchReason={activeTab === 'recommended'}
                loading={currentLoading}
                emptyState={activeTab === 'top' ? topEmptyState : recEmptyState}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
