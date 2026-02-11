
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Menu, Clock, Target, Trees, Sprout, Flower2, TreePine, TreeDeciduous, Umbrella, Ghost, Store, AlertTriangle, Leaf, X, Zap, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, TrendingUp, Share2 } from 'lucide-react';
import { FocusCategory, Task, FocusSession } from '../types';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays, startOfYear, endOfYear, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, subWeeks, subYears } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getProductivityTips } from '../services/geminiService';

// --- FocusStatsView ---
const FocusStatsView: React.FC<{ sessions: FocusSession[]; onClose: () => void }> = ({ sessions, onClose }) => {
  const stats = useMemo(() => ({ total: sessions.reduce((acc, s) => acc + s.duration, 0), count: sessions.length }), [sessions]);
  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col pt-safe animate-in slide-in-from-bottom">
        <div className="h-16 flex items-center justify-between px-4"><button onClick={onClose}><X/></button><span className="font-bold">Stats</span><Share2/></div>
        <div className="p-6"><div className="text-4xl font-bold mb-2">{Math.floor(stats.total / 60)}h {stats.total % 60}m</div><div className="text-slate-400">{stats.count} Sessions</div></div>
    </div>
  );
};

// --- FocusView (Main) ---
const TREES = [{ id: 'sprout', name: 'Sprout', price: 0, icon: Sprout, color: '#4ade80', bg: 'from-emerald-100 to-emerald-50 dark:from-emerald-950 dark:to-slate-950' }, { id: 'pine', name: 'Pine', price: 0, icon: TreePine, color: '#059669', bg: 'from-green-100 to-green-50 dark:from-green-950 dark:to-slate-950' }];
const FocusView: React.FC<{ categories: FocusCategory[]; onAddCategory: (c: FocusCategory) => void; activeTask?: Task; onFocusComplete: (s: FocusSession) => void; onMenuClick?: () => void; focusSessions: FocusSession[]; unlockedTrees?: string[]; onUnlockTree?: (id: string) => void; }> = ({ categories, activeTask, onFocusComplete, onMenuClick, focusSessions, unlockedTrees = ['sprout', 'pine'], onUnlockTree }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); const [isActive, setIsActive] = useState(false); const [showStats, setShowStats] = useState(false);
  useEffect(() => { let interval: any; if (isActive && timeLeft > 0) interval = setInterval(() => setTimeLeft(t => t - 1), 1000); else if (timeLeft === 0 && isActive) { setIsActive(false); onFocusComplete({ id: Date.now().toString(), duration: 25, timestamp: new Date(), status: 'completed' }); } return () => clearInterval(interval); }, [isActive, timeLeft]);
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="pt-safe p-4 flex justify-between"><button onClick={onMenuClick} className="md:hidden"><Menu/></button><button onClick={() => setShowStats(true)}><BarChart3/></button></div>
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-8xl font-black mb-8 font-mono">{formatTime(timeLeft)}</div>
            <button onClick={() => setIsActive(!isActive)} className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xl">{isActive ? <Pause size={32}/> : <Play size={32} ml-1/>}</button>
        </div>
        {showStats && <FocusStatsView sessions={focusSessions} onClose={() => setShowStats(false)} />}
    </div>
  );
};
export default FocusView;
