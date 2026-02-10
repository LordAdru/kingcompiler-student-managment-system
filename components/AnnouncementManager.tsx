
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Announcement } from '../types';
import { Plus, Trash2, X, Save, Bell, Info } from 'lucide-react';

export const AnnouncementManager: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await dbService.getAnnouncements();
    setAnnouncements(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this announcement?')) {
      await dbService.deleteAnnouncement(id);
      await fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Broadcaster</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Push updates to Student Portals</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg"
        >
          <Plus size={20} /> New Update
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <p className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading feed...</p>
        ) : announcements.map(ann => (
          <div key={ann.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-start justify-between group">
            <div className="flex gap-6 items-start">
               <div className={`p-4 rounded-2xl ${ann.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                  <Bell size={24} />
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">{ann.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">{ann.content}</p>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-4">Broadcasted on {ann.date}</p>
               </div>
            </div>
            <button onClick={() => handleDelete(ann.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
               <Trash2 size={20} />
            </button>
          </div>
        ))}
        {announcements.length === 0 && !isLoading && (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
             <Bell size={48} className="mx-auto text-slate-100 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active broadcasts</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <AnnouncementModal 
          onClose={() => setIsModalOpen(false)}
          onSave={async (a) => {
            await dbService.saveAnnouncement(a);
            await fetchData();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const AnnouncementModal: React.FC<{ onClose: () => void, onSave: (a: Announcement) => void }> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState<Announcement>({
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'medium'
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800">Create Broadcast</h2>
          <button onClick={onClose}><X className="text-slate-400" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Headline</label>
            <input className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Message Content</label>
            <textarea rows={4} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-medium text-sm" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase tracking-widest">Urgency Level</label>
            <div className="flex gap-2">
               {['low', 'medium', 'high'].map(p => (
                 <button 
                  key={p} 
                  type="button" 
                  onClick={() => setFormData({...formData, priority: p as any})}
                  className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                    formData.priority === p ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-100 text-slate-400'
                  }`}
                 >
                   {p}
                 </button>
               ))}
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50 flex gap-4">
           <button onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] text-slate-400">Cancel</button>
           <button onClick={() => onSave(formData)} className="flex-[2] bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2"><Save size={14}/> Publish Announcement</button>
        </div>
      </div>
    </div>
  );
};
