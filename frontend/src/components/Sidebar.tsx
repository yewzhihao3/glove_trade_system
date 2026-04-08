import { Link, useLocation } from 'react-router-dom';
import { Search, LayoutDashboard, FileSearch, Building2, Settings, User, LogOut, Globe, X, BookOpen, ChevronDown, ShieldCheck, Database, Target } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const SidebarItem = ({ icon: Icon, label, to, active, onClick, hasSubmenu, isOpen }: { icon: React.ElementType; label: string; to: string; active?: boolean; onClick?: () => void; hasSubmenu?: boolean; isOpen?: boolean }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-600 dark:text-slate-300 border border-transparent'
            }`}
    >
        <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'}`} />
        <span className={`font-medium tracking-wide flex-1 ${active ? 'text-blue-400' : ''}`}>{label}</span>
        {hasSubmenu && (
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        )}
    </Link>
);

const SubSidebarItem = ({ label, to, active, onClick, icon: Icon }: { label: string; to: string; active: boolean; onClick: () => void; icon: React.ElementType }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-3 pl-12 pr-4 py-2 rounded-xl transition-all duration-300 group ${active
                ? 'text-blue-400'
                : 'text-slate-500 hover:text-slate-600 dark:text-slate-300'
            }`}
    >
        <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-600'}`} />
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    const [isHSMenuOpen, setIsHSMenuOpen] = useState(location.pathname.startsWith('/hscodes'));
    const [isLeadMenuOpen, setIsLeadMenuOpen] = useState(location.pathname === '/leads' || (location.pathname === '/' && false)); // Adjusted for new default
    const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] = useState(location.pathname.startsWith('/analytics') || location.pathname === '/');
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(location.pathname.startsWith('/settings'));
    const { logout, user } = useAuth();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-white dark:bg-slate-950/80 backdrop-blur-md z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Drawer */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass border-r border-black/5 dark:border-white/5 p-8 flex flex-col gap-10 transform transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static lg:flex ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="group relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-11 h-11 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-900 dark:text-white border border-black/10 dark:border-white/10">
                                <Globe className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                        <span className="text-2xl font-light tracking-[0.2em] text-slate-900 dark:text-white">TRADE<span className="font-bold text-blue-500">I</span></span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex flex-col gap-2">
                    {/* 1. Trade Analytics */}
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setIsAnalyticsMenuOpen(!isAnalyticsMenuOpen)}
                            className="w-full text-left"
                        >
                            <SidebarItem
                                icon={BookOpen}
                                label="Trade Analytics"
                                to="/analytics/dashboard"
                                active={location.pathname.startsWith('/analytics') || location.pathname === '/'}
                                hasSubmenu
                                isOpen={isAnalyticsMenuOpen}
                            />
                        </button>
                        
                        {isAnalyticsMenuOpen && (
                            <div className="flex flex-col gap-1 py-1 animate-in slide-in-from-top-2 duration-300">
                                <SubSidebarItem
                                    icon={LayoutDashboard}
                                    label="Dashboard"
                                    to="/analytics/dashboard"
                                    active={location.pathname === '/analytics/dashboard' || location.pathname === '/'}
                                    onClick={onClose}
                                />
                                <SubSidebarItem
                                    icon={Database}
                                    label="Data Explore"
                                    to="/analytics/explore"
                                    active={location.pathname === '/analytics/explore'}
                                    onClick={onClose}
                                />
                                <SubSidebarItem
                                    icon={Search}
                                    label="Insights"
                                    to="/analytics/insights"
                                    active={location.pathname === '/analytics/insights'}
                                    onClick={onClose}
                                />
                                <SubSidebarItem
                                    icon={Target}
                                    label="Buyer Finder"
                                    to="/analytics/buyers"
                                    active={location.pathname === '/analytics/buyers'}
                                    onClick={onClose}
                                />
                                <SubSidebarItem
                                    icon={FileSearch}
                                    label="Data Upload"
                                    to="/analytics/upload"
                                    active={location.pathname === '/analytics/upload'}
                                    onClick={onClose}
                                />
                            </div>
                        )}
                    </div>

                    {/* 2. HS Code Intel */}
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setIsHSMenuOpen(!isHSMenuOpen)}
                            className="w-full text-left"
                        >
                            <SidebarItem
                                icon={FileSearch}
                                label="HS Code Intel"
                                to="/hscodes"
                                active={location.pathname.startsWith('/hscodes')}
                                hasSubmenu
                                isOpen={isHSMenuOpen}
                            />
                        </button>
                        
                        {isHSMenuOpen && (
                            <div className="flex flex-col gap-1 py-1 animate-in slide-in-from-top-2 duration-300">
                                <SubSidebarItem
                                    icon={ShieldCheck}
                                    label="AI Discovery"
                                    to="/hscodes"
                                    active={location.pathname === '/hscodes'}
                                    onClick={onClose}
                                />
                                <SubSidebarItem
                                    icon={Database}
                                    label="Code Vault"
                                    to="/hscodes/manage"
                                    active={location.pathname === '/hscodes/manage'}
                                    onClick={onClose}
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* 3. Lead Finder */}
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setIsLeadMenuOpen(!isLeadMenuOpen)}
                            className="w-full text-left"
                        >
                            <SidebarItem
                                icon={LayoutDashboard}
                                label="Lead Finder"
                                to="/leads-discovery" 
                                active={location.pathname === '/leads-discovery' || location.pathname === '/leads'}
                                hasSubmenu
                                isOpen={isLeadMenuOpen}
                            />
                        </button>
                        
                        {isLeadMenuOpen && (
                            <div className="flex flex-col gap-1 py-1 animate-in slide-in-from-top-2 duration-300">
                                <SubSidebarItem
                                    icon={Search}
                                    label="AI Discovery"
                                    to="/leads-discovery"
                                    active={location.pathname === '/leads-discovery'}
                                    onClick={onClose}
                                />
                                <SubSidebarItem
                                    icon={Building2}
                                    label="Leads Vault"
                                    to="/leads"
                                    active={location.pathname === '/leads'}
                                    onClick={onClose}
                                />
                            </div>
                        )}
                    </div>
                    <div className="my-6 border-t border-black/5 dark:border-white/5 mx-2" />
                    
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                            className="w-full text-left"
                        >
                            <SidebarItem
                                icon={Settings}
                                label="Settings"
                                to="/settings/users"
                                active={location.pathname.startsWith('/settings')}
                                hasSubmenu
                                isOpen={isSettingsMenuOpen}
                            />
                        </button>
                        
                        {isSettingsMenuOpen && (
                            <div className="flex flex-col gap-1 py-1 animate-in slide-in-from-top-2 duration-300">
                                <SubSidebarItem
                                    icon={User}
                                    label="User Management"
                                    to="/settings/users"
                                    active={location.pathname === '/settings/users'}
                                    onClick={onClose}
                                />
                            </div>
                        )}
                    </div>
                </nav>

                <div className="mt-auto">
                    <div className="glass rounded-3xl p-6 border border-black/5 dark:border-white/5 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden shadow-inner font-outfit">
                                <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                    {user?.username || user?.email?.split('@')[0] || 'Loading...'}
                                </p>
                                <p className="text-[10px] text-blue-400 font-mono tracking-tighter uppercase">Operator</p>
                            </div>
                        </div>
                        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10 hover:text-rose-400 hover:border-rose-500/20 border border-transparent transition-all text-xs font-bold tracking-widest uppercase">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
