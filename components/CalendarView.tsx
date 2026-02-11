
import React, { useState, useEffect, useRef } from 'react';
import { Task, List, Habit, Priority } from '../types';
import { 
  format, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, getDay, isBefore, 
  isAfter, addDays, endOfWeek, endOfMonth,
  addWeeks
} from 'date-fns';
import { 
  Menu, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Circle, 
  Clock, Calendar as CalendarIcon, Loader2,
  ChevronDown, LayoutGrid, Columns, RectangleVertical, CheckSquare
} from 'lucide-react';

interface CalendarViewProps {
  tasks: Task[];
  lists: List[];
  habits: Habit[];
  accessToken: string | null;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
  onMenuClick: () => void;
  onConnectGCal: () => void;
  onSync: () => void;
  onTokenExpired: () => void;
  isSyncing?: boolean;
  user?: any;
}

type CalendarMode = 'month' | 'week' | 'day';

const PIXELS_PER_HOUR = 60;
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;

// Local helpers for missing date-fns functions
const subMonths = (date: Date, n: number) => addMonths(date, -n);
const subWeeks = (date: Date, n: number) => addWeeks(date, -n);
const subDays = (date: Date, n: number) => addDays(date, -n);
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const day = date.getDay();
  const diff = (day < (options?.weekStartsOn || 0) ? 7 : 0) + day - (options?.weekStartsOn || 0);
  const d = new Date(date);
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};
const setHours = (date: Date, hours: number) => {
  const d = new Date(date);
  d.setHours(hours);
  return d;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  lists,
  habits,
  accessToken,
  onToggleTask,
  onSelectTask,
  onUpdateTask,
  onMenuClick,
  onConnectGCal,
  onSync,
  isSyncing,
  user
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarMode>('month');
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [now, setNow] = useState(new Date());
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const interval = setInterval(() => setNow(new Date()), 60000); 
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if ((viewMode === 'week' || viewMode === 'day') && scrollRef.current) {
          const currentHour = now.getHours();
          const scrollPos = Math.max(0, (currentHour - 1) * PIXELS_PER_HOUR);
          scrollRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
      }
  }, [viewMode]);

  const next = () => {
      if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
      else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
      else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
      if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
      else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
      else setCurrentDate(subDays(currentDate, 1));
  };

  const goToday = () => {
      const today = new Date();
      setCurrentDate(today);
      setSelectedDate(today);
      if ((viewMode === 'week' || viewMode === 'day') && scrollRef.current) {
          const scrollPos = Math.max(0, (today.getHours() - 1) * PIXELS_PER_HOUR);
          scrollRef.current.scrollTo({ top: scrollPos, behavior: 'smooth' });
      }
  };

  const getTasksForDay = (date: Date) => {
      return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date) && !t.isDeleted);
  };

  const getHabitsForDay = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const d = startOfDay(date);
      const dayOfWeek = getDay(date);
      return habits.filter(h => {
          if (h.isArchived) return false;
          const start = h.startDate ? startOfDay(new Date(h.startDate)) : null;
          const end = h.endDate ? startOfDay(new Date(h.endDate)) : null;
          if (start && isBefore(d, start)) return false;
          if (end && isAfter(d, end)) return false;
          if (h.history && h.history[dateStr]?.completed) return true;
          if (h.frequencyType === 'daily') return h.frequencyDays && h.frequencyDays.includes(dayOfWeek);
          return false;
      });
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.High: return 'text-red-500';
      case Priority.Medium: return 'text-yellow-500';
      case Priority.Low: return 'text-blue-500';
      default: return 'text-slate-300 dark:text-slate-600';
    }
  };

  const getTaskStyle = (task: Task) => {
      if (task.isEvent) return { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'border-l-4 border-indigo-500', text: 'text-indigo-900 dark:text-indigo-100' };
      if (task.isCompleted) return { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-l-4 border-slate-300 dark:border-slate-600', text: 'text-slate-500 dark:text-slate-400 line-through opacity-75' };
      switch (task.priority) {
          case Priority.High: return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-4 border-red-500', text: 'text-red-900 dark:text-red-100' };
          case Priority.Medium: return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-l-4 border-yellow-500', text: 'text-yellow-900 dark:text-yellow-100' };
          default: return { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-4 border-blue-500', text: 'text-blue-900 dark:text-blue-100' };
      }
  };

  const renderHeader = () => {
      // Changed MMMM yyyy to MMM yyyy for shorter month names
      let title = format(currentDate, 'MMM yyyy');
      if (viewMode === 'week') {
          const start = startOfWeek(currentDate);
          const end = endOfWeek(currentDate);
          if (isSameMonth(start, end)) title = format(start, 'MMM yyyy');
          else title = `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
      } else if (viewMode === 'day') {
          title = format(currentDate, 'MMM d, yyyy');
      }

      return (
        <div className="pt-[calc(env(safe-area-inset-top)+0.5rem)] border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-colors z-30 sticky top-0">
            <div className="h-16 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onMenuClick} className="md:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-md transition-colors"><Menu size={20}/></button>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white transition-colors truncate max-w-[140px] sm:max-w-none">{title}</h1>
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-2">
                            <button onClick={prev} className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm transition-colors"><ChevronLeft size={16}/></button>
                            <button onClick={next} className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded shadow-sm transition-colors"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 items-center flex-shrink-0">
                    <div className="relative">
                        <button 
                            onClick={() => setShowViewMenu(!showViewMenu)}
                            className="text-xs font-bold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            {viewMode === 'month' && <LayoutGrid size={14} />}
                            {viewMode === 'week' && <Columns size={14} />}
                            {viewMode === 'day' && <RectangleVertical size={14} />}
                            <ChevronDown size={12} />
                        </button>
                        
                        {showViewMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowViewMenu(false)}/>
                                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 z-20 py-1 animate-in zoom-in-95 overflow-hidden">
                                    {(['month', 'week', 'day'] as CalendarMode[]).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => { setViewMode(mode); setShowViewMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center gap-2 ${viewMode === mode ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                        >
                                            {mode === 'month' && <LayoutGrid size={14} />}
                                            {mode === 'week' && <Columns size={14} />}
                                            {mode === 'day' && <RectangleVertical size={14} />}
                                            <span className="capitalize">{mode}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button onClick={goToday} className="text-xs font-bold bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        Today
                    </button>
                    
                    {user && (
                        <button 
                        onClick={() => accessToken ? onSync() : onConnectGCal()} 
                        disabled={isSyncing}
                        className="w-9 h-9 min-w-[2.25rem] flex items-center justify-center text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16}/>} 
                        </button>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const renderMonthView = () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const selectedDayTasks = getTasksForDay(selectedDate);
      const selectedDayHabits = getHabitsForDay(selectedDate);

      return (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 h-full">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{d}</div>
                  ))}
              </div>
              
              {/* Calendar Grid - Reduced max-height to 50% to give list more space */}
              <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 dark:bg-slate-800 gap-px border-b border-slate-200 dark:border-slate-800 overflow-y-auto custom-scrollbar shrink-0" style={{ maxHeight: '50%' }}>
                  {days.map(day => {
                      const dayTasks = getTasksForDay(day);
                      const dayHabits = getHabitsForDay(day);
                      const isCurrentMonth = isSameMonth(day, monthStart);
                      const isTodayDate = isSameDay(day, now);
                      const isSelected = isSameDay(day, selectedDate);

                      return (
                          <div 
                            key={day.toString()} 
                            onClick={() => setSelectedDate(day)}
                            className={`flex flex-col p-1 min-h-[60px] cursor-pointer transition-colors gap-1 ${isSelected ? 'bg-rose-50/50 dark:bg-rose-900/10' : isCurrentMonth ? 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-950/50'}`}
                          >
                              <div className="flex justify-center mb-0.5">
                                  <div className={`text-[10px] font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all ${isSelected ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 scale-110' : isTodayDate ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 font-bold' : isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                                      {format(day, 'd')}
                                  </div>
                              </div>
                              <div className="space-y-1 overflow-hidden flex-1 px-0.5">
                                  {dayTasks.slice(0, 3).map(t => (
                                      <div key={t.id} className={`text-[8px] px-1.5 py-0.5 rounded-md truncate leading-tight ${t.isEvent ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-l-2 border-indigo-500' : 'text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-900/30 border-l-2 border-blue-400 dark:border-blue-500'} ${t.isCompleted ? 'opacity-50 line-through' : ''}`}>{t.title}</div>
                                  ))}
                                  {dayHabits.slice(0, 1).map(h => (
                                      <div key={h.id} className="text-[8px] px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 leading-tight border-l-2 border-emerald-500"><span className="opacity-80 text-[8px]">{h.icon}</span>{h.name}</div>
                                  ))}
                                  {(dayTasks.length + dayHabits.length) > 4 && <div className="text-[8px] text-slate-400 dark:text-slate-500 pl-1 leading-none font-medium">+{(dayTasks.length + dayHabits.length) - 4} more</div>}
                              </div>
                          </div>
                      );
                  })}
              </div>

              {/* Selected Agenda - Added min-h-0 to allow proper flex scrolling */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950 min-h-0 pb-20">
                  <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 z-10 flex justify-between items-center shadow-sm">
                      <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm"><CalendarIcon size={16} className="text-rose-500" /> {format(selectedDate, 'EEEE, MMM d')}</h2>
                      <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-full">{selectedDayTasks.length + selectedDayHabits.length} Events</span>
                  </div>
                  <div className="p-4 space-y-3">
                      {selectedDayTasks.map(task => (
                          <div key={task.id} onClick={() => onSelectTask(task.id)} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-3 hover:shadow-md transition-all cursor-pointer group">
                              <button onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }} className={`mt-0.5 ${getPriorityColor(task.priority)} group-hover:scale-110 transition-transform`}><Circle size={18} /></button>
                              <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{task.title}</div>
                                  <div className="flex items-center gap-3 mt-1.5">
                                      {!task.isAllDay && <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-700 leading-none"><Clock size={10} /> {format(new Date(task.dueDate!), 'HH:mm')}</div>}
                                      {task.listId !== 'inbox' && <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 leading-none"><div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lists.find(l => l.id === task.listId)?.color || '#ccc' }} />{lists.find(l => l.id === task.listId)?.name}</div>}
                                  </div>
                              </div>
                          </div>
                      ))}
                      {selectedDayHabits.map(habit => (
                          <div key={habit.id} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
                              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">{habit.icon}</div><div className="text-sm font-bold text-slate-800 dark:text-white">{habit.name}</div></div>
                              {habit.history[format(selectedDate, 'yyyy-MM-dd')]?.completed ? <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-[10px] font-bold"><CheckCircle2 size={12} /> Done</div> : <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">Pending</div>}
                          </div>
                      ))}
                      {selectedDayTasks.length === 0 && selectedDayHabits.length === 0 && (
                          <div className="text-center py-12">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                  <CalendarIcon size={24} />
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No plans for this day.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const renderTimeGrid = (days: Date[]) => {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const allDayTasksMap: Record<string, Task[]> = {};
      days.forEach(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          allDayTasksMap[dateKey] = getTasksForDay(day).filter(t => t.isAllDay);
      });
      const maxAllDayCount = Math.max(...Object.values(allDayTasksMap).map(arr => arr.length), 0);

      return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950" ref={scrollRef}>
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm shrink-0 flex-col">
                  <div className="flex">
                    <div className="w-12 border-r border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-30"></div>
                    <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                        {days.map(day => {
                            const isTodayDate = isSameDay(day, now);
                            return (
                                <div key={day.toString()} className="text-center py-3 border-r border-slate-100 dark:border-slate-800 last:border-0">
                                    <div className={`text-[10px] font-bold uppercase mb-1 ${isTodayDate ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>{format(day, 'EEE')}</div>
                                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-bold transition-all ${isTodayDate ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30' : 'text-slate-700 dark:text-slate-300'}`}>{format(day, 'd')}</div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                  {maxAllDayCount > 0 && (
                      <div className="flex border-t border-slate-100 dark:border-slate-800">
                          <div className="w-12 border-r border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-center text-[9px] text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-900">All Day</div>
                          <div className="flex-1 grid gap-px bg-slate-100 dark:bg-slate-800" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                              {days.map(day => {
                                  const dateKey = format(day, 'yyyy-MM-dd');
                                  const allDayTasks = allDayTasksMap[dateKey] || [];
                                  return (
                                      <div key={day.toString()} className="bg-white dark:bg-slate-900 p-1 min-h-[30px] flex flex-col gap-1">
                                          {allDayTasks.map(task => (
                                              <div key={task.id} onClick={() => onSelectTask(task.id)} className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer ${task.isEvent ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'} ${task.isCompleted ? 'opacity-50 line-through' : ''}`}>{task.title}</div>
                                          ))}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar relative pb-20">
                  {isSameDay(days[0], now) || (days.length > 1 && isAfter(now, days[0]) && isBefore(now, days[days.length - 1])) ? (
                      <div className="absolute left-0 right-0 z-10 pointer-events-none flex items-center" style={{ top: currentMinutes * PIXELS_PER_MINUTE }}>
                          <div className="w-12 text-[10px] font-bold text-red-500 text-right pr-1 -mt-2.5 bg-white dark:bg-slate-950">{format(now, 'HH:mm')}</div>
                          <div className="flex-1 h-px bg-red-500 relative"><div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div></div>
                      </div>
                  ) : null}
                  <div className="flex min-h-[1440px]">
                      <div className="w-12 border-r border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
                          {hours.map(h => <div key={h} className="h-[60px] text-[10px] text-slate-400 text-right pr-2 -mt-2 relative">{h !== 0 && <span>{format(setHours(new Date(), h), 'h a')}</span>}</div>)}
                      </div>
                      <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
                          {hours.map(h => <div key={`line-${h}`} className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800 pointer-events-none" style={{ top: h * PIXELS_PER_HOUR, height: PIXELS_PER_HOUR }}></div>)}
                          {days.map(day => {
                              const dayTasks = getTasksForDay(day);
                              const timedTasks = dayTasks.filter(t => !t.isAllDay);
                              return (
                                  <div key={day.toString()} className="border-r border-slate-100 dark:border-slate-800 last:border-0 relative h-full group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                      {timedTasks.map(task => {
                                          if (!task.dueDate) return null;
                                          const start = new Date(task.dueDate);
                                          const startMinutes = start.getHours() * 60 + start.getMinutes();
                                          const duration = task.duration || 60;
                                          const style = getTaskStyle(task);
                                          return (
                                              <div key={task.id} onClick={() => onSelectTask(task.id)} className={`absolute left-0.5 right-0.5 rounded-lg p-1.5 overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:z-20 transition-all ${style.bg} ${style.border}`} style={{ top: startMinutes * PIXELS_PER_MINUTE, height: Math.max(duration * PIXELS_PER_MINUTE, 24) - 2 }}>
                                                  <div className="flex items-start gap-1 h-full">
                                                      {!task.isEvent && <button onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }} className={`mt-0.5 shrink-0 ${task.isCompleted ? 'text-slate-400' : style.text} hover:opacity-70`}>{task.isCompleted ? <CheckSquare size={12} /> : <div className="w-3 h-3 border-2 rounded-sm border-current" />}</button>}
                                                      <div className="min-w-0 flex-1"><div className={`text-[10px] font-bold leading-tight truncate ${style.text}`}>{task.title}</div>{duration >= 45 && <div className={`text-[9px] opacity-80 truncate ${style.text} mt-0.5`}>{format(start, 'h:mm a')} - {format(addDays(start, 0), 'h:mm a')}</div>}</div>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 flex-1 overflow-hidden transition-colors">
      {renderHeader()}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderTimeGrid(eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) }))}
      {viewMode === 'day' && renderTimeGrid([currentDate])}
    </div>
  );
};

export default CalendarView;
