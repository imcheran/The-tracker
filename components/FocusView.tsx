
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, Menu, Clock, 
  Target, Trees, 
  Sprout, Flower2, TreePine, TreeDeciduous, Umbrella, Ghost, Store, AlertTriangle, Leaf, X, Zap, BarChart3, CheckCircle2
} from 'lucide-react';
import { FocusCategory, Task, FocusSession } from '../types';
import { getProductivityTips } from '../services/geminiService';
import { format, isToday } from 'date-fns';
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
  { id: 'sprout', name: 'Sprout', price: 0, icon: Sprout, color: '#4ade80', bg: 'from-emerald-100 to-emerald-50 dark:from-emerald-950 dark:to-slate-950', accent: 'emerald', unlockDesc: 'Free' },
  { id: 'pine', name: 'Pine', price: 0, icon: TreePine, color: '#059669', bg: 'from-green-100 to-green-50 dark:from-green-950 dark:to-slate-950', accent: 'green', unlockDesc: 'Free' },
  { id: 'deciduous', name: 'Oak', price: 200, icon: TreeDeciduous, color: '#16a34a', bg: 'from-lime-100 to-lime-50 dark:from-lime-950 dark:to-slate-950', accent: 'lime', unlockDesc: 'Focus 4h total' },
  { id: 'palm', name: 'Jungle', price: 400, icon: Trees, color: '#0d9488', bg: 'from-teal-100 to-teal-50 dark:from-teal-950 dark:to-slate-950', accent: 'teal', unlockDesc: 'Focus 8h total' }, 
  { id: 'flower', name: 'Rose', price: 600, icon: Flower2, color: '#db2777', bg: 'from-pink-100 to-pink-50 dark:from-pink-950 dark:to-slate-950', accent: 'pink', unlockDesc: '3 Day Streak' },
  { id: 'willow', name: 'Willow', price: 800, icon: Umbrella, color: '#0891b2', bg: 'from-cyan-100 to-cyan-50 dark:from-cyan-950 dark:to-slate-950', accent: 'cyan', unlockDesc: 'Focus 12h total' },
  { id: 'money', name: 'Gold', price: 1000, icon: Leaf, color: '#eab308', bg: 'from-yellow-100 to-yellow-50 dark:from-yellow-950 dark:to-slate-950', accent: 'yellow', unlockDesc: 'Master of Focus' },
];

