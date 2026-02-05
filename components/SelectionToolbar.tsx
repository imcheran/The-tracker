
import React from 'react';
import { Archive, Trash2, Palette, Tag, Pin, X } from 'lucide-react';

interface SelectionToolbarProps {
  count: number;
  onClear: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onColor: () => void;
  onLabel: () => void;
  onPin: () => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ 
    count, onClear, onArchive, onDelete, onColor, onLabel, onPin 
}) => {
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[95vw] max-w-lg">
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl flex items-center px-4 py-2 gap-2 animate-slide-up border border-slate-700/50">
        <button onClick={onClear} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <X size={20} />
        </button>
        
        <span className="flex-1 font-bold text-sm ml-2">{count} selected</span>

        <div className="flex items-center gap-1">
          <button onClick={onPin} title="Pin" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
            <Pin size={20} />
          </button>
          <button onClick={onColor} title="Background" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
            <Palette size={20} />
          </button>
          <button onClick={onLabel} title="Add label" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
            <Tag size={20} />
          </button>
          <button onClick={onArchive} title="Archive" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors">
            <Archive size={20} />
          </button>
          <button onClick={onDelete} title="Delete" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-red-400">
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionToolbar;
