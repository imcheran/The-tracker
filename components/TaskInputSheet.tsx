
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, Flag, FolderInput, ArrowUp, X, Hash, Check, Sun, Moon, 
  CalendarDays, Bell, Repeat, Zap, ChevronLeft, ChevronRight, Clock,
  Timer, Mic, Image as ImageIcon, Palette, Loader2, StopCircle, Trash2,
  FileAudio
} from 'lucide-react';
import { Task, Priority, List } from '../types';
import { 
  format, addDays, isSameDay, 
  eachDayOfInterval, addMonths, 
  isToday, addMinutes, isSameMonth, differenceInMinutes, getDay, startOfToday
} from 'date-fns';
import { transcribeAudio, extractImageText } from '../services/aiService';
import { parseSmartInput } from '../services/nlpService';
import { WheelPicker } from './WheelPicker';
import DrawingCanvas from './DrawingCanvas';

// --- Local Date Helpers ---
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const subMonths = (date: Date, n: number) => addMonths(date, -n);
const nextMonday = (date: Date) => addDays(date, (8 - getDay(date)) % 7 || 7);
const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
    const day = getDay(date);
    const startDay = options?.weekStartsOn || 0;
    const diff = (day < startDay ? 7 : 0) + day - startDay;
    return addDays(date, -diff);
};
const endOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
    const start = startOfWeek(date, options);
    return addDays(start, 6);
};
const setHours = (date: Date, hours: number) => {
    const d = new Date(date);
    d.setHours(hours);
    return d;
};
const setMinutes = (date: Date, minutes: number) => {
    const d = new Date(date);
    d.setMinutes(minutes);
    return d;
};

interface TaskInputSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Task) => void;
  lists: List[];
  initialConfig?: Partial<Task>;
  activePicker?: 'none' | 'date' | 'priority' | 'list' | 'color';
  existingTask?: Task; // If provided, we are editing
  initialMode?: 'text' | 'list' | 'voice' | 'image' | 'drawing';
}

type PickerView = 'none' | 'date' | 'priority' | 'list' | 'color'; 

const NOTE_COLORS = ['#ffffff', '#f28b82', '#fbbc04', '#fff475', '#ccff90', '#a7ffeb', '#cbf0f8', '#aecbfa', '#d7aefb', '#fdcfe8', '#e6c9a8', '#e8eaed'];

