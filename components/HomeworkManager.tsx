
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Homework, Student } from '../types';
import { Plus, Trash2, Search, X, FileText, Save, ClipboardList, User, Layers, CheckCircle2, Clock } from 'lucide-react';
import { LEVEL_TOPICS } from '../constants';

export const HomeworkManager: React.FC = () => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const [hData, sData] = await Promise.all([
      dbService.getHomework(),
      dbService.getStudents()
    ]);
    setHomeworks(hData);
    setStudents(sData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this assignment?')) {
      await dbService.deleteHomework(id);
      await fetchData();
    }
  };

  const filteredHomeworks = homeworks.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {isLoading ? (
          <p className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading feed...</p>
        ) : filteredHomeworks.map(hw => {
          const targetStudent = students.find(s => s.id === hw.studentId);
          return (
            <div key={hw.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hw.status === 'submitted' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                  <ClipboardList size={24} />
                </div>
                <div className="flex gap-2">
                   {hw.status === 'submitted' && (
                     <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg" title="Submission Received">
                        <CheckCircle2 size={16} />
                     </span>
                   )}
                   <button onClick={() => handleDelete(hw.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{hw.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{hw.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hw.studentId ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">
                      <User size={10} /> {targetStudent?.fullName || 'Specific User'}
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
          );
        })}
        {filteredHomeworks.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
             <ClipboardList size={48} className="mx-auto text-slate-100 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No assignments published</p>
          </div>
        )}
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
  const [formData, setFormData] = useState<Homework>({
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    description: '',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'pending',
    level: '',
    studentId: ''
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800">Assign Training</h2>
          <button onClick={onClose}><X className="text-slate-400" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Headline</label>
            <input className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Instructions</label>
            <textarea rows={3} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-medium text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Due Date</label>
                <input type="date" className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Target Tier</label>
                <select className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value, studentId: ''})}>
                  <option value="">Select Level</option>
                  {LEVEL_TOPICS.map(l => <option key={l.level} value={l.level}>{l.level}</option>)}
                </select>
             </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Or Specific Student</label>
            <select className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value, level: ''})}>
              <option value="">Global Broadcast</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
        </div>
        <div className="p-8 bg-slate-50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button>
           <button onClick={() => onSave(formData)} className="flex-[2] bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Save size={14}/> Save Task</button>
        </div>
      </div>
    </div>
  );
};
