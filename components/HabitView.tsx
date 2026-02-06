
import React, { useState, useMemo, useEffect } from 'react';
import { Habit, HabitLog } from '../types';
import { 
  Plus, ChevronRight, Check, Bell, Clock, User, Star, CloudSun, Menu, Zap, Calendar, ArrowRight, MinusCircle
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, isAfter, startOfDay } from 'date-fns';
import confetti from 'canvas-confetti';
import HabitFormSheet from './HabitFormSheet';
import HabitDetailView from './HabitDetailView';

interface HabitViewProps {
  habits: Habit[];
  onToggleHabit: (id: string, date: string) => void;
  onUpdateHabit: (habit: Habit) => void;
  onAddHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onMenuClick?: () => void;
  onOpenStats: () => void;
  onStartFocus?: (habitId: string) => void;
  user?: any;
}

const HabitCard: React.FC<{
    habit: Habit;
    dateStr: string;
    onToggle: () => void;
    onClick: () => void;
    onFocus: () => void;
}> = ({ habit, dateStr, onToggle, onClick, onFocus }) => {
    const log = habit.history?.[dateStr] as HabitLog | undefined;
    const isCompleted = log?.completed;
    const isSkipped = log?.status === 'skipped';
    
    const streak = Object.keys(habit.history || {}).filter(k => habit.history[k].completed).length;

    return (
        <div 
            onClick={onClick}
            className={`
                group relative p-5 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-between
                ${isCompleted 
                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 shadow-soft-pressed dark:shadow-soft-dark-pressed' 
                    : isSkipped 
                        ? 'bg-slate-100 dark:bg-slate-800 shadow-inner'
                        : 'bg-surface-card_light dark:bg-surface-card_dark shadow-soft dark:shadow-soft-dark hover:-translate-y-1'
                }
            `}
        >
            <div className="flex items-center gap-4 min-w-0">
                <div 
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-105 shrink-0 ${isCompleted ? 'opacity-100' : 'opacity-90'} ${isSkipped ? 'grayscale opacity-50' : ''}`}
                    style={{ backgroundColor: isSkipped ? '#cbd5e1' : `${habit.color}20` }}
                >
                    {habit.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-base text-slate-800 dark:text-white truncate ${isCompleted || isSkipped ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {habit.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {streak} Days
                        </span>
                        {habit.quote && <span className="text-xs text-slate-400 truncate max-w-[150px] hidden sm:block">{habit.quote}</span>}
                        {isSkipped && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded font-bold">Skipped</span>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {!isCompleted && !isSkipped && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onFocus(); }}
                        className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Zap size={18} />
                    </button>
                )}

                <button 
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0
                        ${isCompleted 
                            ? 'bg-emerald-500 text-white shadow-inner scale-110' 
                            : isSkipped
                                ? 'bg-slate-300 text-white'
                                : 'bg-background-light dark:bg-background-dark shadow-soft dark:shadow-soft-dark text-transparent hover:text-slate-300'
                        }
                    `}
                >
                    {isSkipped ? <MinusCircle size={18} /> : <Check size={18} strokeWidth={4} />}
                </button>
            </div>
        </div>
    );
};

