
import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import TaskView, { TaskDetailView, TagsView } from './components/TaskView';
import HabitView, { HabitStatsView } from './components/HabitView';
import FocusView from './components/FocusView';
import CalendarView from './components/CalendarView';
import FinanceView from './components/FinanceView';
import SettingsView, { ProfileMenu } from './components/SettingsView';
import { MobileNavigation } from './components/MobileNavigation';
import { Task, ViewType, Habit, FocusCategory, List, AppSettings, FocusSession, Transaction, Debt, Debtor, SavingsGoal, Subscription, Investment } from './types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './services/storageService';
import { loginWithGoogle, logoutUser, subscribeToAuthChanges, saveUserDataToFirestore, subscribeToDataChanges, loadUserDataFromFirestore } from './services/firebaseService';
import { fetchCalendarEvents, updateCalendarEvent, deleteCalendarEvent } from './services/googleCalendarService';
import { playAlarmSound } from './services/notificationService';
import { updateWidgetData } from './services/widgetService';
import { Loader2 } from 'lucide-react';
import { addMonths } from 'date-fns';
import { LiveUpdate } from '@capawesome/capacitor-live-update';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const mergeArrays = <T extends { id: string; updatedAt?: Date | string }>(local: T[], remote: T[]): T[] => {
    const map = new Map<string, T>();
    local.forEach(item => map.set(item.id, item));
    remote.forEach(item => { const localItem = map.get(item.id); if (!localItem || new Date(item.updatedAt || 0).getTime() > new Date(localItem.updatedAt || 0).getTime()) map.set(item.id, item); });
    return Array.from(map.values());
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType | string>(ViewType.Inbox);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadFromStorage('ticktick_clone_theme', 'light'));
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem('google_access_token') || loadFromStorage(STORAGE_KEYS.TOKEN, null));
  
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage(STORAGE_KEYS.SETTINGS, { features: { tasks: true, calendar: true, habits: true, focus: true, notes: true, finance: true } }));
  const [lists, setLists] = useState<List[]>(() => loadFromStorage(STORAGE_KEYS.LISTS, [{ id: 'work', name: 'Work', color: '#3b82f6' }, { id: 'personal', name: 'Personal', color: '#10b981' }]));
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.TASKS, []).map((t:any) => ({...t, dueDate: t.dueDate ? new Date(t.dueDate) : undefined})));
  const [habits, setHabits] = useState<Habit[]>(() => loadFromStorage(STORAGE_KEYS.HABITS, []));
  const [focusCategories, setFocusCategories] = useState<FocusCategory[]>(() => loadFromStorage(STORAGE_KEYS.FOCUS, []));
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>(() => loadFromStorage(STORAGE_KEYS.FOCUS_SESSIONS, []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []));
  const [debtors, setDebtors] = useState<Debtor[]>(() => loadFromStorage(STORAGE_KEYS.DEBTORS, []));
  const [debts, setDebts] = useState<Debt[]>(() => loadFromStorage(STORAGE_KEYS.DEBTS, []));
  const [goals, setGoals] = useState<SavingsGoal[]>(() => loadFromStorage(STORAGE_KEYS.GOALS, []));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, []));
  const [investments, setInvestments] = useState<Investment[]>(() => loadFromStorage(STORAGE_KEYS.INVESTMENTS, []));
  const [partnerTransactions, setPartnerTransactions] = useState<Transaction[]>([]);
  const [partnerGoals, setPartnerGoals] = useState<SavingsGoal[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isRemoteUpdate = useRef(false);

  useEffect(() => { if (theme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); saveToStorage('ticktick_clone_theme', theme); }, [theme]);

  // Sync Logic (Simplified for brevity)
  useEffect(() => {
    const unsub = subscribeToAuthChanges(async (u) => {
      setUser(u);
      if (u) {
        const remote = await loadUserDataFromFirestore(u.uid);
        if (remote) { isRemoteUpdate.current = true; processIncomingData(remote); setTimeout(() => isRemoteUpdate.current = false, 1000); }
        subscribeToDataChanges(u.uid, (data) => { if(!isRemoteUpdate.current) { isRemoteUpdate.current = true; processIncomingData(data); setTimeout(() => isRemoteUpdate.current = false, 1000); }});
        if(accessToken) syncWithGoogleCalendar(accessToken);
      }
      setIsAuthReady(true);
    });
    return () => unsub();
  }, [accessToken]);

  const processIncomingData = (data: any) => {
      if(!data) return;
      if(data.tasks) setTasks(prev => mergeArrays(prev, data.tasks.map((t:any) => ({...t, dueDate: t.dueDate ? new Date(t.dueDate) : undefined}))));
      if(data.habits) setHabits(prev => mergeArrays(prev, data.habits));
      if(data.transactions) setTransactions(prev => mergeArrays(prev, data.transactions));
      // ... others
  };

  const syncWithGoogleCalendar = async (token: string) => {
      setIsSyncingCalendar(true);
      try {
          const events = await fetchCalendarEvents(token, addMonths(new Date(), -1), addMonths(new Date(), 3));
          setTasks(prev => {
              const local = prev.filter(t => !t.isEvent);
              const mapped = events.map(e => { const ex = prev.find(t => t.externalId === e.id); return ex ? { ...e, isCompleted: ex.isCompleted, listId: ex.listId, id: ex.id } : e; });
              return [...local, ...mapped];
          });
      } catch (e) { console.error(e); } finally { setIsSyncingCalendar(false); }
  };

  return (
    <div className="flex h-screen w-full bg-[#f0f2f5] dark:bg-black text-slate-900 dark:text-slate-100 transition-colors p-0 md:p-4 gap-4 overflow-hidden">
        <Sidebar currentView={currentView} onChangeView={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} lists={lists} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpenSettings={() => setShowSettings(true)} onOpenProfile={() => setShowProfileMenu(true)} onSearch={setSearchQuery} user={user} syncStatus={syncStatus} onAddList={(n, c) => setLists([...lists, {id: Date.now().toString(), name: n, color: c}])} onDeleteList={(id) => setLists(lists.filter(l => l.id !== id))} />
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-white dark:bg-slate-950 md:rounded-[32px] shadow-sm md:shadow-xl transition-all">
            {(currentView === ViewType.Inbox || currentView === ViewType.Today || currentView === ViewType.Next7Days || currentView === ViewType.Completed || currentView === ViewType.All || currentView === ViewType.Search || currentView === ViewType.Notes || lists.find(l => l.id === currentView)) && (
                <TaskView tasks={tasks} lists={lists} viewType={currentView} searchQuery={searchQuery} onToggleTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))} onAddTask={(t) => setTasks(prev => [...prev, t])} onUpdateTask={(t) => setTasks(prev => prev.map(old => old.id === t.id ? t : old))} onSelectTask={setSelectedTaskId} onDeleteTask={(id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, isDeleted: true } : t))} onMenuClick={() => setIsSidebarOpen(true)} />
            )}
            {currentView === ViewType.Calendar && <CalendarView tasks={tasks} lists={lists} habits={habits} accessToken={accessToken} onToggleTask={() => {}} onSelectTask={setSelectedTaskId} onUpdateTask={() => {}} onMenuClick={() => setIsSidebarOpen(true)} onConnectGCal={() => {}} onSync={() => {}} onTokenExpired={() => {}} />}
            {currentView === ViewType.Habits && <HabitView habits={habits} onToggleHabit={(id, date) => setHabits(prev => prev.map(h => h.id === id ? { ...h, history: { ...h.history, [date]: { completed: !h.history[date]?.completed, timestamp: Date.now() } } } : h))} onUpdateHabit={(h) => setHabits(prev => prev.map(old => old.id === h.id ? h : old))} onAddHabit={(h) => setHabits([...habits, h])} onDeleteHabit={(id) => setHabits(prev => prev.filter(h => h.id !== id))} onMenuClick={() => setIsSidebarOpen(true)} onOpenStats={() => setCurrentView(ViewType.HabitStats)} />}
            {currentView === ViewType.HabitStats && <HabitStatsView habits={habits} onClose={() => setCurrentView(ViewType.Habits)} />}
            {currentView === ViewType.Focus && <FocusView categories={focusCategories} onAddCategory={(c) => setFocusCategories([...focusCategories, c])} activeTask={tasks.find(t => t.id === focusTaskId)} onFocusComplete={(s) => setFocusSessions([...focusSessions, s])} onMenuClick={() => setIsSidebarOpen(true)} focusSessions={focusSessions} />}
            {currentView === ViewType.Finance && <FinanceView transactions={transactions} onAddTransaction={(t) => setTransactions([...transactions, t])} onDeleteTransaction={(id) => setTransactions(prev => prev.filter(t => t.id !== id))} onMenuClick={() => setIsSidebarOpen(true)} />}
            <MobileNavigation currentView={currentView} onChangeView={setCurrentView} onMenuClick={() => setIsSidebarOpen(true)} />
        </main>
        {showSettings && <SettingsView onClose={() => setShowSettings(false)} settings={settings} onUpdateSettings={setSettings} theme={theme} onThemeToggle={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} user={user} onLogin={() => loginWithGoogle()} onLogout={() => logoutUser()} />}
        {showProfileMenu && <ProfileMenu user={user} onClose={() => setShowProfileMenu(false)} onLogout={() => logoutUser()} onLogin={() => loginWithGoogle()} onSettings={() => { setShowProfileMenu(false); setShowSettings(true); }} />}
        {selectedTaskId && <TaskDetailView task={tasks.find(t => t.id === selectedTaskId)!} lists={lists} tasks={tasks} onClose={() => setSelectedTaskId(null)} onUpdateTask={(t) => setTasks(prev => prev.map(old => old.id === t.id ? t : old))} onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))} onStartFocus={(id) => { setSelectedTaskId(null); setFocusTaskId(id); setCurrentView(ViewType.Focus); }} />}
    </div>
  );
};
export default App;
