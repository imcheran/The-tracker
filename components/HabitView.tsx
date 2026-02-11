
import React, { useState, useMemo, useEffect } from 'react';
import { Habit, HabitLog, HabitFrequencyType, HabitSection } from '../types';
import { Plus, ChevronRight, Check, Bell, Clock, User, Star, CloudSun, Menu, Zap, Calendar, ArrowRight, ArrowLeft, Trash2, Edit2, Share2, CheckCircle2, Activity, TrendingUp, RefreshCw, X, ChevronDown, ChevronLeft, Settings } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, isAfter, startOfDay, eachDayOfInterval, startOfMonth, endOfMonth, getDaysInMonth, subMonths, addMonths, subWeeks, addWeeks, getDay } from 'date-fns';
import { WheelPicker } from './Shared';

// --- HabitFormSheet ---
const ICONS = ['💧', '📚', '🏃', '🧘', '🍎', '💤', '🎸', '💰', '🧹', '💊'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const HabitFormSheet: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (habit: Habit) => void; initialData?: Habit; }> = ({ isOpen, onClose, onSave, initialData }) => {
  const [name, setName] = useState(''); const [icon, setIcon] = useState(ICONS[0]); const [color, setColor] = useState(COLORS[0]);
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily'); const [frequencyDays, setFrequencyDays] = useState<number[]>([0,1,2,3,4,5,6]);
  useEffect(() => { if (isOpen) { if (initialData) { setName(initialData.name); setIcon(initialData.icon); setColor(initialData.color); } else { setName(''); setIcon(ICONS[0]); setColor(COLORS[0]); } } }, [isOpen, initialData]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900 text-white flex flex-col pt-safe animate-in slide-in-from-bottom">
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-800"><button onClick={onClose}><X/></button><span className="font-bold">Habit</span><button onClick={() => { onSave({ id: initialData?.id || Date.now().toString(), name, icon, color, frequencyType, frequencyDays, history: initialData?.history || {}, createdDate: new Date() } as Habit); onClose(); }}><Check/></button></div>
        <div className="p-6 space-y-6"><input value={name} onChange={e => setName(e.target.value)} placeholder="Habit Name" className="w-full bg-slate-800 p-4 rounded-xl text-white outline-none" /><div className="flex gap-4">{ICONS.map(i => <button key={i} onClick={() => setIcon(i)} className={`p-2 rounded-full ${icon === i ? 'bg-slate-700' : ''}`}>{i}</button>)}</div></div>
    </div>
  );
};

// --- HabitStatsView ---
const HabitStatsView: React.FC<{ habits: Habit[]; onClose: () => void; }> = ({ habits, onClose }) => {
    return <div className="flex-1 bg-white p-4"><button onClick={onClose} className="mb-4"><ChevronLeft/></button><h2 className="text-2xl font-bold mb-4">Statistics</h2>{habits.map(h => <div key={h.id} className="mb-4"><strong>{h.name}</strong>: {Object.keys(h.history).filter(d => h.history[d].completed).length} completions</div>)}</div>;
};

// --- HabitDetailView ---
const HabitDetailView: React.FC<{ habit: Habit; onClose: () => void; onToggleCheck: (date: string) => void; onEdit: (h: Habit) => void; onDelete: (id: string) => void; }> = ({ habit, onClose, onToggleCheck, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    return (
        <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col pt-safe animate-in slide-in-from-right">
            <div className="h-16 flex items-center justify-between px-4"><button onClick={onClose}><ChevronLeft/></button><span className="font-bold">{habit.name}</span><button onClick={() => setIsEditing(true)}><Edit2/></button></div>
            <div className="p-4 text-center"><div className="text-6xl mb-4">{habit.icon}</div><div className="text-2xl font-bold mb-2">{habit.name}</div><button onClick={() => onDelete(habit.id)} className="text-red-500 mt-4">Delete Habit</button></div>
            <HabitFormSheet isOpen={isEditing} onClose={() => setIsEditing(false)} onSave={onEdit} initialData={habit} />
        </div>
    );
};

// --- HabitView (Main) ---
const HabitView: React.FC<{ habits: Habit[]; onToggleHabit: (id: string, date: string) => void; onUpdateHabit: (h: Habit) => void; onAddHabit: (h: Habit) => void; onDeleteHabit: (id: string) => void; onMenuClick: () => void; onOpenStats: () => void; }> = ({ habits, onToggleHabit, onUpdateHabit, onAddHabit, onDeleteHabit, onMenuClick, onOpenStats }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const selectedHabit = habits.find(h => h.id === selectedHabitId);
  
  if (selectedHabit) return <HabitDetailView habit={selectedHabit} onClose={() => setSelectedHabitId(null)} onToggleCheck={(d) => onToggleHabit(selectedHabit.id, d)} onEdit={onUpdateHabit} onDelete={onDeleteHabit} />;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
        <div className="pt-safe px-4 pb-4"><div className="flex justify-between items-center mb-4"><div className="flex items-center gap-2"><button onClick={onMenuClick} className="md:hidden"><Menu/></button><h1 className="text-2xl font-bold dark:text-white">Habits</h1></div><button onClick={onOpenStats}><Activity/></button></div><div className="flex gap-2 overflow-x-auto no-scrollbar">{eachDayOfInterval({start: startOfWeek(selectedDate), end: addDays(startOfWeek(selectedDate), 6)}).map(day => <button key={day.toString()} onClick={() => setSelectedDate(day)} className={`flex-1 p-2 rounded-xl text-center ${isSameDay(day, selectedDate) ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800'}`}><div className="text-xs">{format(day, 'EEE')}</div><div className="font-bold">{format(day, 'd')}</div></button>)}</div></div>
        <div className="flex-1 overflow-y-auto px-4 pb-32 grid grid-cols-2 gap-4">
            {habits.map(h => {
                const isDone = h.history[format(selectedDate, 'yyyy-MM-dd')]?.completed;
                return <div key={h.id} onClick={() => setSelectedHabitId(h.id)} className={`aspect-square rounded-3xl p-4 flex flex-col justify-between transition-all ${isDone ? 'text-white' : 'bg-white dark:bg-slate-900'}`} style={{backgroundColor: isDone ? h.color : undefined}}><div className="flex justify-between"><span className="text-2xl">{h.icon}</span><button onClick={(e)=>{e.stopPropagation();onToggleHabit(h.id, format(selectedDate, 'yyyy-MM-dd'))}} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${isDone?'bg-white text-black':'border-slate-200'}`}>{isDone && <Check size={16}/>}</button></div><span className="font-bold">{h.name}</span></div>
            })}
            <button onClick={() => setShowAdd(true)} className="aspect-square rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Plus size={32}/></button>
        </div>
        <HabitFormSheet isOpen={showAdd} onClose={() => setShowAdd(false)} onSave={onAddHabit} />
    </div>
  );
};

export default HabitView;
export { HabitStatsView }; // Export named for direct use if needed
