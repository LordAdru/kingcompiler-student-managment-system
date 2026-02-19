
import React, { useState, useEffect, useMemo } from 'react';
import { dbService, localAssetService } from '../services/db';
import BookReader from './BookReader';
import { LibraryResource, LibraryGenre, LibraryLevel } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  X, 
  FileText, 
  Link as LinkIcon, 
  Save, 
  Library as LibraryIcon, 
  Image as ImageIcon, 
  ExternalLink, 
  Download, 
  Upload, 
  Filter, 
  Layers, 
  BookOpen, 
  Database, 
  Globe 
} from 'lucide-react';

const GENRES: LibraryGenre[] = ['Chess', 'Python', 'Web Dev', 'AI', 'Game Dev'];
const LEVELS: LibraryLevel[] = ['Beginner', 'Intermediate', 'Advance'];

export const LibraryManager: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<LibraryGenre | 'All'>('All');
  const [selectedLevel, setSelectedLevel] = useState<LibraryLevel | 'All'>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [readerResource, setReaderResource] = useState<LibraryResource | null>(null);

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
    if (confirm('Delete this resource? Local files will be purged from browser memory.')) {
      await dbService.deleteLibraryResource(id);
      await fetchData();
    }
  };

  const handleOpenLocalFile = async (resource: LibraryResource) => {
    if (resource.storageSource === 'local' && resource.localAssetId) {
      const data = await localAssetService.getFile(resource.localAssetId);
      if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else if (typeof data === 'string') {
        window.open(data, '_blank');
      }
    } else {
      window.open(resource.url, '_blank');
    }
  };

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (r.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || r.genre === selectedGenre;
      const matchesLevel = selectedLevel === 'All' || r.level === selectedLevel;
      return matchesSearch && matchesGenre && matchesLevel;
    });
  }, [resources, searchTerm, selectedGenre, selectedLevel]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Resource Vault</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Deploy Multi-Genre Training Assets</p>
        </div>
        <button 
          onClick={() => { setEditingResource(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-slate-950/20"
        >
          <Plus size={20} /> Deploy Resource
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search titles or tags..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all bg-slate-50/50 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Filter size={12}/> Genre
            </label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedGenre('All')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedGenre === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                All Genres
              </button>
              {GENRES.map(g => (
                <button 
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedGenre === g ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
              <Layers size={12}/> Level
            </label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedLevel('All')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedLevel === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
              >
                All Levels
              </button>
              {LEVELS.map(l => (
                <button 
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedLevel === l ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
             <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Vault...</p>
          </div>
        ) : filteredResources.map(res => (
          <div key={res.id} onClick={() => handleOpenLocalFile(res)} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden group hover:border-amber-400 hover:shadow-xl transition-all duration-300 cursor-pointer">
            <div className="h-48 relative overflow-hidden bg-slate-100 flex items-center justify-center">
               <CoverDisplay resource={res} />
               <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingResource(res); setIsModalOpen(true); }} className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-lg">
                    <Edit2Icon size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }} className="p-2.5 bg-white/90 backdrop-blur text-slate-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg">
                    <Trash2 size={16} />
                  </button>
               </div>
               <div className="absolute bottom-4 left-4 flex gap-1.5">
                  <span className={`px-3 py-1 backdrop-blur text-white text-[8px] font-black uppercase tracking-widest rounded-lg ${res.storageSource === 'local' ? 'bg-emerald-500/80' : 'bg-slate-900/80'}`}>
                    {res.storageSource === 'local' ? 'Offline IDB' : 'Cloud URL'}
                  </span>
                  <span className="px-3 py-1 bg-amber-500/90 backdrop-blur text-slate-950 text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {res.level}
                  </span>
               </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[8px] font-black uppercase border border-slate-100 rounded-md">
                  {res.genre}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-tight h-10">{res.title}</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{res.category || 'Standard'}</p>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={(e) => { e.stopPropagation(); setReaderResource(res); }} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black rounded-2xl shadow-md text-sm">Read</button>
                <button onClick={(e) => { e.stopPropagation(); handleOpenLocalFile(res); }} className="px-4 py-2 bg-white border border-slate-100 text-slate-600 rounded-2xl shadow-sm text-sm">Open</button>
              </div>
            </div>
          </div>
        ))}
        {readerResource && (
          <BookReader resource={readerResource} onClose={() => setReaderResource(null)} />
        )}
        {filteredResources.length === 0 && !isLoading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
             <LibraryIcon size={64} className="mx-auto text-slate-100 mb-6" />
             <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">No resources matching filters</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <LibraryModal 
          resource={editingResource}
          onClose={() => setIsModalOpen(false)}
          onSave={async (r, files) => {
            // Save local binary files to IndexedDB if needed
            if (r.storageSource === 'local' && files) {
              if (files.pdf) {
                const localId = `pdf_${Date.now()}`;
                await localAssetService.saveFile(localId, files.pdf);
                r.localAssetId = localId;
              }
              if (files.cover) {
                const coverId = `local_cover_${Date.now()}`;
                await localAssetService.saveFile(coverId, files.cover);
                r.coverImageUrl = coverId; // Use the key for IDB retrieval
              }
            }
            await dbService.saveLibraryResource(r);
            await fetchData();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

const Edit2Icon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;

const CoverDisplay: React.FC<{ resource: LibraryResource }> = ({ resource }) => {
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (resource.coverImageUrl?.startsWith('local_')) {
      localAssetService.getFile(resource.coverImageUrl).then(data => {
        if (data instanceof Blob) {
          setLocalUrl(URL.createObjectURL(data));
        } else if (typeof data === 'string' && data.startsWith('data:')) {
          setLocalUrl(data);
        }
      });
    }
    return () => {
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [resource.coverImageUrl]);

  const displayUrl = localUrl || (resource.coverImageUrl?.startsWith('local_') ? null : resource.coverImageUrl);

  if (displayUrl) {
    return <img src={displayUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={resource.title} />;
  }

  return (
    <div className="text-slate-200">
      {resource.type === 'pdf' ? <FileText size={64} /> : <LinkIcon size={64} />}
    </div>
  );
};

interface FileBundle {
  pdf?: Blob;
  cover?: Blob;
}

const LibraryModal: React.FC<{ 
  resource: LibraryResource | null, 
  onClose: () => void, 
  onSave: (r: LibraryResource, files?: FileBundle) => void 
}> = ({ resource, onClose, onSave }) => {
  const [formData, setFormData] = useState<LibraryResource>(resource || {
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    genre: 'Chess',
    level: 'Beginner',
    category: 'Syllabus Asset',
    url: '',
    coverImageUrl: '',
    type: 'pdf',
    addedDate: new Date().toISOString(),
    storageSource: 'cloud'
  });

  const [localFiles, setLocalFiles] = useState<FileBundle>({});
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (resource?.coverImageUrl?.startsWith('local_')) {
      localAssetService.getFile(resource.coverImageUrl).then(data => {
        if (data instanceof Blob) setCoverPreview(URL.createObjectURL(data));
        else if (typeof data === 'string') setCoverPreview(data);
      });
    } else if (resource?.coverImageUrl) {
      setCoverPreview(resource.coverImageUrl);
    }
  }, [resource]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFiles(prev => ({ ...prev, cover: file }));
      const reader = new FileReader();
      reader.onload = (event) => setCoverPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalFiles(prev => ({ ...prev, pdf: file }));
      setFormData(prev => ({ ...prev, title: prev.title || file.name.replace('.pdf', '') }));
    }
  };

  const handleSaveInternal = async () => {
    setIsSaving(true);
    await onSave(formData, localFiles);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div>
            <h2 className="text-2xl font-black text-slate-800">Resource Config</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Setup asset metadata</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 md:p-10 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setFormData({...formData, storageSource: 'cloud'})}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.storageSource === 'cloud' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              <Globe size={14} /> Cloud Link
            </button>
            <button 
              onClick={() => setFormData({...formData, storageSource: 'local'})}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.storageSource === 'local' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
            >
              <Database size={14} /> Local Device
            </button>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 block">Visual Cover & Meta</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative group cursor-pointer hover:border-amber-400 transition-all overflow-hidden">
                {coverPreview ? (
                  <img src={coverPreview} className="w-full h-full object-cover" alt="Cover" />
                ) : (
                  <>
                    <ImageIcon size={32} className="text-slate-200 mb-2" />
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Select Image</p>
                  </>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1">Genre</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value as any})}>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1">Training Level</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as any})}>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1">Asset Type</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-xs outline-none focus:ring-2 focus:ring-amber-500" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="pdf">Document (PDF)</option>
                    <option value="link">External Link</option>
                    <option value="video">Interactive Video</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Asset Title</label>
              <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500" placeholder="e.g. Master Your Opening Theory" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            {formData.storageSource === 'cloud' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Sub-Category Tag</label>
                  <input required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500" placeholder="e.g. Workbook v1.0" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block px-1">Source URL</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required className="w-full pl-11 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500" placeholder="Paste link here..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800">Local Asset Upload</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stored in Browser Database</p>
                  </div>
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    accept={formData.type === 'pdf' ? '.pdf' : '*'} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-xs" 
                    onChange={handlePdfUpload}
                  />
                  {localFiles.pdf && (
                    <p className="mt-2 text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2">
                      <CheckCircle2Icon size={12} /> {localFiles.pdf.size > 1024*1024 ? (localFiles.pdf.size/(1024*1024)).toFixed(1) + 'MB' : (localFiles.pdf.size/1024).toFixed(1) + 'KB'} Buffer Ready
                    </p>
                  )}
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed text-center">
                  Notice: Files stored locally remain on this specific device. Students accessing from other machines will need you to upload via cloud URL for global sync.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 md:p-10 bg-slate-50 border-t border-slate-100 flex gap-4">
           <button onClick={onClose} className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600 transition-all">Discard</button>
           <button 
             onClick={handleSaveInternal} 
             disabled={isSaving}
             className="flex-[2] bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-slate-950/30 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50"
           >
             {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18}/>}
             {isSaving ? 'Processing...' : 'Deploy Asset'}
           </button>
        </div>
      </div>
    </div>
  );
};

const CheckCircle2Icon = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
