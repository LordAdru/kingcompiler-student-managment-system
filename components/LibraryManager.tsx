
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { LibraryResource } from '../types';
import { Plus, Trash2, Search, X, FileText, Link as LinkIcon, Save, Library as LibraryIcon, Image as ImageIcon, ExternalLink, Download, Upload } from 'lucide-react';

export const LibraryManager: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const data = await dbService.getLibrary(false);
    setResources(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this resource?')) {
      await dbService.deleteLibraryResource(id);
      await fetchData();
    }
  };

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Resource Vault</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Deploy PDFs & Interactive Links</p>
        </div>
        <button 
          onClick={() => { setEditingResource(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-950/20"
        >
          <Plus size={20} /> Deploy Resource
        </button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Filter catalog..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all bg-white font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Vault...</p>
          </div>
        ) : filteredResources.map(res => (
          <div key={res.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden group hover:border-amber-400 hover:shadow-xl transition-all duration-300">
            <div className="h-48 relative overflow-hidden bg-slate-100 flex items-center justify-center">
               {res.coverImageUrl ? (
                 <img src={res.coverImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={res.title} />
               ) : (
                 <div className="text-slate-200">
                    {res.type === 'pdf' ? <FileText size={64} /> : <LinkIcon size={64} />}
                 </div>
               )}
               <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => { setEditingResource(res); setIsModalOpen(true); }} className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-lg">
                    <ImageIcon size={16} />
                  </button>
                  <button onClick={() => handleDelete(res.id)} className="p-2.5 bg-white/90 backdrop-blur text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg">
                    <Trash2 size={16} />
                  </button>
               </div>
               <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-slate-900/80 backdrop-blur text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {res.type}
                  </span>
               </div>
            </div>
            <div className="p-6 space-y-2">
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{res.category}</p>
              <h3 className="text-lg font-black text-slate-800 line-clamp-1 leading-tight">{res.title}</h3>
            </div>
          </div>
        ))}
        {filteredResources.length === 0 && !isLoading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
             <LibraryIcon size={64} className="mx-auto text-slate-100 mb-6" />
             <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">No resources in vault</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <LibraryModal 
          resource={editingResource}
          onClose={() => setIsModalOpen(false)}
          onSave={async (r) => {
            await dbService.saveLibraryResource(r);
            await fetchData();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const LibraryModal: React.FC<{ resource: LibraryResource | null, onClose: () => void, onSave: (r: LibraryResource) => void }> = ({ resource, onClose, onSave }) => {
  const [formData, setFormData] = useState<LibraryResource>(resource || {
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    category: 'Masterclass',
    url: '',
    coverImageUrl: '',
    type: 'pdf',
    addedDate: new Date().toISOString()
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, coverImageUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Resource Meta</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure vault asset</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-full transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-8 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Resource Title</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Category</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Asset Type</label>
                  <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="pdf">Portable Document (PDF)</option>
                    <option value="link">External URL</option>
                    <option value="video">Interactive Video</option>
                  </select>
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Visual Cover</label>
               <div className="h-48 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative group cursor-pointer hover:border-amber-400 transition-all overflow-hidden">
                  {formData.coverImageUrl ? (
                    <img src={formData.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-slate-200 mb-2" />
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Select Image</p>
                    </>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
               </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Direct Source URL (PDF/Link)</label>
            <div className="relative">
               <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                required 
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-2 focus:ring-amber-500" 
                placeholder="https://drive.google.com/..." 
                value={formData.url} 
                onChange={e => setFormData({...formData, url: e.target.value})} 
              />
            </div>
          </div>
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
           <button onClick={onClose} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-all">Discard</button>
           <button onClick={() => onSave(formData)} className="flex-[2] bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-slate-950/30 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98]">
             <Save size={18}/> Commit to Vault
           </button>
        </div>
      </div>
    </div>
  );
};
