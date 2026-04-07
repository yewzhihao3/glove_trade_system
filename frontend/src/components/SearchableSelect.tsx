import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, Loader2 } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fetchOptions: (query: string) => Promise<string[]>;
  allowCustomInput?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
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
  allowCustomInput = false,
  disabled = false,
  className = '',
  id,
}: SearchableSelectProps) {
  const [inputValue, setInputValue] = useState(value);
  const [options,    setOptions]    = useState<string[]>([]);
  const [open,       setOpen]       = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(-1);
  // Position of dropdown in viewport coords for portal rendering
  const [dropPos,    setDropPos]    = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when external value changes (e.g. reset)
  useEffect(() => { setInputValue(value); }, [value]);

  // Recalculate dropdown position whenever it opens
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

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const doFetch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const results = await fetchOptions(query);
      setOptions(results);
      setActiveIdx(-1);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [fetchOptions]);

  const scheduleSearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doFetch(query), 300);
  }, [doFetch]);

  // ── Handlers ──────────────────────────────────────────────────────────────

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

  const handleSelect = (option: string) => {
    setInputValue(option);
    onChange(option);
    setOpen(false);
    setOptions([]);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setOpen(false);
    setOptions([]);
    inputRef.current?.focus();
  };

  // ── Keyboard navigation ───────────────────────────────────────────────────

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0 && options[activeIdx]) {
        handleSelect(options[activeIdx]);
      } else if (allowCustomInput) {
        onChange(inputValue);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // ── Click-outside ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        // Also check if click was inside the portal dropdown
        const portal = document.getElementById('searchable-select-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
        if (!allowCustomInput) setInputValue(value);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [allowCustomInput, value]);

  // ── Render ────────────────────────────────────────────────────────────────

  const showDropdown = open && (loading || options.length > 0 || inputValue.length > 0);

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
          className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Searching…
            </div>
          ) : options.length === 0 ? (
            <div className="px-3 py-3 text-xs text-slate-500">
              {allowCustomInput && inputValue
                ? <>Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">Enter</kbd> to use "{inputValue}"</>
                : 'No results found'}
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {options.map((opt, i) => (
                <li
                  key={opt}
                  onMouseDown={() => handleSelect(opt)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    i === activeIdx
                      ? 'bg-emerald-600/20 text-emerald-300'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <HighlightMatch text={opt} query={inputValue} />
                </li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input row */}
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
          className="w-full bg-slate-900/70 border border-slate-700 text-slate-200 placeholder:text-slate-600 px-3 py-2 pr-9 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
        />
        <span className="absolute right-2.5 flex items-center">
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500 pointer-events-none" />
          ) : inputValue ? (
            <button
              type="button"
              onMouseDown={handleClear}
              className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-600 pointer-events-none" />
          )}
        </span>
      </div>

      {dropdown}
    </div>
  );
}