const TIMER_PRESETS = [10, 25, 35, 50, 60, 90];
const DAILY_GOAL_MINUTES = 120; 

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
  
  const [tip, setTip] = useState<string>('');
  const [showStats, setShowStats] = useState(false);
  
  const deepFocusTimeout = useRef<any>(null);

  // Restore active session & Background check
  useEffect(() => {
      const savedSession = loadFromStorage('focus_active_session', null);
      if (savedSession && savedSession.endTime) {
          const now = Date.now();
          const remaining = Math.floor((savedSession.endTime - now) / 1000);
          
          if (remaining > 0) {
              setInitialTime(savedSession.initialTime);
              setEndTime(savedSession.endTime);
              setTimeLeft(remaining);
              setIsActive(true);
              setIsDeepFocus(savedSession.isDeepFocus);
              setSelectedTreeId(savedSession.treeId);
          } else {
              localStorage.removeItem('focus_active_session');
              const durationMins = Math.floor(savedSession.initialTime / 60);
              const completedSession: FocusSession = {
                  id: `bg-${Date.now()}`,
                  duration: durationMins,
                  timestamp: new Date(savedSession.endTime),
                  taskId: savedSession.taskId,
                  taskTitle: savedSession.taskTitle,
                  categoryId: savedSession.categoryId,
                  status: 'completed',
                  treeId: savedSession.treeId,
                  coinsEarned: durationMins
              };
              onFocusComplete(completedSession);
              setInitialTime(savedSession.initialTime);
              setTimeLeft(savedSession.initialTime);
          }
      }
  }, []);

  const totalCoinsEarned = useMemo(() => 
    focusSessions.reduce((acc, s) => acc + (s.status === 'completed' ? (s.coinsEarned || Math.floor(s.duration)) : 0), 0), 
  [focusSessions]);
  
  const totalCoinsSpent = useMemo(() => 
    TREES.filter(t => unlockedTrees.includes(t.id) && t.price > 0).reduce((acc, t) => acc + t.price, 0),
  [unlockedTrees]);
  
  const currentCoins = totalCoinsEarned - totalCoinsSpent;

  const todayMinutes = useMemo(() => {
      return focusSessions
        .filter(s => (s.status === 'completed' || s.status === 'failed') && isToday(new Date(s.timestamp)))
        .reduce((acc, s) => acc + s.duration, 0);
  }, [focusSessions]);

  useEffect(() => {
      if (categories.length > 0 && !selectedCategory) setSelectedCategory(categories[0]);
  }, [categories]);

  useEffect(() => {
      const handleVisibilityChange = () => {
          if (!isActive || !isDeepFocus || isWithered || isPaused) return;
          if (document.hidden) {
              if (Notification.permission === 'granted') new Notification("Return to Forest!", { body: "Your tree is withering!", icon: "/favicon.ico" });
              deepFocusTimeout.current = setTimeout(() => failSession("Left app"), 10000); 
          } else {
              if (deepFocusTimeout.current) { clearTimeout(deepFocusTimeout.current); deepFocusTimeout.current = null; }
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          if (deepFocusTimeout.current) clearTimeout(deepFocusTimeout.current);
      };
  }, [isActive, isDeepFocus, isWithered, isPaused]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused && !isWithered && endTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.ceil((endTime - now) / 1000);
        if (diff <= 0) { setTimeLeft(0); completeSession(); } else { setTimeLeft(diff); }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, isWithered, endTime]);

  const startSession = () => {
      const end = Date.now() + timeLeft * 1000;
      setEndTime(end);
      setIsActive(true);
      setIsPaused(false);
      setIsWithered(false);
      saveToStorage('focus_active_session', {
          initialTime, endTime: end, isDeepFocus, treeId: selectedTreeId, startTime: Date.now(),
          taskId: activeTask?.id, taskTitle: activeTask?.title, categoryId: selectedCategory?.id
      });
      getProductivityTips(Math.floor(initialTime / 60), 5).then(setTip);
  };

  const pauseSession = () => {
      setIsPaused(true);
      setEndTime(null);
      localStorage.removeItem('focus_active_session');
  };

  const completeSession = () => {
      setIsActive(false); setIsWithered(false); setIsPaused(false); setEndTime(null);
      localStorage.removeItem('focus_active_session');
      const durationMins = Math.floor(initialTime / 60);
      onFocusComplete({
          id: Date.now().toString(), duration: durationMins, timestamp: new Date(),
          taskId: activeTask?.id, taskTitle: activeTask?.title, categoryId: selectedCategory?.id,
          status: 'completed', treeId: selectedTreeId, coinsEarned: durationMins
      });
      setTimeLeft(initialTime);
  };

  const failSession = (reason: string) => {
      setIsActive(false); setIsWithered(true); setEndTime(null);
      localStorage.removeItem('focus_active_session');
      onFocusComplete({
          id: Date.now().toString(), duration: Math.floor((initialTime - timeLeft) / 60), timestamp: new Date(),
          taskId: activeTask?.id, categoryId: selectedCategory?.id,
          status: 'failed', treeId: selectedTreeId, coinsEarned: 0
      });
  };

  const handleGiveUp = () => setGiveUpMode(true);
  const confirmGiveUp = () => { failSession("Gave up"); setGiveUpMode(false); };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectedTree = TREES.find(t => t.id === selectedTreeId) || TREES[0];
  const progress = 1 - (timeLeft / initialTime);

  // --- Renderers ---

  const renderTimer = () => (
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-lg mx-auto">
          
          {/* Main Ring */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
              {/* Outer Glow */}
              {isActive && <div className={`absolute inset-0 rounded-full blur-[60px] opacity-40 animate-pulse-slow`} style={{ backgroundColor: selectedTree.color }} />}
              
              <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible">
                  {/* Track */}
                  <circle cx="50%" cy="50%" r="46%" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-white/5" />
                  {/* Progress */}
                  <circle 
                      cx="50%" cy="50%" r="46%" fill="none" stroke={selectedTree.color} strokeWidth="8" 
                      strokeDasharray={2 * Math.PI * (144 * 0.92)} // Approx for r=46% of 320px
                      strokeDashoffset={2 * Math.PI * (144 * 0.92) * (1 - progress)}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ease-linear ${!isActive ? 'opacity-0' : 'opacity-100'}`}
                  />
              </svg>

              {/* Center Content */}
              <div className="z-10 flex flex-col items-center">
                  <div 
                    className={`transition-all duration-1000 ${isActive ? 'scale-110 mb-4' : 'scale-100 mb-6 group-hover:scale-105'} cursor-pointer`}
                    style={{ transform: isActive ? `scale(${0.8 + 0.4 * progress})` : 'scale(1)' }}
                  >
                      {isWithered ? (
                          <Ghost size={80} className="text-slate-400 dark:text-slate-600 drop-shadow-lg" />
                      ) : isActive && progress < 0.05 ? (
                          <Sprout size={60} className="text-emerald-500 animate-bounce drop-shadow-lg" />
                      ) : (
                          <div className="drop-shadow-2xl filter saturate-150 relative">
                              <selectedTree.icon size={100} style={{ color: selectedTree.color }} />
                          </div>
                      )}
                  </div>
                  
                  <div className={`text-6xl font-black tabular-nums tracking-tighter text-slate-800 dark:text-white transition-all ${isActive ? 'scale-110' : 'scale-100'}`}>
                      {formatTime(timeLeft)}
                  </div>
                  
                  {isActive && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-4 max-w-[200px] text-center animate-fade-in line-clamp-2">
                          {timeLeft < 300 ? <span className="text-orange-500 font-bold">Almost there!</span> : `"${tip}"`}
                      </p>
                  )}
              </div>
          </div>

          {/* Controls (Inactive State) */}
          {!isActive && (
              <div className="w-full mt-10 space-y-8 animate-slide-up">
                  {/* Tree Selector */}
                  <div>
                      <div className="flex justify-between items-center mb-3 px-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Plant</span>
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg">
                              <Leaf size={10} /> {unlockedTrees.length}
                          </div>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2 snap-x">
                          {TREES.filter(t => unlockedTrees.includes(t.id)).map(tree => (
                              <button
                                  key={tree.id}
                                  onClick={() => setSelectedTreeId(tree.id)}
                                  className={`
                                      relative flex-shrink-0 snap-center w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2
                                      ${selectedTreeId === tree.id 
                                          ? `bg-white dark:bg-slate-800 border-${tree.accent}-500 shadow-lg scale-105` 
                                          : 'bg-white/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-white/10'
                                      }
                                  `}
                              >
                                  <tree.icon size={24} style={{ color: tree.color }} />
                                  <span className={`text-[10px] font-bold ${selectedTreeId === tree.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{tree.name}</span>
                                  {selectedTreeId === tree.id && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-current text-slate-900 dark:text-white" />}
                              </button>
                          ))}
                          <button onClick={() => setActiveTab('store')} className="flex-shrink-0 snap-center w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 border-2 border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
                              <Store size={20} />
                              <span className="text-[10px] font-bold">Store</span>
                          </button>
                      </div>
                  </div>

                  {/* Duration Slider */}
                  <div>
                      <div className="flex justify-between items-center mb-4 px-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.floor(initialTime/60)} min</span>
                      </div>
                      <input 
                          type="range" 
                          min="5" 
                          max="180" 
                          step="5" 
                          value={initialTime / 60} 
                          onChange={(e) => { 
                              const val = Number(e.target.value) * 60;
                              setInitialTime(val);
                              setTimeLeft(val);
                          }}
                          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                      />
                      <div className="flex justify-between mt-4 px-1">
                          {TIMER_PRESETS.map(m => (
                              <button 
                                key={m} 
                                onClick={() => { setInitialTime(m*60); setTimeLeft(m*60); }}
                                className={`text-[10px] font-bold py-1 px-2 rounded-lg transition-colors ${Math.floor(initialTime/60) === m ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                              >
                                  {m}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Start Button */}
                  <button 
                      onClick={startSession}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-black text-lg shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                      <Zap size={20} fill="currentColor" />
                      Start Focus
                  </button>
              </div>
          )}

          {/* Controls (Active State) */}
          {isActive && (
              <div className="mt-12 flex items-center gap-6 animate-fade-in">
                  <button 
                      onClick={handleGiveUp}
                      className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors flex items-center justify-center"
                  >
                      <X size={24} strokeWidth={3} />
                  </button>
                  <button 
                      onClick={isPaused ? startSession : pauseSession}
                      className="w-24 h-24 rounded-[32px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                      {isPaused ? <Play size={32} fill="currentColor"/> : <Pause size={32} fill="currentColor"/>}
                  </button>
              </div>
          )}
      </div>
  );

  const renderForest = () => {
      const validSessions = focusSessions.filter(s => s.status === 'completed' || s.status === 'failed').sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 animate-in slide-in-from-right">
              <div className="bg-emerald-900 rounded-[32px] p-6 text-white mb-8 relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                      <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 flex items-center gap-2"><Target size={14}/> Today's Growth</div>
                      <div className="text-4xl font-black tracking-tight mb-4">
                          {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m 
                      </div>
                      <div className="h-1.5 bg-emerald-950/50 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${Math.min(100, (todayMinutes / DAILY_GOAL_MINUTES) * 100)}%` }} />
                      </div>
                  </div>
                  <div className="absolute -right-10 -bottom-20 w-48 h-48 bg-emerald-500/20 blur-[60px] rounded-full" />
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">History</h3>
              <div className="space-y-3">
                  {validSessions.map(session => {
                      const tree = TREES.find(t => t.id === session.treeId) || TREES[0];
                      const isDead = session.status === 'failed';
                      return (
                          <div key={session.id} className="bg-white dark:bg-white/5 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-white/5">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDead ? 'grayscale opacity-50 bg-slate-100 dark:bg-white/10' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                                  {isDead ? <Ghost size={24} className="text-slate-400"/> : <tree.icon size={24} style={{ color: tree.color }} />}
                              </div>
                              <div className="flex-1">
                                  <div className="font-bold text-slate-800 dark:text-white text-sm">{session.taskTitle || (isDead ? "Withered Tree" : tree.name)}</div>
                                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{format(new Date(session.timestamp), 'h:mm a')} • {session.duration} mins</div>
                              </div>
                              <span className={`text-xs font-bold ${isDead ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {isDead ? 'Failed' : `+${session.duration}`}
                              </span>
                          </div>
                      );
                  })}
                  {validSessions.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-sm">No trees planted yet.</div>
                  )}
              </div>
          </div>
      );
  };

  const renderStore = () => (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Store</h2>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-2">
                  <Leaf size={14} /> {currentCoins}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              {TREES.map(tree => {
                  const isUnlocked = unlockedTrees.includes(tree.id);
                  const canAfford = currentCoins >= tree.price;

                  return (
                      <div key={tree.id} className={`p-4 rounded-[24px] border relative overflow-hidden group ${isUnlocked ? 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5' : 'bg-slate-50 dark:bg-white/5 border-transparent opacity-80'}`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${tree.bg} opacity-0 group-hover:opacity-10 transition-opacity`} />
                          
                          <div className="flex justify-center mb-4 mt-2">
                              <tree.icon size={64} style={{ color: isUnlocked ? tree.color : '#94a3b8' }} className={`transition-transform group-hover:scale-110 ${!isUnlocked && 'grayscale opacity-50'}`} />
                          </div>
                          
                          <div className="text-center">
                              <div className="font-bold text-slate-900 dark:text-white mb-1">{tree.name}</div>
                              {isUnlocked ? (
                                  <div className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-1"><CheckCircle2 size={10}/> Owned</div>
                              ) : (
                                  <button 
                                      disabled={!canAfford}
                                      onClick={() => onUnlockTree && onUnlockTree(tree.id)}
                                      className={`mt-2 w-full py-2 rounded-xl text-[10px] font-bold transition-all ${canAfford ? 'bg-slate-900 dark:bg-white text-white dark:text-black' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
                                  >
                                      {tree.price > 0 ? `${tree.price} Coins` : 'Free'}
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
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 relative overflow-hidden transition-colors font-sans">
      
      {/* Dynamic Background */}
      <div className={`absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-b ${selectedTree.bg}`} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-20 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-full pl-1 pr-3 py-1 flex items-center gap-2 border border-white/20">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900 font-bold text-xs">
                  {Math.floor(todayMinutes/60)}h
              </div>
              <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Today</span>
              </div>
          </div>

          <div className="pointer-events-auto flex gap-2">
              <button onClick={() => setShowStats(true)} className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white/80">
                  <BarChart3 size={18} />
              </button>
              {onMenuClick && (
                  <button onClick={onMenuClick} className="w-10 h-10 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white/80 md:hidden">
                      <Menu size={18} />
                  </button>
              )}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10 pt-safe">
          {activeTab === 'timer' && renderTimer()}
          {activeTab === 'forest' && renderForest()}
          {activeTab === 'store' && renderStore()}
      </div>

      {/* Floating Tab Bar */}
      {!isActive && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-1.5 rounded-full flex gap-1 shadow-2xl shadow-slate-900/10">
                  {(['timer', 'forest', 'store'] as const).map(tab => (
                      <button 
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      >
                          {tab === 'timer' && <Clock size={16} />}
                          {tab === 'forest' && <Trees size={16} />}
                          {tab === 'store' && <Store size={16} />}
                          <span className="capitalize">{tab}</span>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Give Up Modal */}
      {giveUpMode && (
          <div className="absolute inset-0 z-50 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-2xl max-w-xs w-full text-center border border-white/20">
                  <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
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

      {/* Stats View Modal */}
      {showStats && (
          <FocusStatsView sessions={focusSessions} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
};

export default FocusView;
