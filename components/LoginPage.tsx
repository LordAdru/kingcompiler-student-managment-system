
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth';
import { Logo } from './Logo';
import { AppUser } from '../types';

// Use AppUser type imported from types.ts
export const LoginPage: React.FC<{ onLogin: (user: AppUser) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const user = await authService.signIn(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex flex-col items-center mb-10">
          <Logo size="xl" className="mb-4" />
          <div className="flex items-center gap-2 mt-4">
            <div className="h-px w-8 bg-slate-800"></div>
            <p className="text-slate-600 font-bold uppercase tracking-[0.4em] text-[10px]">Academy Manager Suite</p>
            <div className="h-px w-8 bg-slate-800"></div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 animate-in shake duration-300">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Identity Access</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-800/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder:text-slate-700 font-bold"
                  placeholder="kingcompiler.official@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Security Key</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="password" 
                  required
                  className="w-full bg-slate-800/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder:text-slate-700 font-bold"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group shadow-xl shadow-amber-500/20 mt-4 uppercase text-xs tracking-widest"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Establish Connection
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">Cloud Database Synchronized</p>
          <div className="flex gap-4">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            <div className="w-2 h-2 rounded-full bg-slate-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
