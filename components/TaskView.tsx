import React, { useState, useRef, useEffect } from 'react';
import { Task, Priority, ViewType, List, AppSettings, Habit } from '../types';
import { 
  CheckCircle2, Plus, Inbox, Search, Layers, Archive, Sun, CalendarDays, Trash2, Menu,
  MoreVertical, Check, X, Notebook, Pin, Image as ImageIcon, ChevronDown,
  Palette, Clock, ListTodo, Hash, Lock, PenTool, Mic, Type, MousePointer2, Sparkles, Loader2, Users, LayoutGrid, List as ListIcon,
  Calendar, FolderInput, ArrowRight, Eye, EyeOff, Circle, Grid, LayoutList, CheckSquare, Brush, Target
} from 'lucide-react';
import { format, isSameDay, addDays, isBefore, isToday, isTomorrow, isAfter } from 'date-fns';
import TaskInputSheet from './TaskInputSheet';
import { NoteBackground } from './NoteBackgrounds';
import SelectionToolbar from './SelectionToolbar';

// Polyfill for isPast since it might be missing in newer date-fns versions
const isPast = (date: Date) => isBefore(date, new Date());

interface TaskViewProps {
  tasks: Task[];
  lists: List[];
  viewType: ViewType | string;
  searchQuery?: string;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onMenuClick?: () => void;
  onChangeView?: (view: ViewType | string) => void;
  settings?: AppSettings;
  habits?: Habit[];
  onUpdateHabit?: (habit: Habit) => void;
  user?: any;
}

// --- Swipeable Task Item Component (For Task Lists) ---
interface SwipeableTaskItemProps {
    task: Task;
    isSimplified: boolean;
    onToggle: () => void;
    onSelect: () => void;
    onDelete: () => void;
    onMove: () => void;
    onDate: () => void;
}

