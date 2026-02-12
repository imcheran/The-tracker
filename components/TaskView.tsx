
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Task, Priority, ViewType, List, AppSettings, Habit } from '../types';
import { 
  CheckCircle2, Plus, Inbox, Search, Layers, Archive, Sun, CalendarDays, Trash2, Menu,
  MoreVertical, Check, X, Notebook, Pin, Image as ImageIcon, ChevronDown,
  Palette, Clock, ListTodo, Hash, Lock, PenTool, Mic, Type, MousePointer2, Sparkles, Loader2, Users, LayoutGrid, List as ListIcon,
  Calendar, FolderInput, ArrowRight, Eye, EyeOff, Circle, Grid, LayoutList, CheckSquare, Brush, Target, MapPin
} from 'lucide-react';
import { format, isSameDay, addDays, isBefore, isToday, isTomorrow, isAfter, startOfDay } from 'date-fns';
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

// --- Swipeable Wrapper ---
const SwipeableWrapper: React.FC<{
  children: React.ReactNode;
  onTriggerLeft: () => void; // e.g. Calendar/Schedule
  onTriggerRight: () => void; // e.g. Complete/Archive
  enabled: boolean;
}> = ({ children, onTriggerLeft, onTriggerRight, enabled }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const isDragging = useRef(false);

  if (!enabled) return <>{children}</>;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    // Limit swipe distance for visual resistance
    if (Math.abs(diff) < 150) {
        setOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (offset > 80) { // Swipe Right -> Complete
        onTriggerRight();
    } else if (offset < -80) { // Swipe Left -> Schedule
        onTriggerLeft();
    }
    setOffset(0);
  };

  const opacity = Math.min(Math.abs(offset) / 80, 1);

  return (
    <div className="relative overflow-hidden rounded-[24px]">
      {/* Background Actions */}
      <div className={`absolute inset-0 flex items-center justify-between px-6 text-white transition-colors ${offset > 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
         {/* Right Swipe Content (shown on left side when swiping right) */}
         <div style={{ opacity: offset > 0 ? opacity : 0 }} className="font-bold flex items-center gap-2 transform transition-transform">
             <CheckCircle2 size={24} /> 
             <span className="text-sm uppercase tracking-wider">Complete</span>
         </div>
         
         {/* Left Swipe Content (shown on right side when swiping left) */}
         <div style={{ opacity: offset < 0 ? opacity : 0 }} className="font-bold flex items-center gap-2 transform transition-transform">
             <span className="text-sm uppercase tracking-wider">Schedule</span>
             <Calendar size={24} />
         </div>
      </div>

      <div 
        className="relative transition-transform duration-200 ease-out bg-white dark:bg-slate-950"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

// --- Bento Task Card Component ---
interface BentoTaskCardProps {
    task: Task;
    onToggle: () => void;
    onSelect: () => void;
    onDelete: () => void;
    isSimplified?: boolean;
}

const BentoTaskCard: React.FC<BentoTaskCardProps> = ({ task, onToggle, onSelect, onDelete, isSimplified }) => {
    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isSameDay(new Date(task.dueDate), new Date()) && !task.isCompleted;
    
    // Distinct Styling for Calendar Events vs Tasks
    if (task.isEvent) {
        return (
            <div 
                onClick={onSelect}
                className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-100 dark:border-indigo-800/50 p-5 rounded-[24px] bento-card cursor-pointer overflow-hidden flex flex-col justify-between min-h-[140px] shadow-sm hover:shadow-indigo-500/10 transition-all duration-300"
            >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="bg-white/80 dark:bg-black/40 backdrop-blur-sm p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-500 transition-colors shadow-sm">
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <div className="relative z-0">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 p-1.5 rounded-lg">
                            <Calendar size={16} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Event</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight line-clamp-2">{task.title}</h3>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    {task.dueDate && (
                        <div className="bg-white/60 dark:bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm border border-indigo-100/50 dark:border-white/5">
                            {isToday(new Date(task.dueDate)) ? 'Today' : format(new Date(task.dueDate), 'MMM d')}
                            {!task.isAllDay && ` • ${format(new Date(task.dueDate), 'h:mm a')}`}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Standard Task Card with Premium Gradients
    const priorityStyles = {
        [Priority.High]: 'bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-slate-900 border-red-100 dark:border-red-900/30 shadow-red-500/5',
        [Priority.Medium]: 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 border-amber-100 dark:border-amber-900/30 shadow-amber-500/5',
        [Priority.Low]: 'bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900 border-blue-100 dark:border-blue-900/30 shadow-blue-500/5',
        [Priority.None]: 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/50 dark:to-slate-900 border-slate-100 dark:border-slate-800'
    };

    return (
        <div 
            onClick={onSelect}
            className={`group relative p-5 rounded-[24px] border transition-all duration-300 bento-card cursor-pointer flex flex-col justify-between min-h-[120px] shadow-sm hover:shadow-lg hover:-translate-y-1 ${priorityStyles[task.priority]} ${task.isCompleted ? 'opacity-60 grayscale' : ''}`}
        >
            <div className="flex items-start justify-between gap-3">
                <h3 className={`text-base font-semibold leading-snug ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {task.title}
                </h3>
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${task.isCompleted ? 'bg-slate-400 border-slate-400 text-white' : 'border-slate-300 hover:border-blue-500 bg-white dark:bg-transparent'}`}
                >
                    {task.isCompleted && <Check size={14} strokeWidth={3} />}
                </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                {task.dueDate && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' : 'bg-white/80 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                        <Calendar size={12} />
                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                    </div>
                )}
                
                {task.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold bg-white/80 dark:bg-white/10 px-2.5 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-transparent">#{tag}</span>
                ))}
            </div>
        </div>
    );
};

// --- Note Item Component (Bento Style) ---
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
                break-inside-avoid mb-3 rounded-[24px] overflow-hidden cursor-pointer flex flex-col group relative transition-all duration-300
                ${isSelected ? 'ring-4 ring-blue-500 shadow-xl scale-95 z-10' : 'hover:-translate-y-1 hover:shadow-lg'}
                ${!hasCustomBg ? 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800' : 'border border-black/5'}
            `}
            style={{ 
                backgroundColor: note.color !== '#ffffff' ? note.color : undefined 
            }}
        >
            {/* Selection Checkmark */}
            {isSelected && (
                <div className="absolute top-3 right-3 z-30 bg-blue-500 text-white rounded-full p-1 shadow-md animate-scale-in">
                    <Check size={14} strokeWidth={3} />
                </div>
            )}

            {/* Background Theme Pattern if present */}
            {note.backgroundImage && note.backgroundImage !== 'none' && (
                <NoteBackground themeId={note.backgroundImage} isDark={isDark} className="opacity-50" />
            )}

            {/* Image Attachment Header */}
            {imageAttachment && (
                <div className="w-full relative z-10 h-32 overflow-hidden">
                    <img src={imageAttachment.url} alt="attachment" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}
            
            <div className={`p-5 flex flex-col gap-2 relative z-10 ${imageAttachment ? 'pt-3' : ''}`}>
                {note.title && (
                    <h3 className={`font-bold text-lg leading-snug ${note.isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'} ${!hasCustomBg ? 'dark:text-white' : ''}`}>
                        {note.title}
                    </h3>
                )}
                
                {note.description && (
                    <div 
                        className={`text-sm line-clamp-6 whitespace-pre-wrap ${hasCustomBg ? 'text-slate-800/80 dark:text-slate-900/80' : 'text-slate-600 dark:text-slate-400'}`}
                        dangerouslySetInnerHTML={{ __html: note.description }}
                    />
                )}

                {/* Footer: Tags & Date */}
                {(note.tags.length > 0 || note.isPinned) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {note.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-black/5 dark:bg-white/10 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                #{tag}
                            </span>
                        ))}
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

      // Smart views (All, Today, Next7Days, Search) should show Events (like Google Calendar events).
      const showEvents = 
        viewType === ViewType.All || 
        viewType === ViewType.Today || 
        viewType === ViewType.Next7Days || 
        viewType === ViewType.Search;

      if (task.isEvent && !showEvents) {
          return false;
      }
      
      const matchesSearch = searchQuery 
        ? (task.title.toLowerCase().includes(searchQuery.toLowerCase()) || task.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      if (!matchesSearch) return false;
      
      const today = startOfDay(new Date());
      
      if (isNotesView) {
          return task.isNote === true;
      }

      if (task.isNote && viewType !== ViewType.All && viewType !== ViewType.Trash && viewType !== ViewType.Search && viewType !== ViewType.Tags) {
          return false;
      }
      
      switch (viewType) {
          case ViewType.Inbox: return task.listId === 'inbox' && !task.isCompleted && !task.isEvent;
          case ViewType.Today: 
            return task.dueDate && isSameDay(new Date(task.dueDate), today) && !task.isCompleted;
          case ViewType.Next7Days: {
              return task.dueDate && 
                     isBefore(new Date(task.dueDate), addDays(today, 7)) && 
                     !isBefore(new Date(task.dueDate), today) && 
                     !task.isCompleted;
          }
          case ViewType.Completed: return task.isCompleted;
          case ViewType.All: {
             if (task.isEvent && task.dueDate && isBefore(new Date(task.dueDate), startOfDay(new Date()))) {
                 return false;
             }
             return !task.isCompleted;
          }
          case ViewType.Trash: return false; 
          case ViewType.Tags: return true; 
          case ViewType.Search: return true;
          default: return task.listId === viewType && !task.isCompleted;
      }
  }).sort((a, b) => {
      if (viewType === ViewType.Completed) {
          // Sort by recently updated/completed (descending)
          return (new Date(b.updatedAt || 0).getTime()) - (new Date(a.updatedAt || 0).getTime());
      }
      if (isNotesView) {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return (new Date(b.updatedAt || b.createdAt || 0).getTime()) - (new Date(a.updatedAt || a.createdAt || 0).getTime());
      }
      if ((viewType === ViewType.Today || viewType === ViewType.Next7Days || viewType === ViewType.All) && a.dueDate && b.dueDate) {
         return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.priority !== b.priority) return b.priority - a.priority;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
  });

  const getHeaderTitle = () => {
      if (searchQuery) return 'Search Results';
      switch (viewType) {
          case ViewType.Inbox: return 'My Inbox';
          case ViewType.Today: return 'Today\'s Plan';
          case ViewType.Next7Days: return 'Upcoming Week';
          case ViewType.All: return 'All Tasks'; 
          case ViewType.Completed: return 'Archive';
          case ViewType.Notes: return 'My Notes';
          default: return lists.find(l => l.id === viewType)?.name || 'Tasks';
      }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">
        {/* Header - Bento Style with Safe Area */}
        <div className="pt-[calc(env(safe-area-inset-top)+1rem)] shrink-0 sticky top-0 z-20 pointer-events-none px-4 md:px-6">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm rounded-[24px] flex items-center justify-between p-4 pointer-events-auto">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors md:hidden">
                        <Menu size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white leading-none tracking-tight">
                            {getHeaderTitle()}
                        </h1>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            {filteredTasks.length} {filteredTasks.length === 1 ? 'Item' : 'Items'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {isNotesView ? (
                        <button 
                            onClick={() => setIsGridView(!isGridView)}
                            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            {isGridView ? <LayoutList size={20} /> : <Grid size={20} />}
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsSimplifiedView(!isSimplifiedView)}
                            className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            {isSimplifiedView ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </div>

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
                onColor={() => { /* Future */ }}
                onLabel={() => { /* Future */ }}
            />
        )}

        {/* List / Grid Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar pb-32 px-4 md:px-6 pt-4`}>
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="w-40 h-40 mb-6 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                        {isNotesView ? <Notebook size={64} className="text-slate-300 dark:text-slate-600"/> : <Inbox size={64} className="text-slate-300 dark:text-slate-600"/>}
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">All caught up!</h3>
                    <p className="text-slate-500 font-medium mt-2">Time to relax or start something new.</p>
                </div>
            ) : (
                isNotesView ? (
                    <div className={`${isGridView ? 'columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4' : 'flex flex-col space-y-4'} pb-10`}>
                        {filteredTasks.map(note => (
                            <NoteItem 
                                key={note.id} 
                                note={note} 
                                onClick={() => handleNoteClick(note.id)} 
                                onLongPress={() => handleLongPressNote(note.id)}
                                isSelected={selectedNoteIds.has(note.id)}
                            />
                        ))}
                    </div>
                ) : (
                    // Responsive Grid for Tasks (Bento Style)
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                        {filteredTasks.map(task => (
                            <SwipeableWrapper
                                key={task.id}
                                enabled={!task.isEvent} // Disable for calendar events
                                onTriggerRight={() => onToggleTask(task.id)}
                                onTriggerLeft={() => setTaskToEditDate(task)}
                            >
                                <BentoTaskCard 
                                    task={task}
                                    isSimplified={isSimplifiedView}
                                    onToggle={() => onToggleTask(task.id)}
                                    onSelect={() => onSelectTask(task.id)}
                                    onDelete={() => onDeleteTask?.(task.id)}
                                />
                            </SwipeableWrapper>
                        ))}
                    </div>
                )
            )}
        </div>

        {/* Floating Action Button (FAB) Area */}
        {isNotesView ? (
            <div className={`fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:bottom-8 right-6 z-30 transition-transform duration-300 ${isSelectionMode ? 'translate-y-[200%]' : 'translate-y-0'}`}>
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 p-2 rounded-[24px] shadow-2xl flex items-center gap-1 pointer-events-auto">
                    <div className="flex gap-1 pr-2">
                        <button onClick={() => createBlankNote('list')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"><CheckSquare size={20} /></button>
                        <button onClick={() => createBlankNote('image')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors"><ImageIcon size={20} /></button>
                    </div>
                    <button 
                        onClick={() => createBlankNote('text')}
                        className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    >
                         <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>
        ) : (
            <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1.5rem)] right-6 md:bottom-8 md:right-8 z-50">
                <button 
                    onClick={() => { setInputInitialMode('text'); setShowInputSheet(true); }}
                    className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-[24px] shadow-2xl shadow-blue-600/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
                >
                    <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>
        )}

        {/* Input Sheets */}
        <TaskInputSheet 
            isOpen={showInputSheet}
            onClose={() => setShowInputSheet(false)}
            onAddTask={onAddTask}
            lists={lists}
            // @ts-ignore
            initialMode={inputInitialMode}
            initialConfig={{ 
                listId: (!isNotesView && viewType !== ViewType.Inbox && viewType !== ViewType.Today && viewType !== ViewType.Next7Days && viewType !== ViewType.Completed && viewType !== ViewType.All) ? viewType : 'inbox',
                isNote: isNotesView 
            }}
        />

        <TaskInputSheet 
            isOpen={!!taskToEditDate}
            onClose={() => setTaskToEditDate(undefined)}
            onAddTask={(updatedTask) => { onUpdateTask(updatedTask); setTaskToEditDate(undefined); }} 
            lists={lists}
            // @ts-ignore
            existingTask={taskToEditDate}
            activePicker='date'
        />
    </div>
  );
};

export default TaskView;
