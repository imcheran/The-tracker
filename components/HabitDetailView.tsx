
import React, { useState, useMemo } from 'react';
import { Habit, HabitLog } from '../types';
import { 
  X, ChevronLeft, ChevronRight, MoreVertical, Edit2, Trash2, 
  Share2, CheckCircle2, Calendar as CalendarIcon, Activity, TrendingUp,
  Frown, Meh, Smile, Heart, Check, Circle, Archive, Clock
} from 'lucide-react';
import { 
  format, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, 
  startOfMonth, endOfMonth, getDaysInMonth, isAfter
} from 'date-fns';
import HabitFormSheet from './HabitFormSheet';
import HabitShareModal from './HabitShareModal';

interface HabitDetailViewProps {
  habit: Habit;
  onClose: () => void;
  onToggleCheck: (dateStr: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onStartFocus?: () => void;
  onOpenStats?: () => void;
}

const EMOJIS = [
  { id: 'crying', icon: '😭', value: 1 },
  { id: 'sad', icon: '☹️', value: 2 },
  { id: 'neutral', icon: '😐', value: 3 },
  { id: 'happy', icon: '🙂', value: 4 },
  { id: 'love', icon: '🥰', value: 5 },
];

const HabitDetailView: React.FC<HabitDetailViewProps> = ({ 
    habit, onClose, onToggleCheck, onEdit, onDelete, onStartFocus, onOpenStats
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logStatus, setLogStatus] = useState<'achieved' | 'unachieved'>('achieved');
  const [logMood, setLogMood] = useState<string | undefined>(undefined);
  const [logNote, setLogNote] = useState('');

  const stats = useMemo(() => {
      const currentMonthStr = format(currentMonth, 'yyyy-MM');
      const today = new Date();
      
      const allHistory = Object.entries(habit.history) as [string, HabitLog][];
      const completedHistory = allHistory.filter(([_, val]) => val.completed);
      
      const totalCheckIns = completedHistory.length;
      const monthlyCheckIns = completedHistory.filter(([date]) => date.startsWith(currentMonthStr)).length;

      const isCurrentMonth = isSameMonth(currentMonth, today);
      const daysToCount = isCurrentMonth ? today.getDate() : getDaysInMonth(currentMonth);
      const monthlyRate = daysToCount > 0 ? Math.round((monthlyCheckIns / daysToCount) * 100) : 0;

      let currentStreak = 0;
      let d = new Date();
      while (true) {
          const dStr = format(d, 'yyyy-MM-dd');
          if (habit.history[dStr]?.completed) {
              currentStreak++;
              d.setDate(d.getDate() - 1);
          } else if (isSameDay(d, today) && !habit.history[dStr]?.completed) {
              d.setDate(d.getDate() - 1);
          } else {
              break;
          }
      }

      return { totalCheckIns, monthlyCheckIns, monthlyRate, currentStreak };
  }, [habit.history, currentMonth]);

  const handleDateClick = (date: Date) => {
      if (isAfter(date, new Date())) return;

      const dateStr = format(date, 'yyyy-MM-dd');
      const existingLog = habit.history[dateStr];

      setSelectedDate(date);
      setLogStatus(existingLog?.completed ? 'achieved' : 'unachieved');
      setLogMood(existingLog?.mood);
      setLogNote(existingLog?.note || '');
      setShowLogModal(true);
  };

  const handleSaveLog = () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const newHistory = { ...habit.history };
      
      if (logStatus === 'achieved') {
          newHistory[dateStr] = {
              completed: true,
              timestamp: Date.now(),
              mood: logMood,
              note: logNote
          };
      } else {
          if (newHistory[dateStr]) delete newHistory[dateStr];
      }

      onEdit({ ...habit, history: newHistory });
      setShowLogModal(false);
  };

  const renderCalendar = () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const startDay = monthStart.getDay(); 
      const padding = Array(startDay).fill(null);