const TaskInputSheet: React.FC<TaskInputSheetProps> = ({ isOpen, onClose, onAddTask, lists, initialConfig, activePicker: initialPicker = 'none', existingTask, initialMode = 'text' }) => {
  // --- State ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activePicker, setActivePicker] = useState<PickerView>(initialPicker);
  
  const [priority, setPriority] = useState<Priority>(Priority.None);
  const [listId, setListId] = useState<string>('inbox');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isNote, setIsNote] = useState(false);
  const [noteColor, setNoteColor] = useState('#ffffff');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  
  // Attachments & Drawing
  const [attachments, setAttachments] = useState<Task['attachments']>([]);
  const [showDrawing, setShowDrawing] = useState(false);
  
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  
  // Time & Duration State
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const [reminder, setReminder] = useState<string>('None'); 
  const [repeat, setRepeat] = useState<string>('None');
  const [isAllDay, setIsAllDay] = useState(false);

  const [dateTab, setDateTab] = useState<'date' | 'time'>('date');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  // --- Effects ---

  // Handle Initial Mode & Reset
  useEffect(() => {
    if (isOpen) {
      if (initialPicker !== 'none') {
          setActivePicker(initialPicker);
      }
      
      const config = existingTask || initialConfig;

      if (config) {
          if (config.title) setTitle(config.title);
          if (config.description) setDescription(config.description);
          if (config.listId) setListId(config.listId);
          if (config.priority !== undefined) setPriority(config.priority);
          if (config.isNote !== undefined) setIsNote(config.isNote);
          if (config.color) setNoteColor(config.color);
          if (config.tags) setSelectedTags(config.tags);
          if (config.attachments) setAttachments(config.attachments);
          if (config.parentId) setParentId(config.parentId);
          
          if (config.dueDate) {
              setDueDate(new Date(config.dueDate));
              setCalendarMonth(new Date(config.dueDate));
              if (!config.isAllDay) {
                  const d = new Date(config.dueDate);
                  setStartHour(format(d, 'HH'));
                  setStartMinute(format(d, 'mm'));
                  const end = config.endDate ? new Date(config.endDate) : addMinutes(d, config.duration || 60);
                  setEndHour(format(end, 'HH'));
                  setEndMinute(format(end, 'mm'));
              }
          }
          if (config.isAllDay !== undefined) setIsAllDay(config.isAllDay);
      } else {
          resetState();
      }

      // Auto-trigger actions based on initialMode
      if (initialMode === 'voice') {
          setTimeout(() => startRecording(), 300);
      } else if (initialMode === 'image') {
          setTimeout(() => fileInputRef.current?.click(), 300);
      } else if (initialMode === 'drawing') {
          setTimeout(() => setShowDrawing(true), 300);
      } else if (initialMode === 'text') {
          setTimeout(() => titleInputRef.current?.focus(), 150);
      }
    } else {
        // Cleanup recording if closed abruptly
        if (isRecording) stopRecording();
    }
  }, [isOpen, initialConfig, existingTask, initialPicker, initialMode]);

  // Adjust End Time when Start Time changes
  useEffect(() => {
      const start = parseInt(startHour) * 60 + parseInt(startMinute);
      const end = parseInt(endHour) * 60 + parseInt(endMinute);
      
      if (end <= start) {
          const newEndTotal = (start + 60) % 1440;
          const newEndH = Math.floor(newEndTotal / 60);
          const newEndM = newEndTotal % 60;
          setEndHour(newEndH.toString().padStart(2, '0'));
          setEndMinute(newEndM.toString().padStart(2, '0'));
      }
  }, [startHour, startMinute]);

  // Auto-resize textarea
  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
  }, [description]);

  const resetState = () => {
      setTitle('');
      setDescription('');
      setPriority(Priority.None);
      setListId('inbox');
      setDueDate(undefined);
      setIsNote(false);
      setNoteColor('#ffffff');
      setAttachments([]);
      setParentId(undefined);
      
      const now = new Date();
      now.setMinutes(0);
      now.setHours(now.getHours() + 1);
      setStartHour(now.getHours().toString().padStart(2, '0'));
      setStartMinute('00');
      
      const next = addMinutes(now, 60);
      setEndHour(next.getHours().toString().padStart(2, '0'));
      setEndMinute('00');
      
      setReminder('None');
      setRepeat('None');
      setIsAllDay(false);
      setSelectedTags([]);
      setActivePicker('none');
      setDateTab('date');
      setCalendarMonth(new Date());
      setShowDrawing(false);
      setIsProcessingVoice(false);
  };

  // --- Handlers ---

  const durationText = useMemo(() => {
      const start = parseInt(startHour) * 60 + parseInt(startMinute);
      let end = parseInt(endHour) * 60 + parseInt(endMinute);
      if (end < start) end += 24 * 60; 
      
      const diff = end - start;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      
      if (h > 0 && m > 0) return `${h}h ${m}m`;
      if (h > 0) return `${h}h`;
      return `${m}m`;
  }, [startHour, startMinute, endHour, endMinute]);

  const handleAddTaskFn = () => {
      if (!title.trim() && attachments.length === 0) return;

      // Smart Parsing Logic
      let parsedTitle = title;
      let parsedPriority = priority;
      let parsedDueDate = dueDate;
      let parsedTags = [...selectedTags];
      let parsedIsAllDay = isAllDay;

      if (!isNote && !existingTask && !dueDate) {
          const smartData = parseSmartInput(title);
          parsedTitle = smartData.cleanTitle;
          if (smartData.dueDate) {
              parsedDueDate = smartData.dueDate;
              parsedIsAllDay = smartData.isAllDay;
          }
          if (priority === Priority.None && smartData.priority !== Priority.None) {
              parsedPriority = smartData.priority;
          }
          if (smartData.tags.length > 0) {
              parsedTags = [...new Set([...parsedTags, ...smartData.tags])];
          }
      }

      let finalDate = parsedDueDate;
      let finalEndDate: Date | undefined = undefined;

      if (finalDate && !parsedIsAllDay) {
          const startH = parseInt(startHour);
          const startM = parseInt(startMinute);
          finalDate = setHours(setMinutes(finalDate, startM), startH);

          const endH = parseInt(endHour);
          const endM = parseInt(endMinute);
          finalEndDate = setHours(setMinutes(finalDate, endM), endH);
          
          if (endH < startH || (endH === startH && endM < startM)) {
               finalEndDate = addDays(finalEndDate, 1);
          }
      }

      let duration = 60;
      if (finalDate && finalEndDate) {
          duration = differenceInMinutes(finalEndDate, finalDate);
      }

      const taskToSave: Task = {
          id: existingTask ? existingTask.id : Date.now().toString(),
          parentId: parentId, 
          title: parsedTitle || "Untitled",
          description: description.trim(),
          isCompleted: existingTask ? existingTask.isCompleted : false,
          priority: parsedPriority,
          listId,
          tags: parsedTags,
          dueDate: finalDate,
          endDate: finalEndDate,
          duration: duration,
          isAllDay: parsedIsAllDay,
          subtasks: existingTask ? existingTask.subtasks : [],
          attachments: attachments,
          isNote: isNote,
          color: noteColor,
          reminder: reminder !== 'None' ? new Date() : undefined, 
          repeat: repeat !== 'None' ? repeat : undefined,
          isPinned: existingTask ? existingTask.isPinned : false,
          updatedAt: new Date(),
          createdAt: existingTask ? existingTask.createdAt : new Date(),
      };

      onAddTask(taskToSave);
      onClose(); 
      setTimeout(() => resetState(), 300);
  };

  const togglePicker = (view: PickerView) => {
      if (activePicker === view) {
          setActivePicker('none');
      } else {
          setActivePicker(view);
          if (view === 'date') {
              if (!dueDate) {
                  const now = new Date();
                  setDueDate(now);
                  setCalendarMonth(now);
              } else {
                  setCalendarMonth(dueDate);
              }
          }
      }
  };

  const insertHash = () => {
    setTitle(prev => prev + (prev.length > 0 && !prev.endsWith(' ') ? ' #' : '#'));
    titleInputRef.current?.focus();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64String = reader.result as string;
              const newAttachment = { id: Date.now().toString(), title: file.name, type: 'image' as const, url: base64String };
              setAttachments(prev => [...prev, newAttachment]);
              
              // Trigger OCR if it's a note
              if (isNote) {
                  const base64Data = base64String.split(',')[1];
                  const text = await extractImageText(base64Data, file.type);
                  if (text) {
                      setDescription(prev => (prev ? prev + "\n" : "") + text);
                  }
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveDrawing = (dataUrl: string) => {
      const newAttachment = { id: Date.now().toString(), title: "Drawing", type: 'drawing' as const, url: dataUrl };
      setAttachments(prev => [...prev, newAttachment]);
      setShowDrawing(false);
  };

  // --- Voice Recording ---
  const startRecording = async () => {
      if (!navigator.mediaDevices) {
          alert("Microphone not accessible");
          return;
      }
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          chunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = async () => {
              const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
              setIsProcessingVoice(true);
              
              try {
                  const base64Audio = await blobToBase64(blob);
                  const transcription = await transcribeAudio(base64Audio, 'audio/webm');
                  
                  if (transcription) {
                      setDescription(prev => (prev ? prev + "\n" : "") + transcription);
                  }
                  
                  // Also save the audio as attachment
                  const url = URL.createObjectURL(blob);
                  setAttachments(prev => [...prev, { id: Date.now().toString(), title: "Voice Note", type: 'voice', url }]);
              } catch (err) {
                  console.error("Transcription failed", err);
              } finally {
                  setIsProcessingVoice(false);
              }
          };

          mediaRecorder.start();
          setIsRecording(true);
      } catch (err) {
          console.error("Error accessing mic", err);
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // remove data:audio/webm;base64,
      };
      reader.readAsDataURL(blob);
    });
  };

  const removeAttachment = (id: string) => {
      setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // --- Render Helpers ---

  const allLists = [{ id: 'inbox', name: 'Inbox', color: '#3b82f6' }, ...lists];
  const currentList = allLists.find(l => l.id === listId) || allLists[0];

  const renderTimePicker = () => (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
          <div className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 py-3 flex items-center justify-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration:</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{durationText}</span>
          </div>

          <div className="flex-1 flex divide-x divide-slate-200 dark:divide-slate-800">
              <div className="flex-1 flex flex-col">
                  <div className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-bold uppercase py-2 text-center">Start Time</div>
                  <div className="flex-1 relative bg-white dark:bg-slate-950">
                       <div className="absolute inset-0 flex items-center justify-center gap-1">
                           <WheelPicker items={hours} selected={startHour} onSelect={setStartHour} />
                           <span className="text-xl font-bold text-slate-300">:</span>
                           <WheelPicker items={minutes} selected={startMinute} onSelect={setStartMinute} />
                       </div>
                  </div>
              </div>

              <div className="flex-1 flex flex-col">
                  <div className="bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs font-bold uppercase py-2 text-center">End Time</div>
                   <div className="flex-1 relative bg-white dark:bg-slate-950">
                       <div className="absolute inset-0 flex items-center justify-center gap-1">
                           <WheelPicker items={hours} selected={endHour} onSelect={setEndHour} />
                           <span className="text-xl font-bold text-slate-300">:</span>
                           <WheelPicker items={minutes} selected={endMinute} onSelect={setEndMinute} />
                       </div>
                  </div>
              </div>
          </div>
          
          <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-center">
               <button 
                  onClick={() => setIsAllDay(!isAllDay)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${isAllDay ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
               >
                   {isAllDay ? "All Day Task" : "Specific Time"}
               </button>
          </div>
      </div>
  );

  const renderDatePicker = () => {
    const today = startOfToday();
    const calendarDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(calendarMonth)),
        end: endOfWeek(endOfMonth(calendarMonth))
    });

    const setQuickDate = (d: Date) => {
        setDueDate(d);
        setCalendarMonth(d);
    };

    return (
        <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden h-[400px]">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 border-b border-slate-50 dark:border-slate-800">
                 <button onClick={() => togglePicker('none')} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24}/></button>
                 <div className="flex gap-6 font-bold text-sm">
                     <button onClick={() => setDateTab('date')} className={`pb-2 border-b-2 transition-colors ${dateTab === 'date' ? 'border-orange-500 text-slate-800 dark:text-white' : 'border-transparent text-slate-400'}`}>Date</button>
                     <button onClick={() => setDateTab('time')} className={`pb-2 border-b-2 transition-colors ${dateTab === 'time' ? 'border-orange-500 text-slate-800 dark:text-white' : 'border-transparent text-slate-400'}`}>Time</button>
                 </div>
                 <button onClick={() => togglePicker('none')} className="p-2 -mr-2 text-blue-500 hover:text-blue-600"><Check size={24}/></button>
            </div>

            {dateTab === 'date' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                    <div className="grid grid-cols-4 gap-4 mb-8 mt-4">
                        <button onClick={() => setQuickDate(today)} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex flex-col items-center justify-center text-orange-500 border border-orange-100 dark:border-orange-900 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                <span className="text-[9px] font-bold uppercase mt-0.5">{format(today, 'MMM')}</span>
                                <span className="text-sm font-bold -mt-0.5">{format(today, 'd')}</span>
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Today</span>
                        </button>
                        <button onClick={() => setQuickDate(addDays(today, 1))} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-orange-500 border border-slate-100 dark:border-slate-700 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                                <Sun size={20} />
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tomorrow</span>
                        </button>
                        <button onClick={() => setQuickDate(nextMonday(today))} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-orange-500 border border-slate-100 dark:border-slate-700 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                                <CalendarDays size={20} />
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Next Mon</span>
                        </button>
                        <button onClick={() => {
                                const tonight = new Date();
                                tonight.setHours(20, 0, 0, 0);
                                setDueDate(tonight);
                                setStartHour('20');
                                setStartMinute('00');
                                setEndHour('21');
                                setEndMinute('00');
                            }} className="flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-orange-500 border border-slate-100 dark:border-slate-700 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                                <Moon size={20} />
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tonight</span>
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-lg font-bold text-slate-800 dark:text-white">{format(calendarMonth, 'MMMM yyyy')}</span>
                            <div className="flex gap-1">
                                <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={20}/></button>
                                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={20}/></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1">
                            {calendarDays.map((day, idx) => {
                                const isCurrentMonth = isSameMonth(day, calendarMonth);
                                const isSelected = dueDate && isSameDay(day, dueDate);
                                const isTodayDate = isToday(day);
                                return (
                                    <div key={idx} className="flex justify-center">
                                        <button
                                            onClick={() => setDueDate(day)}
                                            className={`
                                                w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                                ${isSelected ? 'bg-blue-600 text-white shadow-md' : (isCurrentMonth ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800' : 'text-slate-300 dark:text-slate-600')}
                                                ${isTodayDate && !isSelected ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20' : ''}
                                            `}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {dateTab === 'time' && renderTimePicker()}
        </div>
    );
  };

  const renderPriorityPicker = () => (
      <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom">
          <div className="flex gap-2">
            {[Priority.None, Priority.Low, Priority.Medium, Priority.High].map(p => (
                <button
                    key={p}
                    onClick={() => { setPriority(p); setActivePicker('none'); }}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${priority === p ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    <Flag size={20} className={
                        p === Priority.High ? 'text-red-500' : 
                        p === Priority.Medium ? 'text-yellow-500' : 
                        p === Priority.Low ? 'text-blue-500' : 'text-slate-400'
                    } fill={p !== Priority.None ? "currentColor" : "none"} />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{Priority[p]}</span>
                </button>
            ))}
          </div>
      </div>
  );

  const renderListPicker = () => (
      <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom">
        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
            {allLists.map(l => (
                <button
                    key={l.id}
                    onClick={() => { setListId(l.id); setActivePicker('none'); }}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${listId === l.id ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-sm' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{l.name}</span>
                </button>
            ))}
        </div>
      </div>
  );

  const renderColorPicker = () => (
      <div className="bg-slate-50 dark:bg-slate-900 p-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom">
          <div className="grid grid-cols-6 gap-3">
              {NOTE_COLORS.map(color => (
                  <button
                      key={color}
                      onClick={() => { setNoteColor(color); setActivePicker('none'); }}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${noteColor === color ? 'border-slate-600 scale-110' : 'border-slate-200 dark:border-slate-700'}`}
                      style={{ backgroundColor: color }}
                  />
              ))}
          </div>
      </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 rounded-t-2xl shadow-2xl animate-android-bottom-sheet flex flex-col max-h-[85vh] overflow-hidden pb-safe"
      >
        
        {/* Input Area */}
        <div className="p-4 flex flex-col gap-3">
          {parentId && (
              <div className="text-xs font-bold text-blue-500 flex items-center gap-1">
                  <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">Subtask Mode</span>
              </div>
          )}
          <div className="flex gap-3">
             <button className="mt-1 flex-shrink-0 text-slate-300 dark:text-slate-600">
                 <Flag size={20} className={priority !== Priority.None ? 'text-blue-500' : ''} fill={priority !== Priority.None ? "currentColor" : "none"} />
             </button>
             <div className="flex-1">
                 <input 
                     ref={titleInputRef}
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder={isNote ? "Title" : (parentId ? "Subtask title" : "What would you like to do?")}
                     className="w-full text-lg font-medium outline-none placeholder:text-slate-400 bg-transparent text-slate-900 dark:text-white"
                     onKeyDown={(e) => {
                         if (e.key === 'Enter') handleAddTaskFn();
                     }}
                 />
                 <textarea 
                     ref={textareaRef}
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     placeholder={isNote ? "Take a note..." : "Description"}
                     className="w-full text-sm text-slate-500 dark:text-slate-400 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent resize-none h-6 mt-1 min-h-[40px] max-h-[200px]"
                 />
                 
                 {/* Attachment Preview */}
                 {attachments.length > 0 && (
                     <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                         {attachments.map(att => (
                             <div key={att.id} className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden relative group">
                                 {att.type === 'image' && <img src={att.url} alt="prev" className="w-full h-full object-cover" />}
                                 {att.type === 'drawing' && <img src={att.url} alt="drawing" className="w-full h-full object-contain p-1 bg-white" />}
                                 {att.type === 'voice' && <div className="w-full h-full flex items-center justify-center text-blue-500"><FileAudio size={20}/></div>}
                                 {att.text && <div className="absolute bottom-0 right-0 bg-green-500 text-white text-[8px] px-1">OCR</div>}
                                 
                                 <button 
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                     <X size={12} />
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
                 {isProcessingVoice && <div className="text-xs text-blue-500 flex items-center gap-1 mt-1"><Loader2 size={12} className="animate-spin"/> Transcribing...</div>}
             </div>
          </div>
          
          {selectedTags.length > 0 && (
             <div className="flex gap-2 pl-8 flex-wrap">
                 {selectedTags.map(tag => (
                     <span key={tag} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 px-2 py-1 rounded-md font-medium flex items-center gap-1">
                         #{tag}
                         <button onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}><X size={12}/></button>
                     </span>
                 ))}
             </div>
          )}

          {/* Quick Toolbar */}
          <div className="flex items-center justify-between mt-2 pl-1">
              <div className="flex items-center gap-1">
                  {/* Note Toggle */}
                  {isNote && (
                      <>
                        <button 
                            onClick={() => togglePicker('color')}
                            className="p-2 rounded-lg text-slate-500 hover:bg-black/5 dark:hover:bg-slate-800"
                        >
                            <Palette size={20} />
                        </button>
                        <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-2 rounded-lg transition-colors ${isRecording ? 'text-red-500 animate-pulse bg-red-50 dark:bg-red-900/30' : 'text-slate-500 hover:bg-black/5 dark:hover:bg-slate-800'}`}
                        >
                            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-lg text-slate-500 hover:bg-black/5 dark:hover:bg-slate-800"
                        >
                            <ImageIcon size={20} />
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleFileUpload}
                            />
                        </button>
                      </>
                  )}

                  {!isNote && (
                      <button 
                         onClick={() => togglePicker('date')} 
                         className={`p-2 rounded-lg transition-colors ${activePicker === 'date' || dueDate ? 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                          <Calendar size={20} />
                          {dueDate && <span className="text-xs font-bold ml-1">{format(dueDate, 'MMM d')}</span>}
                      </button>
                  )}
                  
                  <button 
                     onClick={() => togglePicker('priority')} 
                     className={`p-2 rounded-lg transition-colors ${activePicker === 'priority' || priority !== Priority.None ? 'bg-slate-100 dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                      <Flag 
                          size={20} 
                          className={priority === Priority.High ? 'text-red-500' : priority === Priority.Medium ? 'text-yellow-500' : priority === Priority.Low ? 'text-blue-500' : 'text-slate-400'} 
                          fill={priority !== Priority.None ? "currentColor" : "none"} 
                      />
                  </button>
                  
                  <button 
                     onClick={insertHash}
                     className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                      <Hash size={20} />
                  </button>
                  
                  {!isNote && (
                      <button 
                         onClick={() => togglePicker('list')} 
                         className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${activePicker === 'list' ? 'bg-slate-100 dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentList.color }} />
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 max-w-[80px] truncate">{currentList.name}</span>
                      </button>
                  )}
              </div>

              <button 
                  onClick={handleAddTaskFn}
                  disabled={!title && attachments.length === 0}
                  className={`p-2.5 rounded-full text-white shadow-md transition-all active:scale-95 flex items-center justify-center ${existingTask ? 'bg-green-600' : 'bg-blue-600 disabled:bg-slate-200 dark:disabled:bg-slate-800'}`}
              >
                  {existingTask ? <Check size={20} strokeWidth={3} /> : <ArrowUp size={20} strokeWidth={3} />}
              </button>
          </div>
        </div>

        {/* Expanded Pickers Area */}
        <div className="transition-all duration-300 ease-in-out overflow-hidden bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
           {activePicker === 'date' && renderDatePicker()}
           {activePicker === 'priority' && renderPriorityPicker()}
           {activePicker === 'list' && renderListPicker()}
           {activePicker === 'color' && renderColorPicker()}
        </div>

        {showDrawing && (
            <DrawingCanvas onSave={handleSaveDrawing} onCancel={() => setShowDrawing(false)} />
        )}

      </div>
    </>
  );
};

export default TaskInputSheet;
    