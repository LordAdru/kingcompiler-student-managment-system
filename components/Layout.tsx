
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  LogOut, 
  RefreshCw,
  BookOpen,
  Layers,
  Handshake,
  Menu,
  X
} from 'lucide-react';
import { dbService } from '../services/db';
import { AppUser } from '../types';
import { Logo } from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  user: AppUser;
  onNavigate: (view: any) => void;
  currentView: string;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onNavigate, currentView, onLogout }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = useMemo(() => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'students', label: 'Students', icon: Users },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
    ];

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { id: 'groups', label: 'Batches', icon: Layers },
        { id: 'partners', label: 'Partners', icon: Handshake },
        { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
      ];
    }

    return baseItems;
  }, [user.role]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(async () => {
      await dbService.syncAllSessions();
      setIsSyncing(false);
      window.location.reload();
    }, 800);
  };

  const navigateAndClose = (view: any) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-2xl transition-transform duration-300 transform
        lg:relative lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Logo size="md" />
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateAndClose(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-amber-500 text-slate-900 shadow-xl shadow-amber-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {user.role === 'admin' && (
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full flex items-center gap-3 px-4 py-3 text-amber-400 hover:bg-amber-400/10 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
              <span className="font-bold text-xs uppercase tracking-widest">{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
            </button>
          )}
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span className="font-bold text-xs uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <h1 className="text-slate-800 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                {user.role === 'collaborator' ? 'Partner Portal' : 'Admin Console'} • {currentView.replace('-', ' ')}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-900 leading-none mb-1">{user.displayName || user.email?.split('@')[0]}</p>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{user.role}</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs border border-slate-800 shadow-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};
