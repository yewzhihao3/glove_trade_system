import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Loader2 } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fetchOptions?: (query: string) => Promise<{ data: string[] | SelectOption[]; fallback: boolean }>;
  options?: string[] | SelectOption[];
  allowCustomInput?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="text-emerald-400 font-semibold">
        {text.slice(idx, idx + query.length)}
      </strong>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchableSelect({
  value,
  onChange,
  placeholder = 'Search…',
  fetchOptions,
  options: staticOptions,
  allowCustomInput = false,
  disabled = false,
  className = '',
  id,
  label,
}: SearchableSelectProps) {
  const getDisplayValue = (val: string) => {
    if (!staticOptions) return val;
    const found = staticOptions.find(opt => {
      if (typeof opt === 'string') return opt === val;
      return opt.value === val;
    });
    if (found) {
      return typeof found === 'string' ? found : found.label;
    }
    return val;
  };

  const [inputValue, setInputValue] = useState(getDisplayValue(value));
  const [internalOptions, setInternalOptions] = useState<SelectOption[]>([]);
  const [open,       setOpen]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(-1);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [dropPos,    setDropPos]    = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setInputValue(getDisplayValue(value));
    }
  }, [value, staticOptions, open]);

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropPos({
        top:   rect.bottom + window.scrollY + 4,
        left:  rect.left   + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  const normalizeOptions = (opts: string[] | SelectOption[]): SelectOption[] => {
    return opts.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
  };

  const doFetch = useCallback(async (query: string) => {
    setLoading(true);
    setFallbackActive(false);
    try {
      if (fetchOptions) {
        const results = await fetchOptions(query);
        setInternalOptions(normalizeOptions(results.data));
        setFallbackActive(results.fallback);
      } else if (staticOptions) {
        const q = query.toLowerCase();
        const filtered = normalizeOptions(staticOptions).filter(
          opt => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
        );
        setInternalOptions(filtered);
      }
      setActiveIdx(-1);
    } catch {
      setInternalOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fetchOptions, staticOptions]);

  const scheduleSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(query), fetchOptions ? 300 : 0);
  }, [doFetch, fetchOptions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setInputValue(q);
    setOpen(true);
    scheduleSearch(q);
    if (allowCustomInput) onChange(q);
  };

  const handleFocus = () => {
    setOpen(true);
    scheduleSearch(inputValue);
  };

  const handleSelect = (option: SelectOption) => {
    setInputValue(option.label);
    onChange(option.value);
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setOpen(false);
    setInternalOptions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setOpen(true);
        scheduleSearch(inputValue);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, internalOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && internalOptions[activeIdx]) {
        handleSelect(internalOptions[activeIdx]);
      } else if (allowCustomInput) {
        onChange(inputValue);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const portal = document.getElementById('searchable-select-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
        if (!allowCustomInput) setInputValue(getDisplayValue(value));
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [allowCustomInput, value, staticOptions]);

  const showDropdown = open && (loading || internalOptions.length > 0 || inputValue.length > 0);

  const dropdown = showDropdown
    ? createPortal(
        <div
          id="searchable-select-portal"
          style={{
            position: 'absolute',
            top:   dropPos.top,
            left:  dropPos.left,
            width: dropPos.width,
            zIndex: 9999,
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching…
            </div>
          ) : internalOptions.length === 0 ? (
            <div className="px-3 py-3 text-xs text-slate-500">
              {allowCustomInput && inputValue
                ? <>Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400">Enter</kbd> to use "{inputValue}"</>
                : 'No results found for this combination'}
            </div>
          ) : (
            <>
              {fallbackActive && (
                <div className="px-3 py-2 text-[11px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-b border-amber-200/50 dark:border-amber-700/30">
                  Showing broader matches due to filter combination
                </div>
              )}
              <ul className="max-h-52 overflow-y-auto py-1">
              {internalOptions.map((opt, i) => (
                <li
                  key={`${opt.value}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(opt);
                  }}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    i === activeIdx
                      ? 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-300'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <HighlightMatch text={opt.label} query={inputValue} />
                </li>
              ))}
              </ul>
            </>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1 block">
          {label}
        </label>
      )}
      <div ref={containerRef} className="relative">
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-600 px-4 py-3 pr-9 rounded-2xl text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors disabled:opacity-50"
          />
          <span className="absolute right-3 flex items-center">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500 pointer-events-none" />
            ) : inputValue ? (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleClear();
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-0.5"
                tabIndex={-1}
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-600 pointer-events-none" />
            )}
          </span>
        </div>

        {dropdown}
      </div>
    </div>
  );
}
