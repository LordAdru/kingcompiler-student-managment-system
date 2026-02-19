import React, { useEffect, useState } from 'react';
import { LibraryResource } from '../types';
import { localAssetService } from '../services/db';
import { X } from 'lucide-react';

interface Props {
  resource: LibraryResource;
  onClose: () => void;
}

const BookReader: React.FC<Props> = ({ resource, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string>(resource.url);

  // Prevent common download shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      alert('Downloading is not allowed for this resource.');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      alert('Printing is not allowed for this resource.');
    }
  };

  // Prevent right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  useEffect(() => {
    let objUrl: string | null = null;
    const loadLocal = async () => {
      try {
        if (resource.storageSource === 'local' && resource.localAssetId) {
          const data = await localAssetService.getFile(resource.localAssetId);
          if (data instanceof Blob) {
            objUrl = URL.createObjectURL(data);
            setPdfUrl(objUrl);
          } else if (typeof data === 'string') {
            setPdfUrl(data);
          }
        }
      } catch (err) {
        console.warn('BookReader: failed to load local asset', err);
      }
    };

    loadLocal();
    return () => { if (objUrl) URL.revokeObjectURL(objUrl); };
  }, [resource]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-6" onKeyDown={handleKeyDown}>
      <div className="relative w-full max-w-5xl h-[80vh] perspective">
        <button onClick={onClose} className="absolute right-4 top-4 z-50 p-2 bg-white rounded-full shadow hover:bg-slate-100">
          <X />
        </button>

        <div className="w-full h-full bg-transparent flex items-center justify-center">
          <div className="book-container w-full h-full max-h-full bg-white rounded-2xl shadow-2xl overflow-hidden relative" role="dialog" aria-modal="true" onContextMenu={handleContextMenu}>
            <iframe 
              title={resource.title} 
              src={pdfUrl} 
              className="w-full h-full border-0" 
              onContextMenu={handleContextMenu}
              allow="fullscreen *"
              style={{ pointerEvents: 'auto' }}
            />
            <style>{`
              /* Hide PDF toolbar download button via CSS */
              iframe[src*=".pdf"] { --pdf-toolbar-height: 0; }
            `}</style>
          </div>
        </div>
      </div>

      <style>{`
        .perspective { perspective: 1400px; }
        .book-container { transform-origin: center; animation: slideIn 400ms cubic-bezier(.2,.9,.3,1); }
        @keyframes slideIn {
          from { transform: scale(0.95) opacity(0); }
          to { transform: scale(1) opacity(1); }
        }
      `}</style>
    </div>
  );
};

export default BookReader;
