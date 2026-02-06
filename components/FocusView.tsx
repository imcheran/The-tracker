import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Menu, Clock, 
  Target, Volume2, CloudRain, Waves, Trees, Flame, 
  Sprout, Flower2, TreePine, TreeDeciduous, Umbrella, Ghost, Lock, Store, AlertTriangle, Coffee, Leaf, Music2, X, Zap, BarChart3, CheckCircle2
} from 'lucide-react';
import { FocusCategory, Task, FocusSession } from '../types';
import { getProductivityTips } from '../services/geminiService';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { loadFromStorage, saveToStorage } from '../services/storageService';
import FocusStatsView from './FocusStatsView';

interface FocusViewProps {
  categories: FocusCategory[];
  onAddCategory: (category: FocusCategory) => void;
  activeTask?: Task;
  onFocusComplete: (session: FocusSession) => void;
  onMenuClick?: () => void;
  focusSessions: FocusSession[];
  unlockedTrees?: string[];
  onUnlockTree?: (treeId: string) => void;
}

type FocusTab = 'timer' | 'forest' | 'store';

const TREES = [
  { id: 'sprout', name: 'Sprout', price: 0, icon: Sprout, color: '#4ade80', bg: 'bg-emerald-50 dark:bg-emerald-950', accent: 'text-emerald-500', unlockDesc: 'Free' },
  { id: 'pine', name: 'Pine', price: 0, icon: TreePine, color: '#059669', bg: 'bg-green-50 dark:bg-green-950', accent: 'text-green-600', unlockDesc: 'Free' },
  { id: 'deciduous', name: 'Oak', price: 200, icon: TreeDeciduous, color: '#16a34a', bg: 'bg-lime-50 dark:bg-lime-950', accent: 'text-lime-600', unlockDesc: 'Focus 4h total' },
  { id: 'palm', name: 'Jungle', price: 400, icon: Trees, color: '#0d9488', bg: 'bg-teal-50 dark:bg-teal-950', accent: 'text-teal-600', unlockDesc: 'Focus 8h total' }, 
  { id: 'flower', name: 'Rose', price: 600, icon: Flower2, color: '#db2777', bg: 'bg-pink-50 dark:bg-pink-950', accent: 'text-pink-500', unlockDesc: '3 Day Streak' },
  { id: 'willow', name: 'Willow', price: 800, icon: Umbrella, color: '#0891b2', bg: 'bg-cyan-50 dark:bg-cyan-950', accent: 'text-cyan-500', unlockDesc: 'Focus 12h total' },
  { id: 'money', name: 'Gold', price: 1000, icon: Leaf, color: '#eab308', bg: 'bg-yellow-50 dark:bg-yellow-950', accent: 'text-yellow-500', unlockDesc: 'Master of Focus' },
];

const BACKGROUND_SOUNDS = [
    { id: 'none', name: 'Silent', icon: <Volume2 size={24}/> },
    { id: 'rain', name: 'Rain', icon: <CloudRain size={24}/> },
    { id: 'forest', name: 'Forest', icon: <Trees size={24}/> },
    { id: 'ocean', name: 'Ocean', icon: <Waves size={24}/> },
    { id: 'fire', name: 'Bonfire', icon: <Flame size={24}/> },
    { id: 'cafe', name: 'Cafe', icon: <Coffee size={24}/> },
];

const TIMER_PRESETS = [25, 35, 50];
const DAILY_GOAL_MINUTES = 120; // 2 Hours default goal

