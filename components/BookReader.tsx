import React from 'react';
import { LibraryResource } from '../types';
import { X } from 'lucide-react';

interface Props {
  resource: LibraryResource;
  onClose: () => void;
}

const BookReader: React.FC<Props> = ({ resource, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 p-6">
      <div className="relative w-full max-w-5xl h-[80vh]">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 z-50 p-2 bg-white rounded-full shadow hover:bg-slate-100"
        >
          <X size={24} />
        </button>

        <div className="w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
          <iframe 
            title={resource.title} 
            src={resource.url} 
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};

export default BookReader;