const SwipeableTaskItem: React.FC<SwipeableTaskItemProps> = ({ 
    task, isSimplified, onToggle, onSelect, onDelete, onMove, onDate 
}) => {
    const [offsetX, setOffsetX] = useState(0);
    const startX = useRef(0);
    const isDragging = useRef(false);
    const itemRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        // Limit swipe distance
        if (diff > 150) setOffsetX(150);
        else if (diff < -100) setOffsetX(-100);
        else setOffsetX(diff);
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (offsetX > 60) {
            setOffsetX(120); // Keep open right
        } else if (offsetX < -60) {
            setOffsetX(-80); // Keep open left
        } else {
            setOffsetX(0); // Snap back
        }
    };

    // Reset if user interacts elsewhere
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
                setOffsetX(0);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const priorityColor = {
        [Priority.High]: 'text-red-500',
        [Priority.Medium]: 'text-yellow-500',
        [Priority.Low]: 'text-blue-500',
        [Priority.None]: 'text-slate-300'
    };

    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isSameDay(new Date(task.dueDate), new Date()) && !task.isCompleted;

    return (
        <div className="relative mb-3 select-none touch-pan-y" ref={itemRef}>
            {/* Actions Layer */}
            <div className="absolute inset-0 flex items-center justify-between rounded-xl overflow-hidden">
                {/* Left Actions (Swipe Right) */}
                <div className="flex h-full">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onMove(); setOffsetX(0); }}
                        className="bg-blue-500 text-white w-14 h-full flex items-center justify-center"
                    >
                        <FolderInput size={20} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDate(); setOffsetX(0); }}
                        className="bg-orange-500 text-white w-14 h-full flex items-center justify-center"
                    >
                        <Calendar size={20} />
                    </button>
                </div>
                
                {/* Right Actions (Swipe Left) */}
                <div className="flex h-full">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="bg-red-500 text-white w-20 h-full flex items-center justify-center"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Task Content Layer */}
            <div 
                className="relative bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-3 transition-transform duration-200 ease-out z-10 active:scale-[0.98]"
                style={{ transform: `translateX(${offsetX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={onSelect}
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={`mt-0.5 shrink-0 ${priorityColor[task.priority]}`}
                >
                    {task.isCompleted ? <CheckCircle2 size={22} className="text-slate-400" /> : <Circle size={22} />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className={`text-base font-medium truncate ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                        {task.title}
                    </div>
                    
                    {!isSimplified && (
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            {task.dueDate && (
                                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-blue-500 dark:text-blue-400'}`}>
                                    <Calendar size={12} />
                                    <span>
                                        {isToday(new Date(task.dueDate)) ? 'Today' : 
                                         isTomorrow(new Date(task.dueDate)) ? 'Tomorrow' : 
                                         format(new Date(task.dueDate), 'MMM d')}
                                    </span>
                                    {task.duration && <span className="text-slate-400">• {task.duration}m</span>}
                                </div>
                            )}
                            
                            {task.tags.length > 0 && (
                                <div className="flex items-center gap-1">
                                    {task.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">#{tag}</span>
                                    ))}
                                </div>
                            )}

                            {task.description && (
                                <span className="text-xs text-slate-400 line-clamp-1 w-full mt-0.5">
                                    {task.description.replace(/<[^>]*>?/gm, '')}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Note Item Component (Google Keep Style) ---
interface NoteItemProps { 
    note: Task; 
    onClick: () => void; 
    onLongPress: () => void;
    isSelected: boolean;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onClick, onLongPress, isSelected }) => {
    const imageAttachment = note.attachments?.find(a => a.type === 'image' || a.type === 'drawing');
    const isDark = document.documentElement.classList.contains('dark');
    const timerRef = useRef<any>(null);

    // Only render background if a color or theme is set
    const hasCustomBg = (note.color && note.color !== '#ffffff' && note.color !== '#0f172a') || (note.backgroundImage && note.backgroundImage !== 'none');

    const handleTouchStart = () => {
        timerRef.current = setTimeout(onLongPress, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    return (
        <div 
            onClick={onClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            className={`
                break-inside-avoid mb-3 rounded-xl overflow-hidden cursor-pointer flex flex-col group relative transition-all duration-200
                ${isSelected ? 'ring-4 ring-slate-800/20 dark:ring-white/20' : ''}
                ${!hasCustomBg ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800' : 'border border-black/5'}
            `}
            style={{ 
                backgroundColor: note.color !== '#ffffff' ? note.color : undefined 
            }}
        >
            {/* Selection Checkmark */}
            {isSelected && (
                <div className="absolute top-2 left-2 z-30 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full p-1 animate-scale-in">
                    <Check size={12} strokeWidth={3} />
                </div>
            )}

            {/* Background Theme Pattern if present */}
            {note.backgroundImage && note.backgroundImage !== 'none' && (
                <NoteBackground themeId={note.backgroundImage} isDark={isDark} className="opacity-50" />
            )}

            {/* Image Attachment Header */}
            {imageAttachment && (
                <div className="w-full relative z-10">
                    <img src={imageAttachment.url} alt="attachment" className="w-full h-auto object-cover max-h-64" />
                </div>
            )}
            
            <div className={`p-4 flex flex-col gap-2 relative z-10 ${imageAttachment ? 'pt-3' : ''}`}>
                {note.title && (
                    <h3 className={`font-bold text-base leading-snug ${note.isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'} ${!hasCustomBg ? 'dark:text-white' : ''}`}>
                        {note.title}
                    </h3>
                )}
                
                {note.description && (
                    <div 
                        className={`text-sm line-clamp-[10] whitespace-pre-wrap ${hasCustomBg ? 'text-slate-800/90 dark:text-slate-900/90' : 'text-slate-600 dark:text-slate-300'}`}
                        dangerouslySetInnerHTML={{ __html: note.description }}
                    />
                )}

                {note.subtasks && note.subtasks.length > 0 && (
                    <div className="space-y-1 mt-1">
                        {note.subtasks.slice(0, 4).map(st => (
                            <div key={st.id} className="flex items-center gap-2">
                                {st.isCompleted ? <CheckSquare size={14} className="text-slate-500" /> : <div className="w-3.5 h-3.5 border-2 border-slate-400 rounded-sm" />}
                                <span className={`text-xs ${st.isCompleted ? 'line-through text-slate-500' : 'text-slate-700'} ${!hasCustomBg ? 'dark:text-slate-300' : ''} truncate`}>{st.title}</span>
                            </div>
                        ))}
                        {note.subtasks.length > 4 && <div className="text-xs text-slate-500 font-medium pl-6">+{note.subtasks.length - 4} more items</div>}
                    </div>
                )}

                {/* Footer: Tags & Date */}
                {(note.tags.length > 0 || note.isPinned) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {note.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                {tag}
                            </span>
                        ))}
                        {note.isPinned && (
                            <div className="absolute top-3 right-3 p-1.5 bg-black/5 dark:bg-white/10 rounded-full backdrop-blur-sm">
                                <Pin size={10} fill="currentColor" className="text-slate-700 dark:text-slate-200" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TaskView: React.FC<TaskViewProps> = ({ 
    tasks, lists, viewType, searchQuery, onToggleTask, onAddTask, onUpdateTask, onSelectTask, onDeleteTask, onMenuClick, habits, onUpdateHabit, user
}) => {
  const [showInputSheet, setShowInputSheet] = useState(false);
  const [inputInitialMode, setInputInitialMode] = useState<'text' | 'list' | 'voice' | 'image' | 'drawing'>('text');
  
  const [isSimplifiedView, setIsSimplifiedView] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  
  // Selection State
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const isSelectionMode = selectedNoteIds.size > 0;
  
  // Move Task State
  const [taskToMove, setTaskToMove] = useState<string | null>(null);
  // Date Edit State
  const [taskToEditDate, setTaskToEditDate] = useState<Task | undefined>(undefined);

  // Determine if we are in "Notes" mode
  const isNotesView = viewType === ViewType.Notes;

  const handleLongPressNote = (id: string) => {
      const newSet = new Set(selectedNoteIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedNoteIds(newSet);
  };

  const handleNoteClick = (id: string) => {
      if (isSelectionMode) {
          handleLongPressNote(id);
      } else {
          onSelectTask(id);
      }
  };

  const createBlankNote = (mode: 'text' | 'list' | 'voice' | 'image' | 'drawing' = 'text') => {
      const newId = Date.now().toString();
      const newTask: Task = {
          id: newId,
          title: '',
          description: '',
          isCompleted: false,
          priority: Priority.None,
          listId: 'notes', 
          tags: [],
          subtasks: [],
          attachments: [],
          isNote: true,
          color: '#ffffff',
          createdAt: new Date(),
          updatedAt: new Date()
      };
      
      onAddTask(newTask);
      onSelectTask(newId);
  };

  const handleBulkUpdate = (updates: Partial<Task>) => {
      selectedNoteIds.forEach(id => {
          const task = tasks.find(t => t.id === id);
          if (task) onUpdateTask({ ...task, ...updates });
      });
      setSelectedNoteIds(new Set());
  };

  // Filter Logic
  const filteredTasks = tasks.filter(task => {
      if (task.isDeleted) return false;
      
      const matchesSearch = searchQuery 
        ? (task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      if (!matchesSearch) return false;
      
      const today = new Date();
      
      if (isNotesView) {
          return task.isNote === true;
      }

      if (task.isNote && viewType !== ViewType.All && viewType !== ViewType.Trash && viewType !== ViewType.Search && viewType !== ViewType.Tags) {
          return false;
      }
      
      switch (viewType) {
          case ViewType.Inbox: return task.listId === 'inbox' && !task.isCompleted && !task.isEvent;
          case ViewType.Today: return task.dueDate && isSameDay(new Date(task.dueDate), today) && !task.isCompleted;
          case ViewType.Next7Days: return task.dueDate && isBefore(new Date(task.dueDate), addDays(today, 7)) && !task.isCompleted;
          case ViewType.Completed: return task.isCompleted;
          case ViewType.All: return !task.isCompleted;
          case ViewType.Trash: return false; 
          case ViewType.Tags: return true; 
          case ViewType.Search: return true;
          default: return task.listId === viewType && !task.isCompleted;
      }
  }).sort((a, b) => {
      if (isNotesView) {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (new Date(b.updatedAt || b.createdAt || 0).getTime()) - (new Date(a.updatedAt || a.createdAt || 0).getTime());
      }
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
  });

  const getHeaderTitle = () => {
      if (searchQuery) return 'Search';
      switch (viewType) {
          case ViewType.Inbox: return 'Inbox';
          case ViewType.Today: return 'Today';
          case ViewType.Next7Days: return 'Next 7 Days';
          case ViewType.All: return 'All Tasks';
          case ViewType.Completed: return 'Completed';
          case ViewType.Notes: return 'Notes';
          default: return lists.find(l => l.id === viewType)?.name || 'Tasks';
      }
  };

  const pinnedNotes = isNotesView ? filteredTasks.filter(t => t.isPinned) : [];
  const otherNotes = isNotesView ? filteredTasks.filter(t => !t.isPinned) : [];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        {/* Header */}
        {isNotesView ? (
            <div className="pt-safe bg-slate-50 dark:bg-slate-950 shrink-0 sticky top-0 z-20 pointer-events-none">
                <div className={`bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 flex items-center h-12 px-2 pointer-events-auto mt-2 mx-4 transition-all duration-200 ${isSelectionMode ? 'translate-y-[-150%] opacity-0' : 'translate-y-0 opacity-100'}`}>
                    <button onClick={onMenuClick} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="flex-1 px-2 text-slate-500 dark:text-slate-400 font-medium truncate">
                        Search your notes
                    </div>
                    <button 
                        onClick={() => setIsGridView(!isGridView)}
                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        {isGridView ? <LayoutList size={20} /> : <Grid size={20} />}
                    </button>
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold ml-1">
                        C
                    </div>
                </div>
            </div>
        ) : (
            <div className="pt-safe bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 sticky top-0 z-20">
                <div className="h-16 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <Menu size={20} />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white" style={{ color: viewType !== ViewType.Inbox && viewType !== ViewType.Today && !isNotesView ? lists.find(l => l.id === viewType)?.color : undefined }}>
                            {getHeaderTitle()}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setIsSimplifiedView(!isSimplifiedView)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            {isSimplifiedView ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Selection Toolbar Overlay */}
        {isSelectionMode && (
            <SelectionToolbar 
                count={selectedNoteIds.size}
                onClear={() => setSelectedNoteIds(new Set())}
                onArchive={() => handleBulkUpdate({ isArchived: true })}
                onDelete={() => {
                    selectedNoteIds.forEach(id => onDeleteTask?.(id));
                    setSelectedNoteIds(new Set());
                }}
                onPin={() => handleBulkUpdate({ isPinned: true })}
                onColor={() => { /* Future: Open color picker for bulk */ }}
                onLabel={() => { /* Future: Open label picker for bulk */ }}
            />
        )}

        {/* List / Grid Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar pb-28 ${isNotesView ? 'pt-2' : ''}`}>
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4 mt-10">
                    <div className="w-32 h-32 mb-6 opacity-50 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-full">
                        {isNotesView ? <Notebook size={48} className="text-slate-300"/> : <Inbox size={48} className="text-slate-300"/>}
                    </div>
                    <p className="text-slate-500 font-medium text-lg">
                        {isNotesView ? "Notes you add appear here" : "All clear! No tasks here."}
                    </p>
                </div>
            ) : (
                isNotesView ? (
                    <div className="p-4 space-y-6">
                        {/* Pinned Notes Section */}
                        {pinnedNotes.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Pinned</div>
                                <div className={`${isGridView ? 'columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3' : 'flex flex-col space-y-3'}`}>
                                    {pinnedNotes.map(note => (
                                        <NoteItem 
                                            key={note.id} 
                                            note={note} 
                                            onClick={() => handleNoteClick(note.id)} 
                                            onLongPress={() => handleLongPressNote(note.id)}
                                            isSelected={selectedNoteIds.has(note.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Other Notes Section */}
                        {otherNotes.length > 0 && (
                            <div className="space-y-2">
                                {pinnedNotes.length > 0 && <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Others</div>}
                                <div className={`${isGridView ? 'columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3' : 'flex flex-col space-y-3'}`}>
                                    {otherNotes.map(note => (
                                        <NoteItem 
                                            key={note.id} 
                                            note={note} 
                                            onClick={() => handleNoteClick(note.id)} 
                                            onLongPress={() => handleLongPressNote(note.id)}
                                            isSelected={selectedNoteIds.has(note.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Standard List for Tasks
                    <div className="space-y-1 p-4">
                        {filteredTasks.map(task => (
                            <SwipeableTaskItem 
                                key={task.id}
                                task={task}
                                isSimplified={isSimplifiedView}
                                onToggle={() => onToggleTask(task.id)}
                                onSelect={() => onSelectTask(task.id)}
                                onDelete={() => onDeleteTask?.(task.id)}
                                onMove={() => setTaskToMove(task.id)}
                                onDate={() => setTaskToEditDate(task)}
                            />
                        ))}
                    </div>
                )
            )}
        </div>

        {/* Bottom Bar: Keep Style for Notes, FAB for Tasks */}
        {isNotesView ? (
            <div className={`fixed bottom-0 left-0 right-0 h-20 pointer-events-none z-30 flex items-end justify-between px-4 pb-4 transition-transform duration-300 ${isSelectionMode ? 'translate-y-[100%]' : 'translate-y-0'}`}>
                {/* Bottom Bar Background */}
                <div className="absolute inset-x-0 bottom-0 h-14 bg-slate-50/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 pointer-events-auto flex items-center px-4 gap-4 backdrop-blur-md">
                    <button onClick={() => createBlankNote('list')} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-black/5 rounded-full transition-colors"><CheckSquare size={20} /></button>
                    <button onClick={() => createBlankNote('drawing')} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-black/5 rounded-full transition-colors"><Brush size={20} /></button>
                    <button onClick={() => createBlankNote('voice')} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-black/5 rounded-full transition-colors"><Mic size={20} /></button>
                    <button onClick={() => createBlankNote('image')} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-black/5 rounded-full transition-colors"><ImageIcon size={20} /></button>
                </div>
                
                {/* FAB */}
                <div className="pointer-events-auto relative z-40 mb-3 mr-1">
                    <button 
                        onClick={() => createBlankNote('text')}
                        className="w-14 h-14 bg-white dark:bg-slate-800 rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center border border-slate-100 dark:border-slate-700 transition-transform active:scale-95"
                    >
                         {/* Multi-colored Plus approximation using SVG */}
                         <svg width="24" height="24" viewBox="0 0 24 24" className="drop-shadow-sm">
                            <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="#D93025" className="dark:fill-white" /> 
                            <path d="M11 5h2v6h-2z" fill="#EA4335" className="dark:fill-white"/>
                            <path d="M13 11h6v2h-6z" fill="#FBBC04" className="dark:fill-white"/>
                            <path d="M11 13h2v6h-2z" fill="#34A853" className="dark:fill-white"/>
                            <path d="M5 11h6v2H5z" fill="#4285F4" className="dark:fill-white"/>
                         </svg>
                    </button>
                </div>
            </div>
        ) : (
            <div className="fixed bottom-24 right-6 z-50 mb-safe">
                <button 
                    onClick={() => { setInputInitialMode('text'); setShowInputSheet(true); }}
                    className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all active:scale-95 bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700"
                >
                    <Plus size={28} />
                </button>
            </div>
        )}

        {/* Task/Note Input Sheet (Legacy for Tasks, bypassed for Notes) */}
        <TaskInputSheet 
            isOpen={showInputSheet}
            onClose={() => setShowInputSheet(false)}
            onAddTask={onAddTask}
            lists={lists}
            // @ts-ignore
            initialMode={inputInitialMode}
            initialConfig={{ 
                listId: (!isNotesView && viewType !== ViewType.Inbox && viewType !== ViewType.Today && viewType !== ViewType.Next7Days && viewType !== ViewType.Completed) ? viewType : 'inbox',
                isNote: isNotesView 
            }}
        />

        {/* Date Edit Sheet (For Tasks) */}
        <TaskInputSheet 
            isOpen={!!taskToEditDate}
            onClose={() => setTaskToEditDate(undefined)}
            onAddTask={(updatedTask) => { onUpdateTask(updatedTask); setTaskToEditDate(undefined); }} 
            lists={lists}
            // @ts-ignore
            existingTask={taskToEditDate}
            activePicker='date'
        />

        {/* Move Task Dialog */}
        {taskToMove && (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setTaskToMove(null)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-in scale-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-bold text-slate-800 dark:text-white">Move Task To...</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {[{id: 'inbox', name: 'Inbox', color: '#3b82f6'}, ...lists].map(list => (
                            <button 
                                key={list.id}
                                onClick={() => {
                                    const task = tasks.find(t => t.id === taskToMove);
                                    if (task) onUpdateTask({ ...task, listId: list.id });
                                    setTaskToMove(null);
                                }}
                                className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.color }} />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{list.name}</span>
                                {tasks.find(t => t.id === taskToMove)?.listId === list.id && <Check size={16} className="ml-auto text-blue-500" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default TaskView;