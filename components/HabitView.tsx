
import React, { useState, useMemo } from 'react';
import { Habit, HabitLog } from '../types';
import { 
  Plus, Check, Menu, ArrowRight, MinusCircle
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, startOfDay } from 'date-fns';
import HabitFormSheet from './HabitFormSheet';

interface HabitViewProps {
  habits: Habit[];
  onToggleHabit: (id: string, date: string) => void;
  onUpdateHabit: (habit: Habit) => void;
  onAddHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onMenuClick?: () => void;
  onOpenStats: () => void;
}

const HabitView: React.FC<HabitViewProps> = ({ 
    habits, onToggleHabit, onUpdateHabit, onAddHabit, onMenuClick, onOpenStats
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSheet, setShowAddSheet] = useState(false);

  const calendarDays = useMemo(() => {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const filteredHabits = useMemo(() => {
      return habits.filter(h => !h.isArchived);
  }, [habits]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="pt-6 px-6 pb-4 shrink-0">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onMenuClick} className="md:hidden p-3 bg-white rounded-full shadow-organic text-charcoal">
                    <Menu size={24}/>
                </button>
                <h1 className="text-[40px] font-black text-charcoal tracking-tight">Habits</h1>
                <button 
                    onClick={onOpenStats}
                    className="p-3 bg-white rounded-full shadow-organic text-charcoal hover:bg-cream transition-colors"
                >
                    <ArrowRight size={20} />
                </button>
            </div>

            {/* Organic Calendar Strip */}
            <div className="flex justify-between items-center bg-white p-2 rounded-[24px] shadow-organic">
                {calendarDays.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                        <button 
                            key={day.toString()}
                            onClick={() => setSelectedDate(day)}
                            className={`
                                flex flex-col items-center justify-center w-12 h-16 rounded-[18px] transition-all duration-300
                                ${isSelected 
                                    ? 'bg-charcoal text-white shadow-lg scale-105' 
                                    : 'text-charcoal/40 hover:bg-cream'
                                }
                            `}
                        >
                            <span className="text-[10px] font-bold uppercase mb-1">{format(day, 'EEE')}</span>
                            <span className="text-lg font-black">{format(day, 'd')}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32 pt-2 space-y-4 no-scrollbar">
            {filteredHabits.map(habit => {
                const log = habit.history[selectedDateStr];
                const isCompleted = log?.completed;
                
                return (
                    <div 
                        key={habit.id}
                        className={`
                            group p-5 rounded-card transition-all duration-300 flex items-center justify-between
                            bg-white shadow-organic hover:scale-[1.02]
                        `}
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-cream">
                                {habit.icon}
                            </div>
                            <div>
                                <h3 className={`font-bold text-xl text-charcoal ${isCompleted ? 'line-through opacity-40' : ''}`}>
                                    {habit.name}
                                </h3>
                                <div className="text-xs font-bold text-charcoal/40 mt-1 bg-gray-50 inline-block px-2 py-1 rounded-full">
                                    {Object.keys(habit.history).length} Days Streak
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => onToggleHabit(habit.id, selectedDateStr)}
                            className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                                ${isCompleted 
                                    ? 'bg-coral text-white scale-110' 
                                    : 'bg-gray-100 text-charcoal/20 hover:bg-yellow-soft hover:text-charcoal'
                                }
                            `}
                        >
                            <Check size={20} strokeWidth={4} />
                        </button>
                    </div>
                );
            })}
        </div>

        <div className="fixed bottom-24 right-6 z-40">
            <button 
                onClick={() => setShowAddSheet(true)}
                className="w-16 h-16 bg-yellow-soft text-charcoal rounded-[24px] shadow-organic flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
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
};

export default HabitView;
