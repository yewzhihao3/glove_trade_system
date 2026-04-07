import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

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
  className?: string;
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
  const fmt = (d: Date) => d.toISOString().split('T')[0];
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

export default function DateRangePicker({ value, onChange, allowCustom = true, className = '' }: DateRangePickerProps) {
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

  const handleCustomApply = () => {
    onChange({ preset: 'custom', dateFrom: localFrom || null, dateTo: localTo || null });
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Calendar icon */}
      <CalendarDays className="w-5 h-5 text-slate-400 shrink-0" />

      {/* Preset dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 whitespace-nowrap">Date Range:</span>
        <select
          value={value.preset}
          onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
          className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors cursor-pointer"
        >
          {PRESETS.filter(p => allowCustom || p.id !== 'custom').map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Custom Range inputs */}
      {value.preset === 'custom' && (
        <div className="flex items-center gap-2 animate-in fade-in duration-300">
          <input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors"
          />
          <span className="text-slate-500 text-sm">to</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={handleCustomApply}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* Show resolved range as hint for presets */}
      {value.preset !== 'custom' && value.dateFrom && value.dateTo && (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {value.dateFrom} → {value.dateTo}
        </span>
      )}
    </div>
  );
}
