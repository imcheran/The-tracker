
import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority, List, AppSettings } from '../types';
import { 
  X, MoreVertical, Pin, Archive, Trash2, ChevronLeft, 
  Circle, CheckCircle2, Plus, Calendar, Flag, Tag as TagIcon, 
  Palette, Bell, Image as ImageIcon, CheckSquare, Folder,
  Clock, Mic, PenTool, ArrowRight, CornerDownRight, Hash,
  GripVertical
} from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import DrawingCanvas from './DrawingCanvas';
import ShareModal from './ShareModal';
import { NoteBackground, NOTE_THEMES } from './NoteBackgrounds';
import TaskInputSheet from './TaskInputSheet';

interface TaskDetailViewProps {
  task: Task;
  lists: List[];
  tasks?: Task[]; 
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onAddTask?: (task: Task) => void;
  onDeleteTask: (taskId: string) => void; 
  onSelectTask?: (taskId: string) => void;
  onStartFocus?: (taskId: string) => void;
  settings?: AppSettings;
}

const KEEP_COLORS = [
  { color: '#ffffff', name: 'Default' },
  { color: '#fecaca', name: 'Red' },
  { color: '#fed7aa', name: 'Orange' },
  { color: '#fef08a', name: 'Yellow' },
  { color: '#bbf7d0', name: 'Green' },
  { color: '#bfdbfe', name: 'Blue' },
  { color: '#e9d5ff', name: 'Purple' },
  { color: '#fbcfe8', name: 'Pink' },
  { color: '#e2e8f0', name: 'Slate' },
];

