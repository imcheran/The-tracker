
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
import TaskItem from './TaskItem';

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
    <div className="h-full flex flex-col bg-background-light dark:bg-background-dark relative overflow-hidden py-4 pr-4">
        {/* Header */}
        <div className="shrink-0 mb-6 px-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden p-3 bg-surface-card_light dark:bg-surface-card_dark rounded-xl shadow-soft dark:shadow-soft-dark text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all">
                        <Menu size={20} />
                    </button>
                    <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white drop-shadow-sm" style={{ color: viewType !== ViewType.Inbox && viewType !== ViewType.Today && !isNotesView ? lists.find(l => l.id === viewType)?.color : undefined }}>
                        {getHeaderTitle()}
                    </h1>
                </div>
                
                {!isNotesView && (
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSimplifiedView(!isSimplifiedView)}
                            className="p-3 bg-surface-card_light dark:bg-surface-card_dark rounded-xl shadow-soft dark:shadow-soft-dark text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-pressed dark:active:shadow-soft-dark-pressed"
                        >
                            {isSimplifiedView ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <button className="p-3 bg-surface-card_light dark:bg-surface-card_dark rounded-xl shadow-soft dark:shadow-soft-dark text-slate-500 hover:text-slate-700 transition-all hover:-translate-y-0.5 active:translate-y-0">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* List / Grid Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-28 px-4 rounded-3xl">
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <div className="w-32 h-32 mb-6 flex items-center justify-center bg-surface-card_light dark:bg-surface-card_dark rounded-full shadow-soft-pressed dark:shadow-soft-dark-pressed">
                        {isNotesView ? <Notebook size={48} className="text-slate-300"/> : <Inbox size={48} className="text-slate-300"/>}
                    </div>
                    <p className="text-slate-500 font-bold text-lg">
                        {isNotesView ? "Start capturing ideas" : "You're all caught up!"}
                    </p>
                </div>
            ) : (
                isNotesView ? (
                    // Notes Grid Logic (Simplified for now to focus on Tasks)
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {filteredTasks.map(note => (
                             <div key={note.id} className="break-inside-avoid bg-surface-card_light dark:bg-surface-card_dark p-4 rounded-2xl shadow-soft dark:shadow-soft-dark mb-4 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => onSelectTask(note.id)}>
                                 <h3 className="font-bold text-slate-800 dark:text-white mb-2">{note.title}</h3>
                                 <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-6">{note.description}</p>
                             </div>
                        ))}
                    </div>
                ) : (
                    // Standard Task List with Neumorphic Items
                    <div className="space-y-4">
                        {filteredTasks.map(task => (
                            <TaskItem 
                                key={task.id}
                                task={task}
                                onToggle={(id) => onToggleTask(id)}
                                onSelect={(id) => onSelectTask(id)}
                                selected={false}
                            />
                        ))}
                    </div>
                )
            )}
        </div>

        {/* FAB */}
        <div className="fixed bottom-8 right-8 z-50">
            <button 
                onClick={() => { setInputInitialMode('text'); setShowInputSheet(true); }}
                className="w-16 h-16 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={32} strokeWidth={3} />
            </button>
        </div>

        {/* Task/Note Input Sheet */}
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
    </div>
  );
};

export default TaskView;
