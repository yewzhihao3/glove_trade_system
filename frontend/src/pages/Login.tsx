import React, { useState } from 'react';
import { Sparkles, Loader2, KeyRound, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid credentials');
      } else {
        setError('System error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      {/* Background Zen Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-[100rem] h-[100rem] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-[80rem] h-[80rem] bg-emerald-500/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="glass w-full max-w-md rounded-[2.5rem] p-8 md:p-12 border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
            <Sparkles className="w-8 h-8 relative z-10" />
            <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"></div>
          </div>
          <div>
            <h1 className="text-3xl font-extralight text-slate-900 dark:text-white tracking-tight">System <span className="font-bold text-blue-400">Auth</span></h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-black mt-2">Trade Intelligence Portal</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-rose-700 dark:text-rose-200 text-xs font-medium">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity Node</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-600" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-14 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder:text-slate-700 tracking-wider outline-none"
                placeholder="operator@system.io"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Clearance Key</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-slate-600" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-4 pl-14 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all placeholder:text-slate-700 tracking-wider outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full relative h-14 group overflow-hidden rounded-2xl transition-all active:scale-95 disabled:opacity-50 mt-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all group-hover:scale-105"></div>
            <div className="relative flex items-center justify-center gap-3 px-8 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-[0.2em] h-full">
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Initialize Session'
              )}
            </div>
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