const TaskDetailView: React.FC<TaskDetailViewProps> = ({ 
    task, lists, tasks = [], onClose, onUpdateTask, onDeleteTask, onAddTask, onSelectTask, onStartFocus
}) => {
  // --- State ---
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [noteColor, setNoteColor] = useState(task.color || '#ffffff');
  const [noteTheme, setNoteTheme] = useState(task.backgroundImage || 'none');
  
  // UI Toggles
  const [showOptions, setShowOptions] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showDrawing, setShowDrawing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  // Ref to track the ID of the newly added subtask to focus it
  const newSubtaskRef = useRef<string | null>(null);
  
  const isDarkMode = document.documentElement.classList.contains('dark');
  const childTasks = tasks.filter(t => t.parentId === task.id && !t.isDeleted);

  // Combine built-in Inbox with custom lists for cycling
  const allLists = [{ id: 'inbox', name: 'Inbox', color: '#3b82f6' }, ...lists];

  // --- Effects ---

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setNoteColor(task.color || (isDarkMode ? '#0f172a' : '#ffffff'));
    setNoteTheme(task.backgroundImage || 'none');
  }, [task.id, isDarkMode]);

  // Focus new subtask when added
  useEffect(() => {
      if (newSubtaskRef.current) {
          const el = document.getElementById(`subtask-input-${newSubtaskRef.current}`);
          if (el) {
              el.focus();
              newSubtaskRef.current = null;
          }
      }
  }, [childTasks.length]);

  // --- Handlers ---

  const handleSave = (updatedFields: Partial<Task> = {}) => {
    onUpdateTask({
      ...task,
      title,
      description,
      color: noteColor,
      backgroundImage: noteTheme,
      updatedAt: new Date(),
      ...updatedFields
    });
  };

  const handleEditorBlur = () => {
    if (editorRef.current) {
        const content = editorRef.current.innerText; 
        setDescription(content);
        handleSave({ description: content });
    }
  };

  const handleAddChecklistItem = () => {
      if (!onAddTask) return;
      
      const newId = Date.now().toString();
      const newChildTask: Task = {
          id: newId,
          parentId: task.id,
          title: '',
          isCompleted: false,
          priority: Priority.None,
          listId: task.listId,
          tags: [],
          subtasks: [],
          attachments: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isNote: true
      };
      
      newSubtaskRef.current = newId;
      onAddTask(newChildTask);
  };

  const handleUpdateChildTitle = (childId: string, newTitle: string) => {
      const child = childTasks.find(t => t.id === childId);
      if (child) {
          onUpdateTask({ ...child, title: newTitle });
      }
  };

  const handleChildKeyDown = (e: React.KeyboardEvent, childId: string) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleAddChecklistItem();
      } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
          e.preventDefault();
          onDeleteTask(childId);
          // Optional: Focus previous item could be implemented here
      }
  };

  const handleSaveDrawing = (dataUrl: string) => {
      const newAttachment = { id: Date.now().toString(), title: "Drawing", type: 'drawing' as const, url: dataUrl };
      onUpdateTask({ ...task, attachments: [...(task.attachments || []), newAttachment] });
      setShowDrawing(false);
  };

  const cyclePriority = () => {
      const next = (task.priority + 1) % 4;
      handleSave({ priority: next });
  };

  const cycleList = () => {
      const currentIndex = allLists.findIndex(l => l.id === task.listId);
      // Default to 0 (Inbox) if not found, otherwise next index
      const nextIndex = (currentIndex === -1 ? 0 : currentIndex + 1) % allLists.length;
      handleSave({ listId: allLists[nextIndex].id });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              const newAttachment = { id: Date.now().toString(), title: file.name, type: 'image' as const, url: base64String };
              onUpdateTask({ ...task, attachments: [...(task.attachments || []), newAttachment] });
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Render Helpers ---

  const editedDateStr = task.updatedAt ? format(new Date(task.updatedAt), 'MMM d, h:mm a') : 'Just now';
  
  const textColorClass = noteColor === '#ffffff' || noteColor === '#fecaca' || noteColor === '#fed7aa' || noteColor === '#fef08a' || noteColor === '#bbf7d0' || noteColor === '#bfdbfe' || noteColor === '#e9d5ff' || noteColor === '#fbcfe8' || noteColor === '#e2e8f0'
    ? 'text-slate-900 placeholder:text-slate-400' 
    : 'text-white placeholder:text-white/50';

  const iconColorClass = noteColor === '#ffffff' 
    ? 'text-slate-500 hover:bg-slate-100' 
    : 'text-slate-800/60 hover:bg-black/10';

  const getPriorityColor = (p: Priority) => {
      switch (p) {
          case Priority.High: return 'text-red-500';
          case Priority.Medium: return 'text-amber-500';
          case Priority.Low: return 'text-blue-500';
          default: return 'text-slate-400';
      }
  };

  // Border visual for priority
  const getPriorityBorder = (p: Priority) => {
      switch (p) {
          case Priority.High: return 'border-red-500';
          case Priority.Medium: return 'border-amber-500';
          case Priority.Low: return 'border-blue-500';
          default: return 'border-transparent';
      }
  };

  const getPriorityLabel = (p: Priority) => {
      switch (p) {
          case Priority.High: return 'High Priority';
          case Priority.Medium: return 'Medium Priority';
          case Priority.Low: return 'Low Priority';
          default: return 'No Priority';
      }
  };

  const formatDueDate = (date?: Date) => {
      if (!date) return 'Set Date';
      if (isToday(new Date(date))) return 'Today';
      if (isTomorrow(new Date(date))) return 'Tomorrow';
      if (isYesterday(new Date(date))) return 'Yesterday';
      return format(new Date(date), 'MMM d');
  };

  // --- Date Picker Handling ---
  // Ensuring the date update is instant and reflects globally (TaskView and CalendarView observe 'tasks')
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateVal = e.target.value ? new Date(e.target.value) : undefined;
      // If setting a date, ensure duration/end date defaults if needed, but simple update is usually enough
      handleSave({ dueDate: dateVal });
  };

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 animate-in slide-in-from-right sm:slide-in-from-bottom sm:duration-300 duration-200 border-t-4 ${getPriorityBorder(task.priority)}`} style={{ backgroundColor: noteColor }}>
      <NoteBackground themeId={noteTheme} isDark={isDarkMode} />
      
      {/* Full Screen Image Preview */}
      {fullScreenImage && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200" onClick={() => setFullScreenImage(null)}>
              <div className="h-16 flex items-center justify-between px-4 bg-transparent absolute top-0 left-0 right-0 z-10 pt-safe">
                  <button className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"><ChevronLeft size={24}/></button>
                  <button className="p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"><X size={24}/></button>
              </div>
              <div className="flex-1 flex items-center justify-center p-4">
                  <img src={fullScreenImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" alt="Preview" />
              </div>
          </div>
      )}

      {/* Top Bar (Glassmorphic Sticky) */}
      <div className="pt-safe shrink-0 sticky top-0 z-20 bg-white/0 backdrop-blur-sm transition-colors">
         <div className="h-16 flex items-center justify-between px-3">
             <div className="flex items-center gap-2">
                 <button onClick={onClose} className={`p-3 rounded-full transition-all active:scale-95 ${iconColorClass}`}>
                     <ChevronLeft size={26} strokeWidth={2.5} />
                 </button>
             </div>
             <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 backdrop-blur-md rounded-full p-1 pr-2">
                 <button onClick={() => handleSave({ isPinned: !task.isPinned })} className={`p-2.5 rounded-full transition-colors ${task.isPinned ? 'text-blue-600 bg-blue-100' : iconColorClass}`}>
                     <Pin size={18} fill={task.isPinned ? 'currentColor' : 'none'} className={task.isPinned ? 'rotate-45' : ''} />
                 </button>
                 <button className={`p-2.5 rounded-full transition-colors ${iconColorClass}`}>
                     <Bell size={18} />
                 </button>
                 <button onClick={() => { handleSave({ isArchived: !task.isArchived }); onClose(); }} className={`p-2.5 rounded-full transition-colors ${iconColorClass}`}>
                     <Archive size={18} />
                 </button>
             </div>
         </div>
      </div>

      {/* Main Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-6 pb-32">
          
          <div className="space-y-6 pt-2">
              {/* Title & Checkbox */}
              <div className="flex items-start gap-4">
                  <button 
                      onClick={() => handleSave({ isCompleted: !task.isCompleted })}
                      className={`mt-1.5 flex-shrink-0 transition-colors ${task.isCompleted ? 'text-blue-500' : 'text-slate-400 hover:text-blue-400'}`}
                  >
                      {task.isCompleted ? <CheckCircle2 size={28} className="fill-current" /> : <Circle size={28} strokeWidth={2} />}
                  </button>
                  <input 
                    ref={titleInputRef}
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    onBlur={() => handleSave()} 
                    placeholder="Title" 
                    className={`flex-1 bg-transparent border-none outline-none text-2xl font-bold leading-tight ${textColorClass} ${task.isCompleted ? 'line-through opacity-50' : ''}`} 
                  />
              </div>

              {/* Meta Chips Row */}
              <div className="flex flex-wrap gap-2 pl-11">
                  {/* Date Chip */}
                  <div className="relative group">
                      <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${task.dueDate ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-transparent border-slate-300/50 text-slate-500 hover:bg-black/5'}`}>
                          <Calendar size={14} />
                          {formatDueDate(task.dueDate)}
                      </button>
                      <input 
                          type="date" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleDateChange}
                      />
                  </div>

                  {/* Priority Chip - Visual feedback enhanced */}
                  <button 
                      onClick={cyclePriority}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-300/50 hover:bg-black/5 ${getPriorityColor(task.priority)} ${task.priority !== Priority.None ? 'bg-white/50 shadow-sm' : 'bg-transparent'}`}
                  >
                      <Flag size={14} fill={task.priority !== Priority.None ? 'currentColor' : 'none'} />
                      {getPriorityLabel(task.priority)}
                  </button>

                  {/* List Chip */}
                  <button 
                      onClick={cycleList}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-300/50 hover:bg-black/5 text-slate-500 bg-transparent"
                  >
                      <Folder size={14} />
                      {allLists.find(l => l.id === task.listId)?.name || 'Inbox'}
                  </button>

                  {/* Tags Chip */}
                  {task.tags?.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-black/5 text-slate-600 border border-transparent">
                          <Hash size={12} /> {tag}
                      </span>
                  ))}
              </div>
              
              {/* Description Editor */}
              <div className="pl-11">
                  <div 
                    ref={editorRef} 
                    contentEditable 
                    onBlur={handleEditorBlur} 
                    dangerouslySetInnerHTML={{ __html: description }} 
                    className={`w-full text-base leading-relaxed bg-transparent border-none outline-none min-h-[60px] empty:before:content-[attr(data-placeholder)] empty:before:opacity-50 ${textColorClass}`}
                    data-placeholder="Add details, notes, or links..."
                  />
              </div>

              {/* Attachments Grid */}
              {task.attachments?.length > 0 && (
                  <div className={`grid gap-3 pl-11 ${task.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {task.attachments.map(att => (
                          <div key={att.id} onClick={() => setFullScreenImage(att.url)} className="relative aspect-video rounded-xl overflow-hidden group cursor-zoom-in shadow-sm border border-black/5">
                              <img src={att.url} alt={att.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              <button onClick={(e) => { e.stopPropagation(); const newAtt = task.attachments.filter(a => a.id !== att.id); onUpdateTask({...task, attachments: newAtt}); }} className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:scale-110"><Trash2 size={16}/></button>
                          </div>
                      ))}
                  </div>
              )}

              {/* Enhanced Checklist / Subtasks Section */}
              <div className="pt-4 pl-0 md:pl-2">
                  <div className="space-y-1">
                      {childTasks.map(child => (
                          <div 
                            key={child.id} 
                            className="flex items-center gap-3 p-3 group relative rounded-xl hover:bg-black/5 transition-colors"
                          >
                              {/* Drag Handle */}
                              <div className="opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing p-1">
                                  <GripVertical size={14} className="text-slate-400"/>
                              </div>

                              <button 
                                  onClick={(e) => { e.stopPropagation(); onUpdateTask({...child, isCompleted: !child.isCompleted}); }}
                                  className={`flex-shrink-0 transition-all duration-300 transform ${child.isCompleted ? 'text-blue-500 scale-110' : 'text-slate-400 hover:text-slate-500 hover:scale-105'}`}
                              >
                                  {child.isCompleted ? <CheckCircle2 size={20} className="fill-current" /> : <Circle size={20} />}
                              </button>
                              
                              <input
                                  id={`subtask-input-${child.id}`}
                                  value={child.title}
                                  onChange={(e) => handleUpdateChildTitle(child.id, e.target.value)}
                                  onKeyDown={(e) => handleChildKeyDown(e, child.id)}
                                  placeholder="List item..."
                                  className={`flex-1 bg-transparent border-none outline-none text-sm font-medium transition-all duration-300 ${child.isCompleted ? 'line-through text-slate-400 opacity-60' : textColorClass}`}
                              />

                              <button onClick={() => onDeleteTask(child.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-opacity">
                                  <X size={16} />
                              </button>
                          </div>
                      ))}
                  </div>
                  {/* Add Item Button */}
                  <button 
                    onClick={handleAddChecklistItem} 
                    className="flex items-center gap-3 px-4 py-3 mt-2 text-slate-500 hover:text-blue-600 transition-colors w-full text-left font-medium text-sm group"
                  >
                      <Plus size={20} className="group-hover:rotate-90 transition-transform duration-200" />
                      Add item
                  </button>
              </div>
          </div>
      </div>

      {/* Bottom Bar (Glassmorphic) */}
      <div className="h-14 border-t border-black/5 dark:border-white/5 flex items-center justify-between px-4 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl relative z-20 pb-safe">
          <div className="flex items-center gap-1">
              <button onClick={handleAddChecklistItem} className={`p-3 rounded-full hover:bg-black/5 transition-colors ${iconColorClass}`}>
                  <CheckSquare size={20} />
              </button>
              <button onClick={() => setShowThemePicker(!showThemePicker)} className={`p-3 rounded-full transition-colors ${showThemePicker ? 'bg-black/10 text-blue-500' : iconColorClass} hover:bg-black/5`}>
                  <Palette size={20} />
              </button>
              <div className="relative">
                  <button className={`p-3 rounded-full hover:bg-black/5 transition-colors ${iconColorClass}`}>
                      <ImageIcon size={20} />
                  </button>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <button onClick={() => setShowDrawing(true)} className={`p-3 rounded-full hover:bg-black/5 transition-colors ${iconColorClass}`}>
                   <PenTool size={20} />
              </button>
              <button className={`p-3 rounded-full hover:bg-black/5 transition-colors ${iconColorClass}`}>
                   <Mic size={20} />
              </button>
          </div>
          
          <div className="text-[10px] font-bold text-slate-400 select-none uppercase tracking-widest hidden sm:block">
              Edited {editedDateStr}
          </div>

          <div className="flex items-center gap-1">
              <button onClick={() => setShowOptions(!showOptions)} className={`p-3 rounded-full hover:bg-black/5 transition-colors ${iconColorClass}`}>
                  <MoreVertical size={20} />
              </button>
          </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
          <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} collaborators={task.collaborators || []} onUpdateCollaborators={(emails) => handleSave({ collaborators: emails })} />
      )}

      {/* Theme & Color Picker (Sliding Panel) */}
      {showThemePicker && (
          <div className="absolute bottom-[60px] left-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white/20 dark:border-slate-800 rounded-3xl p-5 z-30 animate-in slide-in-from-bottom-5 shadow-2xl flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Color</span>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {KEEP_COLORS.map(c => (
                        <button key={c.color} onClick={() => { setNoteColor(c.color); handleSave({ color: c.color }); }} className={`w-10 h-10 rounded-full shrink-0 border-2 transition-transform shadow-sm ${noteColor === c.color ? 'border-blue-500 scale-110' : 'border-slate-200 dark:border-slate-700'}`} style={{ backgroundColor: c.color }} />
                    ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Theme</span>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {NOTE_THEMES.map(t => (
                        <button key={t.id} onClick={() => { setNoteTheme(t.id); handleSave({ backgroundImage: t.id }); }} className={`flex flex-col items-center gap-1.5 shrink-0 group`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl border-2 transition-all overflow-hidden relative ${noteTheme === t.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                                {t.id === 'none' ? <X size={20} className="text-slate-400" /> : (
                                    <>
                                        <NoteBackground themeId={t.id} isDark={isDarkMode} className="scale-[0.5]" />
                                        <span className="relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform">{t.icon}</span>
                                    </>
                                )}
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{t.name}</span>
                        </button>
                    ))}
                </div>
              </div>
          </div>
      )}

      {/* Options Menu (Bottom Sheet Style) */}
      {showOptions && (
          <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[2px] flex flex-col justify-end" onClick={() => setShowOptions(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] p-4 space-y-2 animate-in slide-in-from-bottom duration-300 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4" />
                  
                  {onStartFocus && (
                      <button onClick={() => { onStartFocus(task.id); onClose(); }} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-4 text-slate-700 dark:text-slate-200 font-bold transition-colors">
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><Clock size={20} /></div> Start Focus
                      </button>
                  )}

                  <button onClick={() => { onDeleteTask(task.id); onClose(); }} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-4 text-red-500 font-bold transition-colors">
                      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full"><Trash2 size={20} /></div> Delete Task
                  </button>
                  <button onClick={() => { 
                      const newCopy = { ...task, id: Date.now().toString(), title: task.title + ' (Copy)', createdAt: new Date() };
                      if(onAddTask) onAddTask(newCopy); 
                      onClose(); 
                  }} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-4 text-slate-700 dark:text-slate-200 font-bold transition-colors">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><Archive size={20} /></div> Make a copy
                  </button>
              </div>
          </div>
      )}

      {showDrawing && (
          <DrawingCanvas onSave={handleSaveDrawing} onCancel={() => setShowDrawing(false)} />
      )}
    </div>
  );
};

export default TaskDetailView;
