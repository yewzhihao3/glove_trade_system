import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe, X } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Select region...", label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt?.value === value);
  const filteredOptions = options.filter(opt => {
    if (!opt) return false;
    const label = opt.label?.toLowerCase() || '';
    const val = opt.value?.toLowerCase() || '';
    const searchLow = search.toLowerCase();
    return label.includes(searchLow) || val.includes(searchLow);
  });


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3 relative" ref={containerRef}>
      {label && <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group cursor-pointer transition-all duration-500 ${isOpen ? 'z-50' : ''}`}
      >
        <div className={`relative bg-white dark:bg-slate-950 border rounded-2xl p-1 transition-all duration-500 ${
          isOpen ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:border-white/20'
        }`}>
          <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-500 ${
            isOpen ? 'text-blue-400' : 'text-slate-500'
          }`} />
          
          <div className="w-full bg-transparent py-3.5 pl-12 pr-10 text-slate-900 dark:text-white text-[11px] font-bold tracking-[0.2em] uppercase truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </div>

          <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-transform duration-500 ${
            isOpen ? 'rotate-180 text-blue-400' : ''
          }`} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-[#0a0f1d] border border-black/5 dark:border-blue-500/30 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.9)] z-[100]">
            {/* Search Input */}
            <div className="p-3 border-b border-black/5 dark:border-white/5 bg-slate-50 dark:bg-white/5 rounded-t-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder:text-slate-600 focus:ring-1 focus:ring-blue-500/30 transition-all outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
                {search && (
                  <X 
                    onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 hover:text-slate-900 dark:text-white cursor-pointer" 
                  />
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-64 min-h-[100px] overflow-y-auto py-2 relative bg-white dark:bg-[#0a0f1d] rounded-b-2xl">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all duration-300 ${
                      value === opt.value 
                        ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-[0.15em] uppercase">{opt.label}</span>
                    {value === opt.value && <Check className="w-4 h-4" />}
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs text-slate-600 font-light italic">No matching regions found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