const HabitView: React.FC<HabitViewProps> = React.memo(({ 
    habits, onToggleHabit, onUpdateHabit, onAddHabit, onDeleteHabit, onMenuClick, onOpenStats, onStartFocus, user
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [greeting, setGreeting] = useState('');

  const selectedHabit = useMemo(() => 
    habits.find(h => h.id === selectedHabitId) || null
  , [habits, selectedHabitId]);

  useEffect(() => {
    const updateGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); 
    return () => clearInterval(interval);
  }, []);

  const calendarDays = useMemo(() => {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const filteredHabits = useMemo(() => {
      const selectedDayStart = startOfDay(selectedDate);
      return habits.filter(h => {
          if (h.isArchived) return false;
          if (h.startDate) {
              const start = startOfDay(new Date(h.startDate));
              if (isBefore(selectedDayStart, start)) return false;
          }
          if (h.endDate) {
              const end = startOfDay(new Date(h.endDate));
              if (isAfter(selectedDayStart, end)) return false;
          }
          return true;
      });
  }, [habits, selectedDate]);

  const groupedHabits = useMemo(() => {
      return {
          Morning: filteredHabits.filter(h => h.section === 'Morning'),
          Afternoon: filteredHabits.filter(h => h.section === 'Afternoon'),
          Night: filteredHabits.filter(h => h.section === 'Night'),
          Anytime: filteredHabits.filter(h => !h.section || h.section === 'Others')
      };
  }, [filteredHabits]);

  const handleToggle = (id: string, sectionHabits: Habit[]) => {
      const habit = habits.find(h => h.id === id);
      const isCompletedNow = habit?.history[selectedDateStr]?.completed;
      
      onToggleHabit(id, selectedDateStr);

      if (!isCompletedNow && isToday(selectedDate)) {
          const otherHabits = sectionHabits.filter(h => h.id !== id);
          const allOthersDone = otherHabits.every(h => {
              const log = h.history[selectedDateStr];
              return log?.completed || log?.status === 'skipped';
          });

          if (allOthersDone) {
              confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899']
              });
          }
      }
  };

  if (selectedHabit) {
      return (
          <HabitDetailView 
              habit={selectedHabit}
              onClose={() => setSelectedHabitId(null)}
              onToggleCheck={(date) => onToggleHabit(selectedHabit.id, date)}
              onEdit={onUpdateHabit}
              onDelete={onDeleteHabit}
              onStartFocus={() => onStartFocus && onStartFocus(selectedHabit.id)}
          />
      );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-background-light dark:bg-background-dark font-sans relative overflow-hidden transition-colors">
        
        <div className="pt-safe shrink-0 sticky top-0 z-20 bg-background-light dark:bg-background-dark">
            <div className="px-4 py-4 flex justify-between items-center">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <button onClick={onMenuClick} className="md:hidden p-3 bg-surface-card_light dark:bg-surface-card_dark rounded-xl shadow-soft dark:shadow-soft-dark text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all">
                            <Menu size={20}/>
                        </button>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white ml-2">{greeting}</h1>
                    </div>
                </div>
                <button 
                    onClick={onOpenStats}
                    className="p-3 bg-surface-card_light dark:bg-surface-card_dark rounded-xl shadow-soft dark:shadow-soft-dark text-slate-500 hover:text-blue-500 transition-all active:scale-95"
                >
                    <ArrowRight size={20} />
                </button>
            </div>

            <div className="px-4 pb-2">
                <div className="flex justify-between items-center bg-surface-card_light dark:bg-surface-card_dark p-2 rounded-2xl shadow-soft-pressed dark:shadow-soft-dark-pressed">
                    {calendarDays.map(day => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);
                        return (
                            <button 
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-200
                                    ${isSelected 
                                        ? 'bg-background-light dark:bg-background-dark shadow-soft dark:shadow-soft-dark text-blue-600 dark:text-blue-400 scale-105' 
                                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                                    }
                                `}
                            >
                                <span className="text-[10px] font-bold mb-0.5 uppercase">{format(day, 'EEE')}</span>
                                <span className={`text-sm font-bold ${isTodayDate && !isSelected ? 'text-blue-500' : ''}`}>{format(day, 'd')}</span>
                                {isTodayDate && <div className="w-1 h-1 bg-blue-500 rounded-full mt-0.5"></div>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-32 z-10 relative">
            {(Object.entries(groupedHabits) as [string, Habit[]][]).map(([sectionName, sectionHabits]) => {
                if (sectionHabits.length === 0) return null;
                return (
                    <div key={sectionName} className="mt-6 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                {sectionName === 'Morning' && <CloudSun size={14}/>}
                                {sectionName === 'Night' && <Star size={14}/>}
                                {sectionName}
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{sectionHabits.length}</span>
                        </div>
                        <div className="space-y-4">
                            {sectionHabits.map(habit => (
                                <HabitCard 
                                    key={habit.id}
                                    habit={habit}
                                    dateStr={selectedDateStr}
                                    onToggle={() => handleToggle(habit.id, sectionHabits)}
                                    onClick={() => setSelectedHabitId(habit.id)}
                                    onFocus={() => onStartFocus && onStartFocus(habit.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {filteredHabits.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-40 text-slate-400">
                    <Star size={64} className="mb-4 stroke-1" />
                    <p className="font-bold text-lg">No habits for this day</p>
                </div>
            )}
        </div>

        <div className="absolute bottom-6 right-6 z-40 mb-safe">
            <button 
                onClick={() => setShowAddSheet(true)}
                className="w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={32} strokeWidth={3} />
            </button>
        </div>

        <HabitFormSheet 
            isOpen={showAddSheet}
            onClose={() => setShowAddSheet(false)}
            onSave={(habit) => { onAddHabit(habit); setShowAddSheet(false); }}
        />
    </div>
  );
});

export default HabitView;
