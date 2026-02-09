
import React, { useState, useMemo, useEffect } from 'react';
import { Habit, HabitLog } from '../types';
import { 
  Plus, ChevronRight, Check, Bell, Clock, User, Star, CloudSun, Menu, Zap, Calendar, ArrowRight
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, isAfter, startOfDay } from 'date-fns';
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
}> = ({ habit, dateStr, onToggle, onClick }) => {
    const isCompleted = (habit.history?.[dateStr] as HabitLog | undefined)?.completed;
    
    // Calculate streak
    const streak = Object.keys(habit.history || {}).filter(k => habit.history[k].completed).length;

    return (
        <div 
            onClick={onClick}
            className={`
                relative aspect-square p-4 rounded-[28px] border transition-all duration-300 cursor-pointer flex flex-col justify-between group bento-card overflow-hidden
                ${isCompleted 
                    ? 'border-transparent text-white shadow-lg' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                }
            `}
            style={{ 
                backgroundColor: isCompleted ? habit.color : undefined,
                boxShadow: isCompleted ? `0 10px 30px -10px ${habit.color}80` : undefined
            }}
        >
            {/* Background Icon (Decorative) */}
            <div className={`absolute -right-2 -bottom-2 text-8xl opacity-10 pointer-events-none transition-transform duration-500 group-hover:scale-110 ${isCompleted ? 'text-white' : 'grayscale'}`}>
                {habit.icon}
            </div>

            <div className="flex justify-between items-start z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-colors ${isCompleted ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {habit.icon}
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-90 ${isCompleted ? 'bg-white text-current border-white' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'}`}
                    style={{ color: isCompleted ? habit.color : undefined }}
                >
                    {isCompleted && <Check size={16} strokeWidth={4} />}
                </button>
            </div>

            <div className="z-10">
                <h3 className={`font-bold text-lg leading-tight mb-1 truncate ${isCompleted ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    {habit.name}
                </h3>
                <div className={`text-xs font-bold ${isCompleted ? 'text-white/80' : 'text-slate-400'}`}>
                    {streak} Day Streak
                </div>
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
  }, []);

  const calendarDays = useMemo(() => {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Filter habits based on Start Date and End Date
  const filteredHabits = useMemo(() => {
      const selectedDayStart = startOfDay(selectedDate);
      return habits.filter(h => {
          if (h.isArchived) return false;
          if (h.startDate && isBefore(selectedDayStart, startOfDay(new Date(h.startDate)))) return false;
          if (h.endDate && isAfter(selectedDayStart, startOfDay(new Date(h.endDate)))) return false;
          return true;
      });
  }, [habits, selectedDate]);

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
    <div className="h-full flex flex-col relative overflow-hidden">
        
        {/* Header - Safe Area Wrapper */}
        <div className="pt-safe shrink-0 px-4 pt-4 z-20">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 shadow-sm rounded-[24px] p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-slate-500 rounded-full">
                                <Menu size={24}/>
                            </button>
                            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{greeting}</h1>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Keep up the momentum.</p>
                    </div>
                    <button onClick={onOpenStats} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:scale-105 transition-transform">
                        <ArrowRight size={20} />
                    </button>
                </div>

                {/* Calendar Strip */}
                <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                    {calendarDays.map(day => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isToday(day);
                        return (
                            <button 
                                key={day.toString()}
                                onClick={() => setSelectedDate(day)}
                                className={`
                                    flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all duration-300
                                    ${isSelected 
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md scale-105' 
                                        : 'text-slate-400 dark:text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'
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

        {/* Habit Grid Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-32 pt-6 z-10 relative">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-slide-up">
                {filteredHabits.map(habit => (
                    <HabitCard 
                        key={habit.id}
                        habit={habit}
                        dateStr={selectedDateStr}
                        onToggle={() => onToggleHabit(habit.id, selectedDateStr)}
                        onClick={() => setSelectedHabitId(habit.id)}
                    />
                ))}
                
                {/* Add New Card */}
                <button 
                    onClick={() => setShowAddSheet(true)}
                    className="aspect-square rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="font-bold text-sm">New Habit</span>
                </button>
            </div>

            {filteredHabits.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-40 text-slate-400">
                    <Star size={64} className="mb-4 stroke-1" />
                    <p className="font-bold text-lg">No habits for this day</p>
                </div>
            )}
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
