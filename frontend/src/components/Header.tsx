import { useLocation } from 'react-router-dom';
import { Menu, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const { user } = useAuth();
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
          <button className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-xl hover:bg-black/5 dark:bg-white/5 transition-all text-sm group">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-900 dark:text-white transition-all">
              <User className="w-4 h-4" />
            </div>
            <span className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-slate-900 dark:text-white transition-colors uppercase tracking-widest text-xs">
              {displayName}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