const FocusView: React.FC<FocusViewProps> = ({ 
    categories, activeTask, onFocusComplete, onMenuClick, focusSessions = [], 
    unlockedTrees = ['sprout', 'pine'], onUnlockTree 
}) => {
  const [activeTab, setActiveTab] = useState<FocusTab>('timer');
  const [selectedCategory, setSelectedCategory] = useState<FocusCategory | null>(() => categories.length > 0 ? categories[0] : null);
  const [selectedTreeId, setSelectedTreeId] = useState('pine');
  
  // Timer State
  const [initialTime, setInitialTime] = useState(25 * 60); 
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [isDeepFocus, setIsDeepFocus] = useState(false);
  const [isWithered, setIsWithered] = useState(false);
  const [giveUpMode, setGiveUpMode] = useState(false);
  
  // Tip State
  const [tip, setTip] = useState<string>('');
  
  // Sound State
  const [backgroundSound, setBackgroundSound] = useState<string>('none');
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  
  // Stats Modal
  const [showStats, setShowStats] = useState(false);
  
  // Deep Focus Refs
  const deepFocusTimeout = useRef<any>(null);

  // Restore active session on mount
  useEffect(() => {
      const savedSession = loadFromStorage('focus_active_session', null);
      if (savedSession && savedSession.endTime) {
          const remaining = Math.floor((savedSession.endTime - Date.now()) / 1000);
          if (remaining > 0) {
              setInitialTime(savedSession.initialTime);
              setEndTime(savedSession.endTime);
              setTimeLeft(remaining);
              setIsActive(true);
              setIsDeepFocus(savedSession.isDeepFocus);
              setSelectedTreeId(savedSession.treeId);
          } else {
              localStorage.removeItem('focus_active_session');
          }
      }
  }, []);

  // Computed Data
  const totalCoinsEarned = useMemo(() => 
    focusSessions.reduce((acc, s) => acc + (s.status === 'completed' ? (s.coinsEarned || Math.floor(s.duration)) : 0), 0), 
  [focusSessions]);
  
  const totalCoinsSpent = useMemo(() => 
    TREES.filter(t => unlockedTrees.includes(t.id) && t.price > 0).reduce((acc, t) => acc + t.price, 0),
  [unlockedTrees]);
  
  const currentCoins = totalCoinsEarned - totalCoinsSpent;

  // Daily Progress Calculation
  const todayMinutes = useMemo(() => {
      return focusSessions
        .filter(s => s.status === 'completed' && isToday(new Date(s.timestamp)))
        .reduce((acc, s) => acc + s.duration, 0);
  }, [focusSessions]);

  // -- Effects --

  useEffect(() => {
      if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]);
  }, [categories]);

  // Deep Focus Listener
  useEffect(() => {
      const handleVisibilityChange = () => {
          if (!isActive || !isDeepFocus || isWithered || isPaused) return;

          if (document.hidden) {
              if (Notification.permission === 'granted') {
                  new Notification("Return to Forest!", { body: "Your tree is withering!", icon: "/favicon.ico" });
              }
              // 10 second grace period
              deepFocusTimeout.current = setTimeout(() => {
                  failSession("Left app");
              }, 10000); 
          } else {
              if (deepFocusTimeout.current) {
                  clearTimeout(deepFocusTimeout.current);
                  deepFocusTimeout.current = null;
              }
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (deepFocusTimeout.current) clearTimeout(deepFocusTimeout.current);
      };
  }, [isActive, isDeepFocus, isWithered, isPaused]);

  // Real-time Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused && !isWithered && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((endTime - now) / 1000);
        
        if (diff <= 0) {
            setTimeLeft(0);
            completeSession();
        } else {
            setTimeLeft(diff);
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, isWithered, endTime]);

  // Start Session
  const startSession = () => {
      const end = Date.now() + timeLeft * 1000;
      setEndTime(end);
      setIsActive(true);
      setIsPaused(false);
      setIsWithered(false);
      
      saveToStorage('focus_active_session', {
          initialTime,
          endTime: end,
          isDeepFocus,
          treeId: selectedTreeId,
          startTime: Date.now()
      });
      
      getProductivityTips(Math.floor(initialTime / 60), 5).then(setTip);
  };

  const pauseSession = () => {
      setIsPaused(true);
      setEndTime(null);
      // Remove from storage to prevent background counting
      localStorage.removeItem('focus_active_session');
  };

  const completeSession = () => {
      setIsActive(false);
      setIsWithered(false);
      setIsPaused(false);
      setEndTime(null);
      localStorage.removeItem('focus_active_session');
      
      const durationMins = Math.floor(initialTime / 60);
      const earned = durationMins; 
      
      const session: FocusSession = {
          id: Date.now().toString(),
          duration: durationMins,
          timestamp: new Date(),
          taskId: activeTask?.id,
          taskTitle: activeTask?.title,
          categoryId: selectedCategory?.id,
          status: 'completed',
          treeId: selectedTreeId,
          coinsEarned: earned
      };
      
      onFocusComplete(session);
      setTimeLeft(initialTime);
  };

  const failSession = (reason: string) => {
      setIsActive(false);
      setIsWithered(true);
      setEndTime(null);
      localStorage.removeItem('focus_active_session');
      
      const session: FocusSession = {
          id: Date.now().toString(),
          duration: Math.floor((initialTime - timeLeft) / 60),
          timestamp: new Date(),
          taskId: activeTask?.id,
          categoryId: selectedCategory?.id,
          status: 'failed',
          treeId: selectedTreeId,
          coinsEarned: 0
      };
      
      onFocusComplete(session);
  };

  const handleGiveUp = () => {
      setGiveUpMode(true);
  };

  const confirmGiveUp = () => {
      failSession("Gave up");
      setGiveUpMode(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedTree = TREES.find(t => t.id === selectedTreeId) || TREES[0];
  const progress = 1 - (timeLeft / initialTime);

  // --- Renderers ---

  const renderTimer = () => (
      <div className={`flex-1 flex flex-col items-center relative w-full p-4 animate-in fade-in transition-colors duration-700 ${selectedTree.bg}`}>
          
          {/* Top Info Bar */}
          <div className="absolute top-2 left-0 right-0 px-4 flex justify-between items-start z-20">
              {/* Daily Goal (Corner) */}
              {!isActive && (
                  <div className="bg-white/40 dark:bg-black/20 backdrop-blur-md rounded-xl p-2 flex flex-col items-center">
                      <div className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-300 flex items-center gap-1">
                          Today <Target size={10} />
                      </div>
                      <div className="flex items-end gap-1 leading-none mt-1">
                          <span className="text-sm font-black text-slate-800 dark:text-white">{Math.floor(todayMinutes/60)}h {todayMinutes%60}m</span>
                          <span className="text-[9px] font-bold text-slate-500">/ 2h</span>
                      </div>
                  </div>
              )}

              {/* Deep Focus Toggle */}
              {!isActive && (
                  <button 
                      onClick={() => setIsDeepFocus(!isDeepFocus)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isDeepFocus ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white/40 text-slate-600 border-transparent dark:bg-black/20 dark:text-slate-300'}`}
                  >
                      {isDeepFocus ? <Lock size={10} /> : <Lock size={10} className="opacity-50"/>}
                      <span>Deep Mode</span>
                  </button>
              )}
          </div>

          {/* Active Task Pill (Centered) */}
          {activeTask && (
              <div className="mt-8 bg-white/80 dark:bg-black/40 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/10 rounded-full pl-2 pr-4 py-1.5 flex items-center gap-2 max-w-[80%] z-10">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 size={10} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{activeTask.title}</span>
              </div>
          )}

          {/* Main Visual Area */}
          <div className="flex-1 flex flex-col items-center justify-center w-full relative min-h-0">
              
              {/* Timer Circle */}
              <div className="relative w-[50vmin] h-[50vmin] max-w-[280px] max-h-[280px] min-w-[220px] min-h-[220px] flex items-center justify-center">
                  {/* Progress Ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-xl overflow-visible">
                      <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="10" className="text-white/20 dark:text-black/10" />
                      <circle 
                          cx="50%" cy="50%" r="48%" fill="none" stroke={selectedTree.color} strokeWidth="10" 
                          strokeDasharray={2 * Math.PI * (140 * 0.96)} // approx based on radius
                          strokeDashoffset={2 * Math.PI * (140 * 0.96) * (1 - progress)}
                          strokeLinecap="round"
                          className={`transition-all duration-1000 ease-linear ${!isActive ? 'opacity-0' : ''}`}
                      />
                  </svg>

                  {/* Tree Visualization */}
                  <div className="z-10 flex flex-col items-center justify-center relative">
                      <div 
                        className={`transition-all duration-1000 ${isActive ? 'scale-100' : 'hover:scale-110 cursor-pointer'} ${isActive && !isPaused ? 'animate-pulse-slow' : ''}`} 
                        style={{ transform: isActive ? `scale(${0.6 + 0.4 * progress})` : 'scale(1)' }}
                      >
                          {isWithered ? (
                              <Ghost size={100} className="text-slate-400 dark:text-slate-600 drop-shadow-lg" />
                          ) : isActive && progress < 0.1 ? (
                              <Sprout size={60} className="text-emerald-500 animate-bounce drop-shadow-lg" />
                          ) : (
                              <div className="drop-shadow-2xl filter saturate-150">
                                  <selectedTree.icon size={100} style={{ color: selectedTree.color }} />
                              </div>
                          )}
                      </div>
                      
                      {/* Timer Text */}
                      <div className="mt-6 text-5xl font-black font-sans text-slate-800 dark:text-white tracking-tighter tabular-nums drop-shadow-sm mix-blend-overlay opacity-90">
                          {formatTime(timeLeft)}
                      </div>
                  </div>
              </div>
              
              {/* Context Label */}
              <div className="h-10 mt-6 flex items-center justify-center">
                  {isActive ? (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center max-w-[200px] animate-fade-in px-4">
                          {timeLeft < 300 ? <span className="text-orange-500 font-bold">Stay focused!</span> : `"${tip}"`}
                      </p>
                  ) : (
                      <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                          <div className={`w-2 h-2 rounded-full ${selectedTree.bg.replace('bg-', 'bg-').replace('50', '500')}`}></div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Plant a {selectedTree.name}</span>
                      </div>
                  )}
              </div>
          </div>

          {/* Controls Area (Bottom Fixed Height) */}
          <div className="w-full max-w-sm flex flex-col gap-4 pb-safe z-20 shrink-0">
              {isActive ? (
                  <div className="flex items-center gap-4 justify-center pb-6">
                      <button 
                          onClick={handleGiveUp}
                          className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                      >
                          <X size={24} strokeWidth={3} />
                      </button>
                      <button 
                          onClick={isPaused ? startSession : pauseSession}
                          className="flex-1 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-slate-800 dark:text-white font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                          {isPaused ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
                          <span>{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                  </div>
              ) : (
                  <>
                      {/* Tree Carousel */}
                      <div className="bg-white/60 dark:bg-black/20 p-2 rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm">
                          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
                              {TREES.filter(t => unlockedTrees.includes(t.id)).map(tree => (
                                  <button
                                      key={tree.id}
                                      onClick={() => setSelectedTreeId(tree.id)}
                                      className={`
                                          flex-shrink-0 snap-center p-2 rounded-xl flex flex-col items-center gap-1 min-w-[60px] transition-all border-2
                                          ${selectedTreeId === tree.id ? `bg-white dark:bg-slate-800 ${tree.accent.replace('text-', 'border-')} shadow-md scale-105` : 'border-transparent hover:bg-white/40 dark:hover:bg-white/10'}
                                      `}
                                  >
                                      <tree.icon size={24} style={{ color: tree.color }} />
                                      <span className={`text-[9px] font-bold ${selectedTreeId === tree.id ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{tree.name}</span>
                                  </button>
                              ))}
                              <button onClick={() => setActiveTab('store')} className="flex-shrink-0 snap-center p-2 rounded-xl flex flex-col items-center justify-center gap-1 min-w-[60px] bg-white/40 dark:bg-white/5 border-2 border-transparent hover:border-slate-200 transition-all text-slate-400">
                                  <Store size={20} />
                                  <span className="text-[9px] font-bold">Store</span>
                              </button>
                          </div>
                      </div>

                      {/* Time Slider & Presets */}
                      <div className="bg-white/60 dark:bg-black/20 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm">
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                              <div className="text-xl font-black text-slate-800 dark:text-white tabular-nums">
                                  {Math.floor(initialTime / 60)}<span className="text-xs font-bold text-slate-400 ml-0.5">min</span>
                              </div>
                          </div>
                          <input 
                              type="range" 
                              min="10" 
                              max="120" 
                              step="5" 
                              value={initialTime / 60} 
                              onChange={(e) => { 
                                  const val = Number(e.target.value) * 60;
                                  setInitialTime(val);
                                  setTimeLeft(val);
                              }}
                              className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-slate-900 dark:accent-white mb-3"
                          />
                          <div className="flex justify-between">
                              {TIMER_PRESETS.map(m => (
                                  <button 
                                    key={m} 
                                    onClick={() => { setInitialTime(m*60); setTimeLeft(m*60); }}
                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${Math.floor(initialTime/60) === m ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md' : 'bg-white/50 text-slate-600 hover:bg-white dark:bg-black/20 dark:text-slate-400'}`}
                                  >
                                      {m}m
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Plant Button */}
                      <button 
                          onClick={startSession}
                          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-2"
                      >
                          <Zap size={20} fill="currentColor" />
                          Start Focus
                      </button>
                  </>
              )}
          </div>

          {/* Give Up Modal */}
          {giveUpMode && (
              <div className="absolute inset-0 z-50 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl max-w-xs w-full text-center border border-white/20">
                      <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                          <AlertTriangle size={40} className="text-red-500"/>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Give up?</h3>
                      <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
                          Your <span className="text-emerald-600 font-bold">{selectedTree.name}</span> will wither if you stop now.
                      </p>
                      <div className="flex flex-col gap-3">
                          <button onClick={() => setGiveUpMode(false)} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-lg">Keep Focusing</button>
                          <button onClick={confirmGiveUp} className="w-full py-4 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors">I Give Up</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

  const renderForest = () => {
      const validSessions = focusSessions.filter(s => s.status === 'completed' || s.status === 'failed').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const dailyGoalProgress = Math.min(100, Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100));
      
      const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
      const endOfCurrentWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });
      
      return (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in slide-in-from-right bg-slate-50 dark:bg-slate-950">
              
              {/* Dashboard Card */}
              <div className="bg-[#1a4731] dark:bg-emerald-950 rounded-[32px] p-6 text-white mb-8 relative overflow-hidden shadow-xl shadow-emerald-900/20">
                  <div className="relative z-10 flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 flex items-center gap-2"><Target size={14}/> Daily Goal</div>
                              <div className="text-3xl font-black tracking-tight mb-1">
                                  {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m 
                                  <span className="text-lg text-emerald-400/60 font-medium ml-2">/ 2h</span>
                              </div>
                              <p className="text-xs text-emerald-200/70 font-medium">Keep growing your forest!</p>
                          </div>
                          
                          {/* Circular Progress */}
                          <div className="relative w-16 h-16 flex items-center justify-center">
                              <svg className="absolute inset-0 w-full h-full -rotate-90">
                                  <circle cx="50%" cy="50%" r="40%" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                                  <circle 
                                      cx="50%" cy="50%" r="40%" fill="none" stroke="#34d399" strokeWidth="6" 
                                      strokeDasharray={2 * Math.PI * 25} // approx
                                      strokeDashoffset={2 * Math.PI * 25 * (1 - dailyGoalProgress/100)}
                                      strokeLinecap="round"
                                  />
                              </svg>
                              <span className="text-xs font-bold">{dailyGoalProgress}%</span>
                          </div>
                      </div>

                      {/* Weekly Streak */}
                      <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-emerald-200 uppercase">Weekly Streak</span>
                              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">
                                  {validSessions.length} sessions
                              </span>
                          </div>
                          <div className="flex justify-between">
                              {days.map(day => {
                                  const dayStr = format(day, 'EEE').charAt(0);
                                  const hasActivity = focusSessions.some(s => s.status === 'completed' && isSameDay(new Date(s.timestamp), day));
                                  return (
                                      <div key={day.toString()} className="flex flex-col items-center gap-1">
                                          <div className={`w-2 h-2 rounded-full ${hasActivity ? 'bg-emerald-400' : 'bg-white/10'}`} />
                                          <span className="text-[9px] text-white/40 font-bold">{dayStr}</span>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>
                  
                  {/* Decorative */}
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3 px-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <Clock size={18} />
                  </div>
                  Recent Growth
              </h3>

              {validSessions.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800 mx-2">
                      <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                          <Sprout size={32} />
                      </div>
                      <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Plant your first tree</p>
                      <button onClick={() => setActiveTab('timer')} className="mt-4 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full">Start 25m Session</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 gap-3 pb-20">
                      {validSessions.map(session => {
                          const tree = TREES.find(t => t.id === session.treeId) || TREES[0];
                          const isDead = session.status === 'failed';
                          return (
                              <div key={session.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-800">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                                      {isDead ? (
                                          <Ghost size={24} className="text-slate-400" />
                                      ) : (
                                          <tree.icon size={28} style={{ color: tree.color }} />
                                      )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{session.taskTitle || (isDead ? "Withered Tree" : tree.name)}</div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                          <span>{format(new Date(session.timestamp), 'h:mm a')}</span>
                                          <span>•</span>
                                          <span className={isDead ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}>
                                              {isDead ? 'Failed' : `+${session.duration} mins`}
                                          </span>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  const renderStore = () => (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 animate-in slide-in-from-right bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col gap-6 mb-8 px-2 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md z-10 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <Store size={28} className="text-orange-500"/> Tree Store
                  </h2>
                  <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white pl-2 pr-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
                          <Leaf size={12} className="text-yellow-900" />
                      </div>
                      {currentCoins}
                  </div>
              </div>
              
              {/* Collection Progress */}
              <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                      <span>Collection</span>
                      <span>{unlockedTrees.length} / {TREES.length}</span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 transition-all duration-1000" style={{ width: `${(unlockedTrees.length / TREES.length) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">Complete focus sessions to earn coins and unlock trees!</p>
              </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
              {TREES.map(tree => {
                  const isUnlocked = unlockedTrees.includes(tree.id);
                  const canAfford = currentCoins >= tree.price;

                  return (
                      <div key={tree.id} className={`p-6 rounded-[28px] border transition-all relative overflow-hidden group ${isUnlocked ? 'bg-white dark:bg-slate-900 border-white/50 dark:border-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-900/50 border-transparent opacity-90'}`}>
                          {/* Background Glow */}
                          <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${tree.bg.replace('bg-', 'bg-').replace('50', '400')}`}></div>

                          <div className="flex justify-center mb-8 mt-4 scale-110 group-hover:scale-125 transition-transform duration-500 relative z-10">
                              <tree.icon size={80} style={{ color: isUnlocked ? tree.color : '#94a3b8' }} className={!isUnlocked ? 'grayscale opacity-50' : 'drop-shadow-lg'} />
                          </div>
                          
                          <div className="flex flex-col gap-3 relative z-10">
                              <div className="flex justify-between items-center">
                                  <div className="font-bold text-lg text-slate-900 dark:text-white">{tree.name}</div>
                                  <div className={`text-xs font-bold px-2 py-1 rounded-lg ${tree.price > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                      {tree.price > 0 ? `${tree.price}` : 'Free'}
                                  </div>
                              </div>
                              
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {isUnlocked ? "Added to your forest" : tree.unlockDesc}
                              </div>
                              
                              {isUnlocked ? (
                                  <button disabled className="w-full py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                                      <CheckCircle2 size={14} /> Collected
                                  </button>
                              ) : (
                                  <button 
                                      disabled={!canAfford}
                                      onClick={() => onUnlockTree && onUnlockTree(tree.id)}
                                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${canAfford ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                  >
                                      {canAfford ? 'Unlock Now' : 'Not enough coins'}
                                  </button>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
  );

  return (
    <div className="flex-1 h-full flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header - Safe Area Wrapper */}
      <div className="pt-safe shrink-0 z-30">
          <div className="min-h-16 pb-2 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                   {onMenuClick && (
                       <button onClick={onMenuClick} className="p-3 -ml-2 rounded-full transition-all hover:bg-white hover:shadow-sm dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                           <Menu size={22} />
                       </button>
                   )}
                   {/* Custom Segmented Control */}
                   <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl backdrop-blur-sm">
                       {(['timer', 'forest', 'store'] as const).map(tab => (
                           <button 
                               key={tab}
                               onClick={() => setActiveTab(tab)} 
                               className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-300 ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md transform scale-105' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                           >
                               {tab}
                           </button>
                       ))}
                   </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <button 
                      onClick={() => setShowStats(true)} 
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                      <BarChart3 size={20} />
                  </button>
                  {activeTab === 'timer' && (
                      <button 
                        onClick={() => setShowSoundPicker(true)} 
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${backgroundSound !== 'none' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white dark:bg-slate-800 text-slate-400 shadow-sm'}`}
                      >
                          {backgroundSound !== 'none' ? <Volume2 size={20} className="animate-pulse" /> : <Volume2 size={20} />}
                      </button>
                  )}
              </div>
          </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {activeTab === 'timer' && renderTimer()}
        {activeTab === 'forest' && renderForest()}
        {activeTab === 'store' && renderStore()}
      </div>

      {/* Sound Picker Overlay */}
      {showSoundPicker && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in" onClick={() => setShowSoundPicker(false)}>
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 border border-white/20" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2"><Music2 size={22} className="text-emerald-500"/> Soundscapes</h3>
                      <button onClick={() => setShowSoundPicker(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"><X size={18}/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                      {BACKGROUND_SOUNDS.map(sound => (
                          <button
                              key={sound.id}
                              onClick={() => setBackgroundSound(sound.id)}
                              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${backgroundSound === sound.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-md' : 'border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                          >
                              {sound.icon}
                              <span className="text-[10px] font-bold uppercase">{sound.name}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Stats View */}
      {showStats && (
          <FocusStatsView sessions={focusSessions} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
};

export default FocusView;