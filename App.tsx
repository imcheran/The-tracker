
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
// Lazy load heavy components to improve startup speed
const TaskDetailView = lazy(() => import('./components/TaskDetailView'));
const HabitView = lazy(() => import('./components/HabitView'));
const HabitStatsView = lazy(() => import('./components/HabitStatsView'));
const FocusView = lazy(() => import('./components/FocusView'));
const MatrixView = lazy(() => import('./components/MatrixView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const KanbanView = lazy(() => import('./components/KanbanView'));
const TagsView = lazy(() => import('./components/TagsView'));
const FinanceView = lazy(() => import('./components/FinanceView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const ProfileMenu = lazy(() => import('./components/ProfileMenu'));

import { MobileNavigation } from './components/MobileNavigation';
import { Task, ViewType, Habit, FocusCategory, List, AppSettings, FocusSession, Transaction, Debt, Debtor, SavingsGoal, Subscription, Investment } from './types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './services/storageService';
import { loginWithGoogle, logoutUser, subscribeToAuthChanges, saveUserDataToFirestore, subscribeToDataChanges, loadUserDataFromFirestore } from './services/firebaseService';
import { fetchCalendarEvents } from './services/googleCalendarService';
import { playAlarmSound } from './services/notificationService';
import { updateWidgetData } from './services/widgetService';
import { Loader2 } from 'lucide-react';
import { addMonths } from 'date-fns';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Smart Merge Function
const mergeArrays = <T extends { id: string; updatedAt?: Date | string }>(local: T[], remote: T[]): T[] => {
    const map = new Map<string, T>();
    local.forEach(item => map.set(item.id, item));
    
    remote.forEach(item => {
        const localItem = map.get(item.id);
        const remoteItem = { ...item }; 
        
        if (!localItem) {
            map.set(remoteItem.id, remoteItem);
        } else {
            const localTime = new Date(localItem.updatedAt || 0).getTime();
            const remoteTime = new Date(remoteItem.updatedAt || 0).getTime();
            
            if (remoteTime > localTime) {
                map.set(remoteItem.id, remoteItem);
            }
        }
    });
    return Array.from(map.values());
};

const LoadingFallback: React.FC = () => (
    <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark h-full">
        <Loader2 size={32} className="animate-spin text-primary-500" />
    </div>
);

const App: React.FC = () => {
  // --- Main App State ---
  const [currentView, setCurrentView] = useState<ViewType | string>(ViewType.Inbox);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // --- Theme State ---
  const [theme, setTheme] = useState<'light' | 'dark'>(() => 
    loadFromStorage<'light' | 'dark'>('ticktick_clone_theme', 'light')
  );

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    saveToStorage('ticktick_clone_theme', theme);
  }, [theme]);
  
  // --- Loading State ---
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');

  // --- Auth State ---
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const token = localStorage.getItem('google_access_token');
    return token || loadFromStorage(STORAGE_KEYS.TOKEN, null);
  });
  
  // --- Data States ---
  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, {});
      const defaultFeatures = {
          tasks: true, 
          matrix: true,
          kanban: true,
          calendar: true,
          habits: true,
          focus: true,
          notes: true,
          finance: true
      };
      const mergedFeatures = { ...defaultFeatures, ...(saved.features || {}) };
      return { ...saved, features: mergedFeatures };
  });

  const [lists, setLists] = useState<List[]>(() => {
      const loaded = loadFromStorage(STORAGE_KEYS.LISTS, []);
      return Array.isArray(loaded) ? loaded : [
        { id: 'work', name: 'Work', color: '#3b82f6', updatedAt: new Date() },
        { id: 'personal', name: 'Personal', color: '#10b981', updatedAt: new Date() }
      ];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
      const loaded = loadFromStorage(STORAGE_KEYS.TASKS, []);
      const raw = Array.isArray(loaded) ? loaded : [];
      return raw.map((t: any) => ({
          ...t,
          dueDate: t.dueDate && !isNaN(new Date(t.dueDate).getTime()) ? new Date(t.dueDate) : undefined,
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      }));
  });

  const [habits, setHabits] = useState<Habit[]>(() => loadFromStorage(STORAGE_KEYS.HABITS, []));
  const [focusCategories, setFocusCategories] = useState<FocusCategory[]>(() => loadFromStorage(STORAGE_KEYS.FOCUS, []));
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => loadFromStorage(STORAGE_KEYS.FOCUS_SESSIONS, []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []));
  const [debtors, setDebtors] = useState<Debtor[]>(() => loadFromStorage(STORAGE_KEYS.DEBTORS, []));
  const [debts, setDebts] = useState<Debt[]>(() => loadFromStorage(STORAGE_KEYS.DEBTS, []));
  const [goals, setGoals] = useState<SavingsGoal[]>(() => loadFromStorage(STORAGE_KEYS.GOALS, []));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, []));
  const [investments, setInvestments] = useState<Investment[]>(() => loadFromStorage(STORAGE_KEYS.INVESTMENTS, []));

  // --- Partner Data State (Read-only from partner's stream) ---
  const [partnerTransactions, setPartnerTransactions] = useState<Transaction[]>([]);
  const [partnerGoals, setPartnerGoals] = useState<SavingsGoal[]>([]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataSubscriptionRef = useRef<(() => void) | null>(null);
  const partnerSubscriptionRef = useRef<(() => void) | null>(null);
  const isRemoteUpdate = useRef(false);
  const latestDataRef = useRef<any>(null);
  
  const stateRef = useRef({ 
      selectedTaskId, showSettings, showProfileMenu, isSidebarOpen, currentView 
  });

  useEffect(() => {
      stateRef.current = { selectedTaskId, showSettings, showProfileMenu, isSidebarOpen, currentView };
  }, [selectedTaskId, showSettings, showProfileMenu, isSidebarOpen, currentView]);

  useEffect(() => {
      if (Capacitor.isNativePlatform()) {
          CapacitorApp.removeAllListeners(); 
          CapacitorApp.addListener('backButton', ({ canGoBack }) => {
              const state = stateRef.current;
              if (state.selectedTaskId) {
                  setSelectedTaskId(null);
                  if (window.history.state?.taskId === state.selectedTaskId) window.history.back();
              } else if (state.showSettings) {
                  setShowSettings(false);
              } else if (state.showProfileMenu) {
                  setShowProfileMenu(false);
              } else if (state.isSidebarOpen) {
                  setIsSidebarOpen(false);
              } else if (state.currentView !== ViewType.Inbox) {
                  setCurrentView(ViewType.Inbox);
              } else {
                  CapacitorApp.exitApp();
              }
          });
      }

      const handlePopState = (event: PopStateEvent) => {
          if (stateRef.current.selectedTaskId) setSelectedTaskId(null);
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
      if (Capacitor.isNativePlatform()) {
          LiveUpdate.sync({ channel: 'production' }).catch(console.warn);
      }
  }, []);

  useEffect(() => {
      const handleOnline = () => { setIsOnline(true); setSyncStatus('saved'); };
      const handleOffline = () => { setIsOnline(false); setSyncStatus('offline'); };
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  // --- Helpers ---
  const onTokenExpired = useCallback(() => {
      setAccessToken(null);
      localStorage.removeItem('google_access_token');
  }, []);

  const syncWithGoogleCalendar = useCallback(async (token: string) => {
      if (!token) return;
      setIsSyncingCalendar(true);
      try {
          const now = new Date();
          const start = addMonths(now, -1);
          const end = addMonths(now, 3);
          const events = await fetchCalendarEvents(token, start, end);
          
          setTasks(prev => {
              const localTasks = prev.filter(t => !t.isEvent);
              return [...localTasks, ...events];
          });
          setLastSynced(new Date());
      } catch (error) {
          console.error("Calendar Sync Error", error);
          if (error instanceof Error && error.message === 'Unauthorized') {
               onTokenExpired();
          }
      } finally {
          setIsSyncingCalendar(false);
      }
  }, [onTokenExpired]);

  // --- Process Incoming Cloud Data with Smart Merge ---
  const processIncomingData = (data: any) => {
      if (!data) return;
      
      if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(prev => mergeArrays(prev, data.tasks.map((t: any) => ({ ...t, dueDate: t.dueDate ? new Date(t.dueDate) : undefined }))));
      }
      
      if (data.habits && Array.isArray(data.habits)) {
          setHabits(prev => mergeArrays(prev, data.habits));
      }

      if (data.transactions) setTransactions(prev => mergeArrays(prev, data.transactions));
      if (data.goals) setGoals(prev => mergeArrays(prev, data.goals));
      if (data.debtors) setDebtors(prev => mergeArrays(prev, data.debtors));
      if (data.debts) setDebts(prev => mergeArrays(prev, data.debts));
      if (data.subscriptions) setSubscriptions(prev => mergeArrays(prev, data.subscriptions));
      if (data.investments) setInvestments(prev => mergeArrays(prev, data.investments));

      if (data.lists) setLists(prev => mergeArrays(prev, data.lists));
      if (data.focusCategories) setFocusCategories(prev => mergeArrays(prev, data.focusCategories));
      if (data.focusSessions) setFocusSessions(prev => mergeArrays(prev, data.focusSessions));
      
      if (data.settings) {
          const defaultFeatures = { 
              tasks: true,
              matrix: true,
              kanban: true,
              calendar: true, 
              habits: true, 
              focus: true, 
              notes: true, 
              finance: true 
          };
          const mergedFeatures = { ...defaultFeatures, ...(data.settings.features || {}) };
          setSettings({ ...data.settings, features: mergedFeatures });
      }
  };

  // --- Partner Data Syncing ---
  useEffect(() => {
      if (partnerSubscriptionRef.current) {
          partnerSubscriptionRef.current();
          partnerSubscriptionRef.current = null;
      }

      const partnerId = settings.couples?.partnerId;
      
      if (partnerId) {
          console.log("Subscribing to partner data:", partnerId);
          const unsub = subscribeToDataChanges(partnerId, (data) => {
              if (data) {
                  if (data.transactions && Array.isArray(data.transactions)) {
                      const pTransactions = data.transactions.map((t: any) => ({
                          ...t,
                          paidBy: t.paidBy || partnerId
                      }));
                      setPartnerTransactions(pTransactions);
                  }
                  if (data.goals && Array.isArray(data.goals)) {
                      setPartnerGoals(data.goals);
                  }
              }
          });
          partnerSubscriptionRef.current = unsub;
      } else {
          setPartnerTransactions([]);
          setPartnerGoals([]);
      }

      return () => {
          if (partnerSubscriptionRef.current) partnerSubscriptionRef.current();
      };
  }, [settings.couples?.partnerId]);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (u) => {
      setUser(u);
      if (u) {
        const remoteData = await loadUserDataFromFirestore(u.uid);
        if (remoteData) {
          isRemoteUpdate.current = true;
          processIncomingData(remoteData);
          setLastSynced(new Date());
          setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
        }
        
        const unsubData = subscribeToDataChanges(u.uid, (data) => {
            if (!isRemoteUpdate.current) {
                isRemoteUpdate.current = true;
                processIncomingData(data);
                setLastSynced(new Date());
                setTimeout(() => { isRemoteUpdate.current = false; }, 1000);
            }
        });
        dataSubscriptionRef.current = unsubData;
        if (accessToken) syncWithGoogleCalendar(accessToken);
      } else {
        if (dataSubscriptionRef.current) {
            dataSubscriptionRef.current();
            dataSubscriptionRef.current = null;
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [accessToken, syncWithGoogleCalendar]);

  // --- Auto-Save Logic with Safety Net ---
  useEffect(() => {
      if (!isAuthReady) return; 

      const currentData = {
          tasks, lists, habits, focusCategories, focusSessions, 
          transactions, debtors, debts, goals, subscriptions, investments, settings
      };

      latestDataRef.current = currentData;

      setTimeout(() => {
          saveToStorage(STORAGE_KEYS.TASKS, tasks);
          saveToStorage(STORAGE_KEYS.LISTS, lists);
          saveToStorage(STORAGE_KEYS.HABITS, habits);
          saveToStorage(STORAGE_KEYS.FOCUS, focusCategories);
          saveToStorage(STORAGE_KEYS.FOCUS_SESSIONS, focusSessions);
          saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
          saveToStorage(STORAGE_KEYS.DEBTORS, debtors);
          saveToStorage(STORAGE_KEYS.DEBTS, debts);
          saveToStorage(STORAGE_KEYS.GOALS, goals);
          saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
          saveToStorage(STORAGE_KEYS.INVESTMENTS, investments);
          saveToStorage(STORAGE_KEYS.SETTINGS, settings);
          updateWidgetData(habits);
      }, 0);

      if (user && !isRemoteUpdate.current) {
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          setSyncStatus('saving');
          saveTimeoutRef.current = setTimeout(() => {
              saveUserDataToFirestore(user.uid, currentData);
              setSyncStatus('saved');
          }, 2000);
      }
  }, [tasks, lists, habits, focusCategories, focusSessions, transactions, debtors, debts, goals, subscriptions, investments, settings, user, isAuthReady]);

  // --- Handlers ---

  const handleAddTask = useCallback((task: Task) => {
    setTasks(prev => [...prev, task]);
  }, []);

  const handleUpdateTask = useCallback((task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  }, []);

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, isCompleted: !t.isCompleted, updatedAt: new Date() };
      }
      return t;
    }));
    playAlarmSound();
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
     setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isDeleted: true, updatedAt: new Date() } : t));
  }, []);

  const handleLogin = async () => {
    try {
      const { user, accessToken } = await loginWithGoogle();
      setUser(user);
      setAccessToken(accessToken);
      if (accessToken) {
          localStorage.setItem('google_access_token', accessToken);
          syncWithGoogleCalendar(accessToken);
      }
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 transition-colors">
        <Sidebar 
            currentView={currentView}
            onChangeView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }}
            lists={lists}
            enabledFeatures={Object.keys(settings.features || {}).filter(k => settings.features![k as keyof typeof settings.features])}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProfile={() => setShowProfileMenu(true)}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onAddList={(name, color) => setLists([...lists, { id: Date.now().toString(), name, color, updatedAt: new Date() }])}
            onDeleteList={(id) => setLists(lists.filter(l => l.id !== id))}
            onSearch={setSearchQuery}
            user={user}
            syncStatus={syncStatus}
        />
        
        <main className="flex-1 flex flex-col h-full relative overflow-hidden">
            <Suspense fallback={<LoadingFallback />}>
                {(currentView === ViewType.Inbox || currentView === ViewType.Today || currentView === ViewType.Next7Days || currentView === ViewType.Completed || currentView === ViewType.Trash || currentView === ViewType.All || currentView === ViewType.Search || currentView === ViewType.Archive || currentView === ViewType.Notes || lists.find(l => l.id === currentView)) && (
                    <TaskView 
                        tasks={tasks}
                        lists={lists}
                        viewType={currentView}
                        searchQuery={searchQuery}
                        onToggleTask={handleToggleTask}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onSelectTask={(id) => setSelectedTaskId(id)}
                        onDeleteTask={handleDeleteTask}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onChangeView={setCurrentView}
                        settings={settings}
                        habits={habits}
                        onUpdateHabit={(h) => setHabits(prev => prev.map(old => old.id === h.id ? h : old))}
                        user={user}
                    />
                )}
                {currentView === ViewType.Calendar && (
                    <CalendarView 
                        tasks={tasks}
                        lists={lists}
                        habits={habits}
                        accessToken={accessToken}
                        onToggleTask={handleToggleTask}
                        onSelectTask={(id) => setSelectedTaskId(id)}
                        onUpdateTask={handleUpdateTask}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onConnectGCal={handleLogin}
                        onSync={() => accessToken && syncWithGoogleCalendar(accessToken)}
                        onTokenExpired={onTokenExpired}
                        isSyncing={isSyncingCalendar}
                        user={user}
                    />
                )}
                {currentView === ViewType.Matrix && (
                    <MatrixView 
                        tasks={tasks}
                        lists={lists}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onSelectTask={(id) => setSelectedTaskId(id)}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                )}
                {currentView === ViewType.Kanban && (
                    <KanbanView 
                        tasks={tasks}
                        lists={lists}
                        onAddTask={handleAddTask}
                        onToggleTask={handleToggleTask}
                        onSelectTask={(id) => setSelectedTaskId(id)}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                )}
                {currentView === ViewType.Habits && (
                    <HabitView 
                        habits={habits}
                        onToggleHabit={(id, date) => setHabits(prev => prev.map(h => {
                            if (h.id === id) {
                                const newHistory = { ...h.history };
                                if (newHistory[date]?.completed) delete newHistory[date];
                                else newHistory[date] = { completed: true, timestamp: Date.now() };
                                return { ...h, history: newHistory };
                            }
                            return h;
                        }))}
                        onUpdateHabit={(h) => setHabits(prev => prev.map(old => old.id === h.id ? h : old))}
                        onAddHabit={(h) => setHabits([...habits, h])}
                        onDeleteHabit={(id) => setHabits(prev => prev.map(h => h.id === id ? { ...h, isArchived: true } : h))}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onOpenStats={() => setCurrentView(ViewType.HabitStats)}
                        onStartFocus={(habitId) => {
                            const habit = habits.find(h => h.id === habitId);
                            const tempTask: Task = {
                                id: `habit-${habitId}`,
                                title: habit?.name || "Habit Focus",
                                isCompleted: false,
                                priority: 0,
                                listId: 'focus',
                                tags: ['Habit'],
                                subtasks: [],
                                attachments: [],
                                createdAt: new Date()
                            };
                            if (!tasks.find(t => t.id === tempTask.id)) {
                                setTasks(prev => [...prev, tempTask]);
                            }
                            setFocusTaskId(tempTask.id);
                            setCurrentView(ViewType.Focus);
                        }}
                        user={user}
                    />
                )}
                {currentView === ViewType.HabitStats && (
                    <HabitStatsView 
                        habits={habits}
                        onClose={() => setCurrentView(ViewType.Habits)}
                    />
                )}
                {currentView === ViewType.Focus && (
                    <FocusView 
                        categories={focusCategories}
                        onAddCategory={(c) => setFocusCategories([...focusCategories, c])}
                        activeTask={tasks.find(t => t.id === focusTaskId)}
                        onFocusComplete={(s) => setFocusSessions([...focusSessions, s])}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        focusSessions={focusSessions}
                        unlockedTrees={settings.focus?.unlockedTrees}
                        onUnlockTree={(treeId) => {
                            const newUnlocked = [...(settings.focus?.unlockedTrees || []), treeId];
                            setSettings({ ...settings, focus: { ...settings.focus, unlockedTrees: newUnlocked } });
                        }}
                    />
                )}
                {currentView === ViewType.Tags && (
                    <TagsView 
                        tasks={tasks}
                        onUpdateTask={handleUpdateTask}
                        onSelectTask={(id) => setSelectedTaskId(id)}
                        onToggleTask={handleToggleTask}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                )}
                {currentView === ViewType.Finance && (
                    <FinanceView 
                        transactions={transactions}
                        partnerTransactions={partnerTransactions}
                        onAddTransaction={(t) => setTransactions([...transactions, t])}
                        onUpdateTransaction={(t) => setTransactions(prev => prev.map(old => old.id === t.id ? t : old))}
                        onDeleteTransaction={(id) => setTransactions(prev => prev.filter(t => t.id !== id))}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onAddTransactions={(txs) => setTransactions([...transactions, ...txs])}
                        debtors={debtors}
                        debts={debts}
                        onAddDebtor={(d) => setDebtors([...debtors, d])}
                        onAddDebt={(d) => setDebts([...debts, d])}
                        onUpdateDebt={(d) => setDebts(prev => prev.map(old => old.id === d.id ? d : old))}
                        onDeleteDebt={(id) => setDebts(prev => prev.filter(d => d.id !== id))}
                        goals={settings.couples?.partnerId && partnerGoals.length > 0 ? [...goals, ...partnerGoals] : goals}
                        onAddGoal={(g) => setGoals([...goals, g])}
                        onUpdateGoal={(g) => setGoals(prev => prev.map(old => old.id === g.id ? g : old))}
                        onDeleteGoal={(id) => setGoals(prev => prev.filter(g => g.id !== id))}
                        subscriptions={subscriptions}
                        onAddSubscription={(s) => setSubscriptions([...subscriptions, s])}
                        onUpdateSubscription={(s) => setSubscriptions(prev => prev.map(old => old.id === s.id ? s : old))}
                        onDeleteSubscription={(id) => setSubscriptions(prev => prev.filter(s => s.id !== id))}
                        investments={investments}
                        onAddInvestment={(i) => setInvestments([...investments, i])}
                        onUpdateInvestment={(i) => setInvestments(prev => prev.map(old => old.id === i.id ? i : old))}
                        onDeleteInvestment={(id) => setInvestments(prev => prev.filter(i => i.id !== id))}
                        user={user}
                    />
                )}
            </Suspense>
            
            <MobileNavigation 
                currentView={currentView} 
                onChangeView={setCurrentView} 
                onMenuClick={() => setIsSidebarOpen(true)} 
            />
        </main>
        
        {/* Global Modals */}
        {showSettings && (
            <Suspense fallback={null}>
                <SettingsView 
                    onClose={() => setShowSettings(false)}
                    settings={settings}
                    onUpdateSettings={setSettings}
                    theme={theme}
                    onThemeToggle={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                    onOpenCompletedTasks={() => { setShowSettings(false); setCurrentView(ViewType.Completed); }}
                    user={user}
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                />
            </Suspense>
        )}
        
        {showProfileMenu && (
            <Suspense fallback={null}>
                <ProfileMenu 
                    user={user}
                    onClose={() => setShowProfileMenu(false)}
                    onLogout={handleLogout}
                    onLogin={handleLogin}
                    onSettings={() => { setShowProfileMenu(false); setShowSettings(true); }}
                />
            </Suspense>
        )}

        {selectedTaskId && (
            <Suspense fallback={null}>
                <TaskDetailView 
                    task={tasks.find(t => t.id === selectedTaskId) || { id: selectedTaskId, title: '', isCompleted: false, priority: 0, listId: 'inbox', tags: [], subtasks: [], attachments: [] }}
                    tasks={tasks}
                    lists={lists}
                    onClose={() => setSelectedTaskId(null)}
                    onUpdateTask={handleUpdateTask}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onStartFocus={(id) => { setSelectedTaskId(null); setFocusTaskId(id); setCurrentView(ViewType.Focus); }}
                    onSelectTask={(id) => setSelectedTaskId(id)}
                    settings={settings}
                />
            </Suspense>
        )}
    </div>
  );
};

export default App;
