
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Task, Priority } from '../types';
import { 
  Hash, Trash2, Check, X, Plus, Edit2, ArrowLeft, Tag as TagIcon, Pencil
} from 'lucide-react';

interface TagsViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onMenuClick?: () => void;
}

const TagsView: React.FC<TagsViewProps> = ({ tasks, onUpdateTask, onMenuClick }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(t => t.tags?.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [tasks]);

  const handleCreateTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }
    // Since tags are derived from tasks, creating a tag that doesn't exist 
    // doesn't "save" it anywhere until used. In Keep, labels are entities.
    // For this clone, we'll assume creating a tag means we're ready to use it.
    // We don't have a global tag list, so we'll just reset UI.
    setIsCreating(false);
    setNewTagInput('');
  };

  const handleRenameTag = (oldTag: string) => {
    const newTag = editingValue.trim();
    if (!newTag || newTag === oldTag) {
      setEditingTag(null);
      return;
    }

    // Rename tag in all tasks
    tasks.forEach(task => {
      if (task.tags?.includes(oldTag)) {
        const updatedTags = task.tags.map(t => t === oldTag ? newTag : t);
        onUpdateTask({ ...task, tags: updatedTags });
      }
    });

    setEditingTag(null);
  };

  const handleDeleteTag = (tagToDelete: string) => {
    if (!window.confirm(`Delete label "${tagToDelete}"? It will be removed from all notes.`)) return;

    // Remove tag from all tasks
    tasks.forEach(task => {
      if (task.tags?.includes(tagToDelete)) {
        const updatedTags = task.tags.filter(t => t !== tagToDelete);
        onUpdateTask({ ...task, tags: updatedTags });
      }
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
        {/* Header - Safe Area Wrapper */}
        <div className="pt-safe bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 z-20">
            <div className="h-16 flex items-center gap-4 px-4">
                <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white">Edit labels</h1>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-slate-950">
            <div className="max-w-md mx-auto py-2">
                {/* Create Label Row - inspired by label_editor_create_label.xml */}
                <div className="flex items-center px-4 py-2 group focus-within:border-y focus-within:border-slate-200 dark:focus-within:border-slate-800 transition-all">
                    <div className="w-12 flex justify-center shrink-0">
                        {isCreating ? (
                            <button onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        ) : (
                            <div className="p-2 text-slate-400">
                                <Plus size={20} />
                            </div>
                        )}
                    </div>
                    
                    <input 
                        ref={createInputRef}
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onFocus={() => setIsCreating(true)}
                        placeholder="Create new label"
                        className="flex-1 bg-transparent text-sm py-3 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400"
                        onKeyDown={(e) => { if(e.key === 'Enter') handleCreateTag(); }}
                    />

                    {(isCreating && newTagInput.trim()) && (
                        <button onClick={handleCreateTag} className="p-2 text-slate-400 hover:text-blue-500">
                            <Check size={20} />
                        </button>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-4" />

                {/* Labels List - inspired by label_editor_label_entry.xml */}
                <div className="mt-1">
                    {allTags.map(tag => {
                        const isEditingThis = editingTag === tag;
                        return (
                            <div 
                                key={tag} 
                                className={`flex items-center px-4 py-1 group transition-all ${isEditingThis ? 'bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 shadow-sm z-10' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                            >
                                <div className="w-12 flex justify-center shrink-0">
                                    <button 
                                        onClick={() => isEditingThis ? handleDeleteTag(tag) : setEditingTag(tag)}
                                        className={`p-2 transition-colors ${isEditingThis ? 'text-slate-400 hover:text-red-500' : 'text-slate-400 group-hover:hidden'}`}
                                    >
                                        <TagIcon size={18} />
                                    </button>
                                    {!isEditingThis && (
                                        <button 
                                            onClick={() => handleDeleteTag(tag)}
                                            className="p-2 text-slate-400 hover:text-red-500 hidden group-hover:block animate-in fade-in"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1">
                                    {isEditingThis ? (
                                        <input 
                                            ref={editInputRef}
                                            autoFocus
                                            value={editingValue}
                                            onChange={(e) => setEditingValue(e.target.value)}
                                            className="w-full bg-transparent text-sm py-3 outline-none text-slate-800 dark:text-slate-100 font-bold"
                                            onBlur={() => handleRenameTag(tag)}
                                            onKeyDown={(e) => { 
                                                if(e.key === 'Enter') handleRenameTag(tag);
                                                if(e.key === 'Escape') setEditingTag(null);
                                            }}
                                        />
                                    ) : (
                                        <div 
                                            onClick={() => { setEditingTag(tag); setEditingValue(tag); }}
                                            className="text-sm py-3 font-medium text-slate-700 dark:text-slate-200 truncate cursor-text"
                                        >
                                            {tag}
                                        </div>
                                    )}
                                </div>

                                <div className="w-10 flex justify-center shrink-0">
                                    {isEditingThis ? (
                                        <button 
                                            onMouseDown={(e) => { e.preventDefault(); handleRenameTag(tag); }}
                                            className="p-2 text-blue-600 dark:text-blue-400"
                                        >
                                            <Check size={20} />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => { setEditingTag(tag); setEditingValue(tag); }}
                                            className="p-2 text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {allTags.length === 0 && !isCreating && (
                        <div className="text-center py-20 px-10">
                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4">
                                <TagIcon size={32} className="text-slate-200 dark:text-slate-800" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">Labels you create will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default TagsView;
