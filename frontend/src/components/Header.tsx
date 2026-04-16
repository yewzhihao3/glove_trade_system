import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, User, Sun, Moon, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pageTitle = location.pathname === '/' ? 'Overview' : location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.slice(2);

  // Format name: max 10 chars, capitalize first letter
  const rawName = user?.username || user?.email?.split('@')[0] || '...';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).substring(0, 10) + (rawName.length > 10 ? '.' : '');

  return (
    <header className="h-20 border-b border-black/5 dark:border-white/5 px-10 flex items-center justify-between bg-white/40 dark:bg-[#020617]/40 backdrop-blur-xl sticky top-0 z-30 w-full transition-all duration-500">
      <div className="flex items-center gap-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-all active:scale-90"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-xs font-bold text-blue-500 uppercase tracking-[0.3em] mb-1">
            Core Portal
          </h2>
          <span className="text-xl font-light text-slate-900 dark:text-white tracking-widest uppercase">
            {pageTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center glass rounded-2xl p-1 gap-1">
          <button onClick={toggleTheme} className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-all relative group flex items-center justify-center">
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-200" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>
          <div className="h-6 w-px bg-black/5 dark:bg-white/5 mx-1" />
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl hover:bg-black/5 dark:bg-white/5 transition-all text-sm group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                <User className="w-4 h-4" />
              </div>
              <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:text-white transition-colors uppercase tracking-widest text-xs flex items-center gap-1">
                {displayName}
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </span>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden py-2 animate-in slide-in-from-top-2">
                {user?.role === 'admin' && (
                  <Link 
                    to="/settings/users" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                )}
                <button 
                  onClick={() => { setIsDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
