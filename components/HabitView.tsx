
import React, { useState, useMemo, useEffect } from 'react';
import { Habit, HabitLog } from '../types';
import { 
  Plus, ChevronRight, Check, Bell, Clock, User, Star, CloudSun, Menu
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
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
  user?: any;
}

const LandscapeBackground = () => (
    <div className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none overflow-hidden select-none opacity-40 dark:opacity-20 z-0">
        <svg viewBox="0 0 800 300" className="w-full h-full preserve-3d object-cover" preserveAspectRatio="none">
            {/* Hills */}
            <path d="M0 300 Q 200 200 400 250 T 800 220 V 300 H 0 Z" fill="#1a1a1a" />
            <path d="M0 300 Q 150 250 300 280 T 600 240 T 800 280 V 300 H 0 Z" fill="#111111" />
            {/* Simple styling for performance and mobile fit */}
        </svg>
    </div>
);

const HabitCard: React.FC<{
    habit: Habit;
    dateStr: string;
    onToggle: () => void;
    onClick: () => void;
}> = ({ habit, dateStr, onToggle, onClick }) => {
    const isCompleted = (habit.history?.[dateStr] as HabitLog | undefined)?.completed;
    
    return (
        <div 
            onClick={onClick}
            className="flex-1 bg-[#222222] dark:bg-[#1a1a1a] p-4 rounded-3xl shadow-sm border border-transparent hover:border-slate-800 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] mb-3"
        >
            <div className="flex items-center gap-4 overflow-hidden">
                <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0"
                    style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
                >
                    {habit.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className={`font-bold text-base text-white transition-colors truncate ${isCompleted ? 'opacity-40 line-through' : ''}`}>
                        {habit.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <span>Streak: </span>
                        <span className="text-orange-400">
                            {/* Simple streak display */}
                            {Object.values(habit.history || {}).filter((h: HabitLog) => h.completed).length}
                        </span>
                    </div>
                </div>
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0
                    ${isCompleted 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'border-slate-700 hover:border-blue-400 text-transparent'
                    }
                `}
            >
                <Check size={18} strokeWidth={4} />
            </button>
        </div>
    );
};

const HabitView: React.FC<HabitViewProps> = React.memo(({ 
    habits, onToggleHabit, onUpdateHabit, onAddHabit, onDeleteHabit, onMenuClick, onOpenStats, user
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Change: Store ID instead of object to prevent stale data
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [greeting, setGreeting] = useState('');

  // Derived state: Always get the latest habit object from props
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
    // Update periodically
    const interval = setInterval(updateGreeting, 60000); 
    return () => clearInterval(interval);
  }, []);

  const calendarDays = useMemo(() => {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const groupedHabits = useMemo(() => {
      const active = habits.filter(h => !h.isArchived);
      return {
          Morning: active.filter(h => h.section === 'Morning'),
          Afternoon: active.filter(h => h.section === 'Afternoon'),
          Night: active.filter(h => h.section === 'Night'),
          Anytime: active.filter(h => !h.section || h.section === 'Others')
      };
  }, [habits]);

  if (selectedHabit) {
      return (
          <HabitDetailView 
              habit={selectedHabit}
              onClose={() => setSelectedHabitId(null)}
              onToggleCheck={(date) => onToggleHabit(selectedHabit.id, date)}
              onEdit={onUpdateHabit}
              onDelete={onDeleteHabit}
          />
      );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-[#111111] font-sans relative overflow-hidden text-white">
        <LandscapeBackground />
        
        {/* Header - Safe Area Wrapper */}
        <div className="pt-safe z-20 relative shrink-0">
            <div className="px-4 mt-4 pb-2 flex justify-between items-center">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-full">
                            <Menu size={24}/>
                        </button>
                        <h1 className="text-2xl font-black tracking-tight text-white">{greeting}</h1>
                    </div>
                    <p className="text-sm font-bold text-slate-500 ml-1">Let's build consistency.</p>
                </div>
                
                {/* Placeholder for weather or user */}
                <div className="flex items-center gap-2">
                    <div className="bg-[#222222] p-2 rounded-xl flex items-center gap-2 border border-slate-800">
                        <CloudSun size={18} className="text-yellow-500" />
                        <span className="text-xs font-bold">24°</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Calendar Strip - Inspired Tall Pill Style */}
        <div className="px-4 py-4 z-20 relative shrink-0">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {calendarDays.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                        <button 
                            key={day.toString()}
                            onClick={() => setSelectedDate(day)}
                            className={`
                                flex flex-col items-center justify-center min-w-[3.5rem] h-[4.5rem] rounded-2xl transition-all duration-300 shrink-0
                                ${isSelected 
                                    ? 'bg-[#222222] text-white shadow-xl ring-1 ring-slate-700 scale-105' 
                                    : 'text-slate-500 hover:bg-white/5'
                                }
                            `}
                        >
                            <span className="text-[10px] font-black mb-1 uppercase tracking-tighter opacity-60">{format(day, 'EEE')}</span>
                            <span className="text-base font-black">{format(day, 'd')}</span>
                            {isToday(day) && !isSelected && <div className="w-1 h-1 bg-blue-500 rounded-full mt-1"></div>}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Habit List Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-32 z-10 relative">
            
            {/* Sections */}
            {(Object.entries(groupedHabits) as [string, Habit[]][]).map(([sectionName, sectionHabits]) => {
                if (sectionHabits.length === 0) return null;
                return (
                    <div key={sectionName} className="mt-6">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{sectionName}</h2>
                            <span className="text-[10px] font-bold text-slate-600 bg-[#222222] px-2 py-0.5 rounded-full">{sectionHabits.length}</span>
                        </div>
                        <div className="space-y-3">
                            {sectionHabits.map(habit => (
                                <HabitCard 
                                    key={habit.id}
                                    habit={habit}
                                    dateStr={selectedDateStr}
                                    onToggle={() => onToggleHabit(habit.id, selectedDateStr)}
                                    onClick={() => setSelectedHabitId(habit.id)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {habits.filter(h => !h.isArchived).length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-20 text-white">
                    <Star size={64} />
                    <p className="font-bold mt-4">Start your journey today</p>
                </div>
            )}
        </div>

        {/* Floating Add Button - Moved up to avoid nav overlap */}
        <div className="absolute bottom-32 right-6 z-40 md:bottom-10 md:right-10">
            <button 
                onClick={() => setShowAddSheet(true)}
                className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all border-2 border-[#111111]"
            >
                <Plus size={28} strokeWidth={3} />
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
