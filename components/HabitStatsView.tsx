
import React, { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Share2, Menu, X, ExternalLink
} from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { 
  format, eachDayOfInterval, 
  isSameDay, addMonths, addWeeks, getDay
} from 'date-fns';

// Helper functions for date-fns members reported as missing
const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
    const day = getDay(date);
    const startDay = options?.weekStartsOn || 0;
    const diff = (day < startDay ? 7 : 0) + day - startDay;
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() - diff);
    return result;
};
const endOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
    const start = startOfWeek(date, options);
    const result = new Date(start);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
};
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const subMonths = (date: Date, n: number) => addMonths(date, -n);
const subWeeks = (date: Date, n: number) => addWeeks(date, -n);

interface HabitStatsViewProps {
    habits: Habit[];
    onClose?: () => void;
}

type Tab = 'Week' | 'Month' | 'Record';

const HabitStatsView: React.FC<HabitStatsViewProps> = ({ habits, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Helpers ---
  const activeHabits = habits.filter(h => !h.isArchived);

  // --- Renderers ---

  const renderWeekView = () => {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

      return (
          <div className="p-4 animate-in fade-in">
              <div className="flex items-center justify-between mb-6 px-2">
                  <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20}/></button>
                  <span className="text-slate-800 font-bold">This Week</span>
                  <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20}/></button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto pb-2">
                      <table className="w-full border-collapse min-w-[300px]">
                          <thead>
                              <tr>
                                  <th className="text-left pb-4 text-slate-500 font-medium text-xs sticky left-0 bg-white z-10 w-24">Habit</th>
                                  {weekDays.map(day => (
                                      <th key={day.toString()} className="pb-4 text-center min-w-[32px]">
                                          <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">{format(day, 'EEE').slice(0, 2)}</div>
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="space-y-4">
                              {activeHabits.map(habit => (
                                  <tr key={habit.id} className="group border-b border-slate-50 last:border-0">
                                      <td className="py-3 pr-4 sticky left-0 bg-white z-10">
                                          <div className="flex items-center gap-2">
                                              <span className="text-lg">{habit.icon}</span>
                                              <span className="text-slate-700 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">{habit.name}</span>
                                          </div>
                                      </td>
                                      {weekDays.map(day => {
                                          const dateStr = format(day, 'yyyy-MM-dd');
                                          const completed = habit.history[dateStr]?.completed;
                                          return (
                                              <td key={day.toString()} className="py-3 text-center">
                                                  <div 
                                                    className={`w-6 h-6 rounded mx-auto transition-all ${completed ? '' : 'bg-slate-100'}`}
                                                    style={{ backgroundColor: completed ? habit.color : undefined }}
                                                  />
                                              </td>
                                          )
                                      })}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      );
  };

  const renderMonthView = () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
      // Calculate padding for grid alignment (Sun start)
      const startDay = getDay(monthStart);
      const paddedDays = Array(startDay).fill(null).concat(daysInMonth);

      return (
          <div className="p-4 animate-in fade-in">
               <div className="flex items-center justify-between mb-6 px-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronLeft size={20}/></button>
                  <span className="text-slate-800 font-bold text-lg">{format(currentDate, 'MMM')}</span>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-slate-100 rounded-full text-slate-500"><ChevronRight size={20}/></button>
              </div>

              {/* Premium Banner Mock */}
              <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-2 rounded-lg text-xs font-bold mb-6 mx-2 border border-yellow-100">
                  <ExternalLink size={12} />
                  <span>Detailed Analysis</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeHabits.map(habit => (
                      <div key={habit.id} className="bg-white rounded-2xl p-4 flex flex-col gap-3 border border-slate-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                              <span>{habit.icon}</span>
                              <span className="text-slate-800 font-medium text-sm truncate flex-1">{habit.name}</span>
                          </div>
                          
                          {/* Mini Heatmap */}
                          <div className="grid grid-cols-7 gap-1">
                              {paddedDays.map((day, i) => {
                                  if (!day) return <div key={i} className="w-full pt-[100%]" />; // spacer
                                  
                                  const dateStr = format(day, 'yyyy-MM-dd');
                                  const completed = habit.history[dateStr]?.completed;
                                  
                                  return (
                                      <div 
                                        key={i} 
                                        className={`w-full pt-[100%] rounded-sm relative ${completed ? '' : 'bg-slate-100'}`}
                                        style={{ backgroundColor: completed ? habit.color : undefined }}
                                      >
                                          {/* Aspect Ratio Trick */}
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderRecordView = () => {
      // Flatten all logs
      const allLogs = activeHabits.flatMap(h => {
          return (Object.entries(h.history) as [string, HabitLog][]).map(([date, log]) => ({
              habit: h,
              date,
              ...log
          }));
      }).sort((a, b) => b.date.localeCompare(a.date));

      return (
          <div className="p-4 animate-in fade-in">
              <div className="space-y-4">
                  {allLogs.length === 0 && <div className="text-slate-400 text-center py-10">No records found.</div>}
                  {allLogs.map((log, i) => (
                      <div key={i} className="flex gap-4">
                          <div className="w-12 text-center pt-1 shrink-0">
                              <div className="text-sm font-bold text-slate-400">{format(new Date(log.date), 'MMM')}</div>
                              <div className="text-xl font-bold text-slate-800">{format(new Date(log.date), 'dd')}</div>
                          </div>
                          <div className="flex-1 bg-white p-3 rounded-xl flex items-center gap-3 border border-slate-200 shadow-sm min-w-0">
                              <div className="text-2xl shrink-0">{log.habit.icon}</div>
                              <div className="min-w-0">
                                  <div className="font-bold text-slate-800 truncate">{log.habit.name}</div>
                                  <div className="text-xs text-slate-500">{log.completed ? 'Completed' : 'Skipped'}</div>
                              </div>
                              {log.mood && <div className="ml-auto text-xl">{log.mood}</div>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 text-slate-900 relative overflow-hidden font-sans">
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 shrink-0 bg-white z-10 border-b border-slate-200 shadow-sm">
             {onClose ? (
                <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:text-slate-800"><X size={24}/></button>
             ) : (
                <div className="w-10"></div>
             )}
             
             {/* Tabs */}
             <div className="flex bg-slate-100 rounded-lg p-1 overflow-x-auto no-scrollbar max-w-[200px] sm:max-w-none">
                  {(['Week', 'Month', 'Record'] as Tab[]).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1 text-xs font-bold rounded-md transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          {tab}
                      </button>
                  ))}
             </div>

             <button className="p-2 text-slate-500 hover:text-slate-800"><Share2 size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'Week' && renderWeekView()}
            {activeTab === 'Month' && renderMonthView()}
            {activeTab === 'Record' && renderRecordView()}
        </div>
    </div>
  );
};

export default HabitStatsView;
