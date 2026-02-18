
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Homework, Student } from '../types';
import { Plus, Trash2, Search, X, FileText, Save, ClipboardList, User, Layers, CheckCircle2, Clock, Link as LinkIcon, Image as ImageIcon, Upload, RefreshCw, Users } from 'lucide-react';
import { LEVEL_TOPICS } from '../constants';

export const HomeworkManager: React.FC = () => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [hData, sData] = await Promise.all([
        dbService.getHomework(),
        dbService.getStudents()
      ]);
      setHomeworks(hData);
      setStudents(sData);
    } catch (err) {
      console.error("Homework Manager: Failed to refresh list", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!id) {
      alert("System Error: This assignment record is missing a valid Document ID. Please refresh and try again.");
      return;
    }

    if (confirm('Permanently delete this assignment? This will remove it from the database for all users.')) {
      setDeletingId(id);
      
      try {
        setHomeworks(prev => prev.filter(h => h.id !== id));
        await dbService.deleteHomework(id);
        const hData = await dbService.getHomework();
        setHomeworks(hData);
      } catch (err: any) {
        console.error("Delete Operation Failed:", err);
        alert("Database Error: " + (err.message || "Could not delete assignment."));
        fetchData();
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredHomeworks = homeworks.filter(h => {
    const search = searchTerm.toLowerCase();
    const title = (h.title || '').toLowerCase();
    const desc = (h.description || '').toLowerCase();
    return title.includes(search) || desc.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Assignment Desk</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Tasks & Homework</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg"
        >
          <Plus size={20} /> Create Assignment
        </button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Search assignments..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && homeworks.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Tasks...</p>
          </div>
        ) : filteredHomeworks.map(hw => {
          const targetStudent = students.find(s => s.id === hw.studentId);
          const isDeleting = deletingId === hw.id;

          return (
            <div key={hw.id} className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col group overflow-hidden animate-in fade-in zoom-in duration-300 relative transition-all ${isDeleting ? 'opacity-30 scale-95 grayscale' : 'hover:border-amber-200'}`}>
              {hw.attachmentUrl && (
                <div className="h-32 w-full overflow-hidden bg-slate-100 border-b border-slate-50">
                  <img src={hw.attachmentUrl} className="w-full h-full object-cover" alt="Task Preview" />
                </div>
              )}
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hw.status === 'submitted' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                    <ClipboardList size={24} />
                  </div>
                  <div className="flex gap-2 relative z-20">
                    {hw.status === 'submitted' && (
                      <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100" title="Submission Received">
                          <CheckCircle2 size={16} />
                      </span>
                    )}
                    <button 
                      type="button"
                      disabled={isDeleting}
                      onClick={(e) => handleDelete(e, hw.id)} 
                      className={`p-2.5 rounded-xl transition-all shadow-sm border ${
                        isDeleting 
                        ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed' 
                        : 'bg-white text-slate-400 hover:text-white hover:bg-red-500 border-slate-200 hover:border-red-600 shadow-md'
                      }`} 
                      title="Purge Task"
                    >
                      {isDeleting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{hw.title || 'Untitled Task'}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{hw.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hw.studentId ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">
                        <User size={10} /> {targetStudent?.fullName || 'User Record'}
                      </span>
                    ) : hw.level ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase border border-purple-100">
                        <Layers size={10} /> {hw.level}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase border border-slate-100">
                        Everyone
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${hw.status === 'submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      <Clock size={10} /> Due: {hw.dueDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <HomeworkModal 
          students={students}
          onClose={() => setIsModalOpen(false)}
          onSave={async (h) => {
            await dbService.saveHomework(h);
            await fetchData();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const HomeworkModal: React.FC<{ students: Student[], onClose: () => void, onSave: (h: Homework) => void }> = ({ students, onClose, onSave }) => {
  const [audienceType, setAudienceType] = useState<'level' | 'student'>('level');
  const [formData, setFormData] = useState<Homework>({
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'pending',
    level: '',
    studentId: '',
    resourceLink: '',
    attachmentUrl: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, attachmentUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Safety check: ensure one is selected
    if (audienceType === 'level' && !formData.level) {
      alert("Please select a target Level.");
      return;
    }
    if (audienceType === 'student' && !formData.studentId) {
      alert("Please select a specific Student.");
      return;
    }
    onSave(formData);
  };

  const handleAudienceSwitch = (type: 'level' | 'student') => {
    setAudienceType(type);
    if (type === 'level') {
      setFormData({ ...formData, studentId: '' });
    } else {
      setFormData({ ...formData, level: '' });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
            <h2 className="text-xl font-black text-slate-800">Assign Training</h2>
            <button type="button" onClick={onClose}><X className="text-slate-400" size={24} /></button>
          </div>
          <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Headline</label>
              <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold focus:ring-4 focus:ring-amber-500/10 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Mastering Endgame Tactics" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Instructions</label>
              <textarea required rows={3} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-medium text-sm focus:ring-4 focus:ring-amber-500/10 outline-none transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Solve 5 puzzles on the link below and record your thoughts..." />
            </div>
            
            <div className="space-y-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
               <div>
                  <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon size={12}/> Interactive Link
                  </label>
                  <input 
                    className="w-full px-5 py-3 rounded-xl bg-white border border-slate-100 font-bold text-xs outline-none focus:border-amber-500 transition-colors" 
                    placeholder="https://lichess.org/..."
                    value={formData.resourceLink} 
                    onChange={e => setFormData({...formData, resourceLink: e.target.value})} 
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={12}/> Diagram / Task Image
                  </label>
                  <div className="flex gap-4 items-center">
                     <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-3 p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl hover:border-amber-400 hover:bg-amber-50 transition-all text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                          <Upload size={18} /> {formData.attachmentUrl ? 'Change Image' : 'Select Image'}
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                     </label>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 block uppercase tracking-widest">Target Audience</label>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => handleAudienceSwitch('level')}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${audienceType === 'level' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  <Users size={14} /> Course Level
                </button>
                <button 
                  type="button"
                  onClick={() => handleAudienceSwitch('student')}
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${audienceType === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  <User size={14} /> Individual
                </button>
              </div>

              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                {audienceType === 'level' ? (
                  <select 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-amber-500/10" 
                    value={formData.level} 
                    onChange={e => setFormData({...formData, level: e.target.value})}
                  >
                    <option value="">Select Target Level</option>
                    {LEVEL_TOPICS.map(l => <option key={l.level} value={l.level}>{l.level}</option>)}
                  </select>
                ) : (
                  <select 
                    required 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm outline-none focus:ring-4 focus:ring-amber-500/10" 
                    value={formData.studentId} 
                    onChange={e => setFormData({...formData, studentId: e.target.value})}
                  >
                    <option value="">Select Recipient</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">Due Date</label>
              <input 
                type="date" 
                required
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-sm focus:ring-4 focus:ring-amber-500/10 outline-none transition-all" 
                value={formData.dueDate} 
                onChange={e => setFormData({...formData, dueDate: e.target.value})} 
              />
            </div>
          </div>
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
             <button type="button" onClick={onClose} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
             <button type="submit" className="flex-[2] bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98]">
               <Save size={18}/> Deploy Task
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
