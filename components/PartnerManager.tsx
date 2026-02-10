
import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../services/db';
import { authService } from '../services/auth';
import { AppUser } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Handshake, 
  Mail, 
  X, 
  CheckCircle2, 
  UserPlus, 
  Key, 
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const PartnerManager: React.FC = () => {
  const [partners, setPartners] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await dbService.getCollaborators();
    setPartners(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => 
      (p.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partners, searchTerm]);

  const handleDelete = async (uid: string) => {
    if (confirm('Are you sure? Deleting a partner will detach them from their assigned students.')) {
      await dbService.deleteCollaborator(uid);
      await fetchData();
    }
  };

  const handleSave = async (partner: AppUser) => {
    await dbService.saveCollaborator(partner);
    await fetchData();
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  const handleCreateAccount = async (email: string, pass: string, name: string) => {
    try {
      await authService.adminCreateUserAccount(email, pass, name, 'collaborator');
      await fetchData();
      setIsCredsModalOpen(false);
      alert(`Success! Login credentials for ${email} have been generated.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const seedUKUAE = () => {
    setEditingPartner({
      uid: 'pending-' + Date.now(),
      displayName: 'UKUAE-1',
      email: 'Goheme4@gmail.com',
      role: 'collaborator'
    });
    setIsCredsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Partner Directory</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage collaborations & referrals</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={seedUKUAE}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-3 rounded-2xl font-black transition-all shadow-lg text-[10px] uppercase tracking-widest"
          >
            <Handshake size={18} />
            Quick Add UKUAE-1
          </button>
          <button 
            onClick={() => { setEditingPartner(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-black transition-all shadow-lg text-[10px] uppercase tracking-widest"
          >
            <UserPlus size={18} />
            New Partner
          </button>
        </div>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Filter partners by name or email..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading partners...</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Email</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.map((partner) => (
                <tr key={partner.uid} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-black">
                        {partner.displayName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{partner.displayName || 'Unnamed Partner'}</p>
                        <p className="text-[8px] font-black uppercase text-slate-400">UID: {partner.uid.substring(0,8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                    {partner.email}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        title="Generate Login Credentials"
                        onClick={() => { setEditingPartner(partner); setIsCredsModalOpen(true); }} 
                        className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      >
                        <Key size={18} />
                      </button>
                      <button onClick={() => { setEditingPartner(partner); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(partner.uid)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPartners.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-20 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">No partners registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <PartnerModal 
          partner={editingPartner} 
          onClose={() => { setIsModalOpen(false); setEditingPartner(null); }} 
          onSave={handleSave} 
        />
      )}

      {isCredsModalOpen && editingPartner && (
        <CredentialModal
          email={editingPartner.email || ''}
          displayName={editingPartner.displayName || ''}
          onClose={() => { setIsCredsModalOpen(false); setEditingPartner(null); }}
          onConfirm={handleCreateAccount}
        />
      )}
    </div>
  );
};

const CredentialModal: React.FC<{ email: string, displayName: string, onClose: () => void, onConfirm: (email: string, pass: string, name: string) => void }> = ({ email, displayName, onClose, onConfirm }) => {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    await onConfirm(email, password, displayName);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-xl font-black text-slate-800">Cloud Credentials</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Generate Firebase Login</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-700">
            <ShieldCheck size={20} className="flex-shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed">
              This will create a new entry in Firebase Auth. You will NOT be logged out of your session.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identity</label>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-slate-800 flex items-center gap-3">
              <Mail size={16} className="text-slate-400" />
              {email}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Assigned Security Key</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required 
                type={showPass ? "text" : "password"}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancel</button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-400"
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle2 size={16} />}
              Generate Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PartnerModal: React.FC<{ partner: AppUser | null, onClose: () => void, onSave: (p: AppUser) => void }> = ({ partner, onClose, onSave }) => {
  const [formData, setFormData] = useState<AppUser>(partner || {
    uid: Math.random().toString(36).substr(2, 9),
    displayName: '',
    email: '',
    role: 'collaborator'
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-xl font-black text-slate-800">Partner Configuration</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identity Management</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Collaboration Name</label>
            <div className="relative">
              <Handshake className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                placeholder="e.g. UKUAE-1"
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Login/Contact Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                required 
                type="email"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:ring-2 focus:ring-amber-500 transition-all" 
                placeholder="partner@example.com"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancel</button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Save Partner
          </button>
        </div>
      </div>
    </div>
  );
};
