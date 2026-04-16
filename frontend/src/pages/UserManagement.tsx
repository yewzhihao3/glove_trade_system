import React, { useState, useEffect } from 'react';
import { UserPlus, Loader2, Sparkles, User, AlertCircle, Edit, Trash2, Mail, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../hooks/useAuth';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user: currentUser } = useAuth();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('marketing');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUserId(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('marketing');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setUsername(user.username || '');
    setEmail(user.email);
    setPassword(''); // leave blank
    setRole(user.role || 'marketing');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser?.id) {
      alert("Cannot delete your current active session.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await authService.deleteUser(id);
      fetchUsers();
    } catch (err: any) {
      if (err.response?.data?.detail) {
        alert(err.response.data.detail);
      } else {
        alert('Failed to delete user');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingUserId) {
        await authService.updateUser(editingUserId, { username, email, password: password || undefined, role });
      } else {
        const newUser = await authService.createUser({ username, email, password });
        if (role !== 'marketing') {
            await authService.updateUser(newUser.id, { role });
        }
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'System error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 p-4 md:p-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-extralight tracking-tight text-slate-900 dark:text-white flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <User className="w-8 h-8 text-blue-400" />
            </div>
            User <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Management</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light mt-2 max-w-2xl text-sm md:text-base">
            Administer system access, update operator clearances, and revoke identities.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
        >
          <UserPlus className="w-4 h-4" />
          Provision Operator
        </button>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-rose-700 dark:text-rose-200 text-sm">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map(u => (
            <div key={u.id} className="glass rounded-[2rem] p-6 md:p-8 border border-black/5 dark:border-white/5 hover:border-blue-500/20 transition-all group relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
                <Sparkles className="w-24 h-24 text-blue-400" />
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 shadow-inner transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">{u.username || 'System Admin'}</h3>
                  <p className="text-xs text-blue-400 font-mono tracking-tighter uppercase truncate pt-1">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-5 relative z-10">
                <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black">
                  {currentUser?.id === u.id ? <span className="text-emerald-500">Active Session</span> : 'Operator Access'}
                </div>
                <div className="absolute top-4 right-4 text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded bg-black/5 dark:bg-white/5 text-slate-500 object-top">
                  {u.role === 'admin' ? <span className="text-blue-500">ADMIN</span> : 'MKTG'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(u)}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-black/10 dark:bg-white/10 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={currentUser?.id === u.id}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border hover:border-rose-500/20 transition-colors border-transparent disabled:opacity-30 disabled:hover:text-slate-500 dark:text-slate-400 disabled:hover:bg-black/5 dark:bg-white/5 disabled:hover:border-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="glass w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 border border-black/10 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10 animate-in zoom-in-95 duration-200">
            
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-slate-900 dark:text-white flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-blue-400" />
                  {editingUserId ? 'Reconfigure' : 'Provision'} <b className="font-bold text-blue-300 ml-1">Operator</b>
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mt-2">Access Control</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <p className="text-rose-700 dark:text-rose-200 text-xs font-medium">{formError}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Operator Alias</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder:text-slate-700"
                    placeholder="agent_smith"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identity Node (Email)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-600" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder:text-slate-700"
                    placeholder="operator@system.io"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Clearance Key (Password)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-600" />
                  </div>
                  <input
                    type="password"
                    required={!editingUserId}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder:text-slate-700"
                    placeholder={editingUserId ? "Leave blank to keep current password" : "••••••••"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Operator Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-slate-600" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="marketing">Marketing (Restricted)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-12 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all text-xs font-bold tracking-widest uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 relative h-12 group overflow-hidden rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all group-hover:scale-105"></div>
                  <div className="relative flex items-center justify-center gap-3 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-[0.2em] h-full">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                  </div>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
