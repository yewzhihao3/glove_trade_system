import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO } from 'date-fns';

export type DatePreset = 'last-7' | 'last-30' | 'last-3m' | 'last-1y' | 'custom';

export interface DateRangeValue {
  preset: DatePreset;
  dateFrom: string | null;
  dateTo: string | null;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  allowCustom?: boolean;
  /** 'inline' = horizontal toolbar mode (default), 'panel' = vertical sidebar mode */
  mode?: 'inline' | 'panel';
}

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'last-7',  label: 'Last 7 Days'   },
  { id: 'last-30', label: 'Last 30 Days'  },
  { id: 'last-3m', label: 'Last 3 Months' },
  { id: 'last-1y', label: 'Last 1 Year'   },
  { id: 'custom',  label: 'Custom Range'  },
];

/** Returns ISO date strings for a given preset. */
export function resolvePresetDates(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const fmt   = (d: Date) => d.toISOString().split('T')[0];
  const dateTo = fmt(today);

  const offsets: Record<DatePreset, number> = {
    'last-7':  7,
    'last-30': 30,
    'last-3m': 90,
    'last-1y': 365,
    'custom':  0,
  };

  const past = new Date(today);
  past.setDate(today.getDate() - offsets[preset]);
  return { dateFrom: fmt(past), dateTo };
}

export default function DateRangePicker({
  value,
  onChange,
  allowCustom = true,
  mode = 'inline',
}: DateRangePickerProps) {
  const [localFrom, setLocalFrom] = useState<string>(value.dateFrom ?? '');
  const [localTo,   setLocalTo]   = useState<string>(value.dateTo   ?? '');

  const handlePresetChange = (preset: DatePreset) => {
    if (preset === 'custom') {
      onChange({ preset, dateFrom: localFrom || null, dateTo: localTo || null });
    } else {
      const { dateFrom, dateTo } = resolvePresetDates(preset);
      onChange({ preset, dateFrom, dateTo });
    }
  };


  // ─── Panel mode (sidebar) ────────────────────────────────────────────────────
  // Fully vertical — each element stacks cleanly and the custom inputs never overflow.

  if (mode === 'panel') {
    return (
      <div className="flex flex-col gap-3">
        {/* Preset selector */}
        <select
          value={value.preset}
          onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
          className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors cursor-pointer"
        >
          {PRESETS.filter(p => allowCustom || p.id !== 'custom').map(p => (
            <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{p.label}</option>
          ))}
        </select>

        {/* Custom date inputs — always stacked vertically */}
        {value.preset === 'custom' && (
          <div className="flex flex-col gap-2 transition-all duration-200">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-500">From</span>
              <DatePicker
                selected={localFrom ? parseISO(localFrom) : null}
                onChange={(date: Date | null) => {
                  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                  setLocalFrom(dateStr);
                  onChange({ preset: 'custom', dateFrom: dateStr || null, dateTo: localTo || null });
                }}
                dateFormat="dd-MM-yy"
                placeholderText="DD-MM-YY"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                portalId="root-portal"
                wrapperClassName="w-full"
                className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-500">To</span>
              <DatePicker
                selected={localTo ? parseISO(localTo) : null}
                onChange={(date: Date | null) => {
                  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                  setLocalTo(dateStr);
                  onChange({ preset: 'custom', dateFrom: localFrom || null, dateTo: dateStr || null });
                }}
                dateFormat="dd-MM-yy"
                placeholderText="DD-MM-YY"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                portalId="root-portal"
                wrapperClassName="w-full"
                className="w-full bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Resolved date hint for presets */}
        {value.preset !== 'custom' && value.dateFrom && value.dateTo && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {format(parseISO(value.dateFrom), 'dd-MM-yy')} → {format(parseISO(value.dateTo), 'dd-MM-yy')}
          </span>
        )}
      </div>
    );
  }

  // ─── Inline mode (toolbar / analytics page) ──────────────────────────────────
  // Keeps the original horizontal layout for use in the wide analytics bar.

  return (
    <div className="flex flex-wrap items-center gap-3">
      <CalendarDays className="w-5 h-5 text-slate-400 shrink-0" />

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">Date Range:</span>
        <select
          value={value.preset}
          onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors cursor-pointer"
        >
          {PRESETS.filter(p => allowCustom || p.id !== 'custom').map(p => (
            <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{p.label}</option>
          ))}
        </select>
      </div>

      {value.preset === 'custom' && (
        <div className="flex flex-col gap-2 transition-all duration-200">
          <div className="flex items-center gap-2">
            <DatePicker
              selected={localFrom ? parseISO(localFrom) : null}
              onChange={(date: Date | null) => {
                const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                setLocalFrom(dateStr);
                onChange({ preset: 'custom', dateFrom: dateStr || null, dateTo: localTo || null });
              }}
              dateFormat="dd-MM-yy"
              placeholderText="DD-MM-YY"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              portalId="root-portal"
              wrapperClassName="flex-1"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors"
            />
            <span className="text-slate-500 text-sm shrink-0">to</span>
            <DatePicker
              selected={localTo ? parseISO(localTo) : null}
              onChange={(date: Date | null) => {
                const dateStr = date ? format(date, 'yyyy-MM-dd') : '';
                setLocalTo(dateStr);
                onChange({ preset: 'custom', dateFrom: localFrom || null, dateTo: dateStr || null });
              }}
              dateFormat="dd-MM-yy"
              placeholderText="DD-MM-YY"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              portalId="root-portal"
              wrapperClassName="flex-1"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      )}

      {value.preset !== 'custom' && value.dateFrom && value.dateTo && (
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {format(parseISO(value.dateFrom), 'dd-MM-yy')} → {format(parseISO(value.dateTo), 'dd-MM-yy')}
        </span>
      )}
    </div>
  );
}
