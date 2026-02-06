
import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import { MobileNavigation } from './components/MobileNavigation';
import { ViewType, Task, Habit, List, Transaction } from './types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from './services/storageService';
import { Loader2 } from 'lucide-react';

// Lazy Components
const HabitView = lazy(() => import('./components/HabitView'));
const FocusView = lazy(() => import('./components/FocusView'));
const FinanceView = lazy(() => import('./components/FinanceView'));
const CalendarView = lazy(() => import('./components/CalendarView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const ProfileMenu = lazy(() => import('./components/ProfileMenu'));

const LoadingFallback: React.FC = () => (
    <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 size={40} className="animate-spin text-coral" />
    </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType | string>(ViewType.Inbox);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Data State (Simplified for UI Demo, assume full implementation exists)
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage(STORAGE_KEYS.TASKS, []));
  const [lists, setLists] = useState<List[]>(() => loadFromStorage(STORAGE_KEYS.LISTS, [
      { id: 'work', name: 'Work', color: '#F4A58A' },
      { id: 'personal', name: 'Personal', color: '#F4D06F' }
  ]));
  const [habits, setHabits] = useState<Habit[]>(() => loadFromStorage(STORAGE_KEYS.HABITS, []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []));

  useEffect(() => {
      saveToStorage(STORAGE_KEYS.TASKS, tasks);
      saveToStorage(STORAGE_KEYS.LISTS, lists);
      saveToStorage(STORAGE_KEYS.HABITS, habits);
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [tasks, lists, habits, transactions]);

  // Handlers
  const handleAddTask = (t: Task) => setTasks(prev => [...prev, t]);
  const handleUpdateTask = (t: Task) => setTasks(prev => prev.map(p => p.id === t.id ? t : p));
  const handleToggleTask = (id: string) => setTasks(prev => prev.map(t => t.id === id ? {...t, isCompleted: !t.isCompleted} : t));
  const handleAddHabit = (h: Habit) => setHabits(prev => [...prev, h]);
  
  return (
    <div className="flex h-screen w-full text-charcoal relative">
        {/* Sidebar */}
        <Sidebar 
            currentView={currentView}
            onChangeView={(view) => { setCurrentView(view); setIsSidebarOpen(false); }}
            lists={lists}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProfile={() => setShowProfileMenu(true)}
            onSearch={() => {}}
        />
        
        {/* Main Content Area - Transparent to show blobs */}
        <main className="flex-1 flex flex-col h-full relative z-10">
            <Suspense fallback={<LoadingFallback />}>
                {(currentView === ViewType.Inbox || currentView === ViewType.Today || lists.find(l => l.id === currentView)) && (
                    <TaskView 
                        tasks={tasks}
                        lists={lists}
                        viewType={currentView}
                        onToggleTask={handleToggleTask}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onSelectTask={() => {}}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                )}
                {currentView === ViewType.Calendar && (
                    <CalendarView 
                        tasks={tasks} lists={lists} habits={habits} accessToken={null}
                        onToggleTask={handleToggleTask} onSelectTask={() => {}} onUpdateTask={handleUpdateTask}
                        onMenuClick={() => setIsSidebarOpen(true)} onConnectGCal={() => {}} onSync={() => {}} onTokenExpired={() => {}}
                    />
                )}
                {currentView === ViewType.Habits && (
                    <HabitView 
                        habits={habits}
                        onToggleHabit={(id, date) => {
                            setHabits(prev => prev.map(h => {
                                if(h.id === id) {
                                    const history = {...h.history};
                                    if(history[date]?.completed) delete history[date];
                                    else history[date] = { completed: true, timestamp: Date.now() };
                                    return {...h, history};
                                }
                                return h;
                            }))
                        }}
                        onUpdateHabit={() => {}}
                        onAddHabit={handleAddHabit}
                        onDeleteHabit={() => {}}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onOpenStats={() => {}}
                    />
                )}
                {currentView === ViewType.Focus && (
                    <FocusView 
                        categories={[]}
                        onFocusComplete={() => {}}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                )}
                {currentView === ViewType.Finance && (
                    <FinanceView 
                        transactions={transactions}
                        onAddTransaction={(t) => setTransactions([...transactions, t])}
                        onDeleteTransaction={() => {}}
                        onMenuClick={() => setIsSidebarOpen(true)}
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
                    settings={{}}
                    onUpdateSettings={() => {}}
                    theme="light"
                    onThemeToggle={() => {}}
                    onLogin={() => {}}
                    onLogout={() => {}}
                />
            </Suspense>
        )}
    </div>
  );
};

export default App;