      return (
          <div className="bg-[#1c1c1e] rounded-3xl p-5 mb-6">
              <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"><ChevronLeft size={20}/></button>
                  <span className="font-bold text-white text-lg">{format(currentMonth, 'MMMM')}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors"><ChevronRight size={20}/></button>
              </div>
              
              <div className="grid grid-cols-7 text-center mb-4">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div key={d} className="text-xs font-medium text-slate-500">{d}</div>
                  ))}
              </div>

              <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                  {padding.map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isCompleted = habit.history[dateStr]?.completed;
                      const isFuture = isAfter(day, new Date());
                      const isSelected = isSameDay(day, selectedDate) && showLogModal;

                      return (
                          <div key={dateStr} className="flex justify-center">
                              <button
                                  onClick={() => handleDateClick(day)}
                                  disabled={isFuture}
                                  className={`
                                      w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all relative
                                      ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c1e]' : ''}
                                      ${isCompleted 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-slate-400 hover:bg-white/5'
                                      }
                                      ${isFuture ? 'opacity-30 cursor-default' : ''}
                                  `}
                              >
                                  {format(day, 'd')}
                              </button>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const renderStats = () => (
      <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Check-ins Statistics</h3>
              {onOpenStats && (
                  <button 
                    onClick={onOpenStats}
                    className="text-sm text-slate-400 flex items-center gap-1 hover:text-white transition-colors"
                  >
                      More <ChevronRight size={14}/>
                  </button>
              )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1c1c1e] p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={12} /></div>
                      <span className="text-xs text-slate-400">Monthly check-ins</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{stats.monthlyCheckIns}</span>
                      <span className="text-xs text-slate-500 font-bold">Day{stats.monthlyCheckIns !== 1 ? 's' : ''}</span>
                  </div>
              </div>
              <div className="bg-[#1c1c1e] p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center"><CalendarIcon size={12} /></div>
                      <span className="text-xs text-slate-400">Total check-ins</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{stats.totalCheckIns}</span>
                      <span className="text-xs text-slate-500 font-bold">Day{stats.totalCheckIns !== 1 ? 's' : ''}</span>
                  </div>
              </div>
              <div className="bg-[#1c1c1e] p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center"><Activity size={12} /></div>
                      <span className="text-xs text-slate-400">Monthly check-in rate</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{stats.monthlyRate}</span>
                      <span className="text-xs text-slate-500 font-bold">%</span>
                  </div>
              </div>
              <div className="bg-[#1c1c1e] p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center"><TrendingUp size={12} /></div>
                      <span className="text-xs text-slate-400">Streak ⇌</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-white">{stats.currentStreak}</span>
                      <span className="text-xs text-slate-500 font-bold">Day{stats.currentStreak !== 1 ? 's' : ''}</span>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <>
        <div className="fixed inset-0 z-[60] bg-black text-white flex flex-col animate-in slide-in-from-right duration-300">
            {/* Top Bar with Safe Area */}
            <div className="pt-safe bg-black shrink-0 z-10">
                <div className="h-16 flex items-center justify-between px-4">
                    <button onClick={onClose} className="flex items-center gap-2 p-2 -ml-2 text-slate-200 hover:text-white rounded-full">
                        <ChevronLeft size={24} />
                        <span className="font-bold text-lg">{habit.name}</span>
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full">
                            <MoreVertical size={24} />
                        </button>
                        
                        {/* Dark Popover Menu */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)}/>
                                <div className="absolute top-10 right-0 w-48 bg-[#2c2c2e] rounded-xl shadow-2xl border border-white/10 z-30 py-2 overflow-hidden animate-in zoom-in-95">
                                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-medium text-slate-200 flex items-center gap-3">
                                        <Edit2 size={18} className="text-slate-400" /> Edit
                                    </button>
                                    <button onClick={() => { if(onStartFocus) onStartFocus(); setShowMenu(false); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-medium text-slate-200 flex items-center gap-3">
                                        <Clock size={18} className="text-slate-400" /> Start Focus
                                    </button>
                                    <button onClick={() => { setShowShareModal(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-medium text-slate-200 flex items-center gap-3">
                                        <Share2 size={18} className="text-slate-400" /> Share
                                    </button>
                                    <button onClick={() => { setShowMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-medium text-slate-200 flex items-center gap-3">
                                        <Archive size={18} className="text-slate-400" /> Archive
                                    </button>
                                    <button onClick={() => { onDelete(habit.id); onClose(); }} className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm font-medium text-slate-200 flex items-center gap-3">
                                        <Trash2 size={18} className="text-slate-400" /> Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-20">
                {renderCalendar()}
                {renderStats()}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">Habit Log on {format(currentMonth, 'MMMM')}</h3>
                    <div className="bg-[#1c1c1e] rounded-2xl p-6 min-h-[100px] flex items-center justify-center">
                        <p className="text-slate-500 text-sm text-center w-full">No check-in thoughts to share this month yet</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Log Modal */}
        {showLogModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
                <div className="bg-[#1c1c1e] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <div className="p-6">
                        <div className="text-center text-slate-400 font-medium mb-6">{format(selectedDate, 'EEE, MMM d')}</div>
                        <div className="space-y-4 mb-8">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${logStatus === 'achieved' ? 'border-blue-500' : 'border-slate-600'}`}>
                                    {logStatus === 'achieved' && <div className="w-3 h-3 bg-blue-500 rounded-full"/>}
                                </div>
                                <span className="text-white font-medium">Achieved</span>
                                <input type="radio" className="hidden" checked={logStatus === 'achieved'} onChange={() => setLogStatus('achieved')} />
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${logStatus === 'unachieved' ? 'border-blue-500' : 'border-slate-600'}`}>
                                    {logStatus === 'unachieved' && <div className="w-3 h-3 bg-blue-500 rounded-full"/>}
                                </div>
                                <span className="text-white font-medium">Unachieved</span>
                                <input type="radio" className="hidden" checked={logStatus === 'unachieved'} onChange={() => setLogStatus('unachieved')} />
                            </label>
                        </div>
                        {logStatus === 'achieved' && (
                            <div className="flex justify-between mb-6">
                                {EMOJIS.map(item => (
                                    <button key={item.id} onClick={() => setLogMood(item.id)} className={`text-3xl transition-transform ${logMood === item.id ? 'scale-125' : 'opacity-50'}`}>{item.icon}</button>
                                ))}
                            </div>
                        )}
                        <textarea value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="What do you have in mind?" className="w-full bg-[#2c2c2e] text-white p-4 rounded-2xl h-32 outline-none resize-none placeholder:text-slate-500 text-sm"/>
                    </div>
                    <div className="flex border-t border-white/10">
                        <button onClick={() => setShowLogModal(false)} className="flex-1 py-4 text-blue-500 font-bold hover:bg-white/5">Cancel</button>
                        <div className="w-px bg-white/10"></div>
                        <button onClick={handleSaveLog} className="flex-1 py-4 text-blue-500 font-bold hover:bg-white/5">Save</button>
                    </div>
                </div>
            </div>
        )}

        <HabitFormSheet isOpen={isEditing} onClose={() => setIsEditing(false)} onSave={(updated) => { onEdit(updated); setIsEditing(false); }} initialData={habit} />
        <HabitShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} habit={habit} />
    </>
  );
};

export default HabitDetailView;
