
import React, { useState } from 'react';
import { 
  Inbox, Calendar, Target, Clock, Layers, Tags, 
  Settings, Plus, Search, Zap, Notebook, Wallet, Sun, CalendarDays, Trash2, X, User, Cloud, Check
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType | string;
  onChangeView: (view: ViewType | string) => void;
  lists: { id: string; name: string; color: string }[];
  enabledFeatures?: string[];
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onAddList?: (name: string, color: string) => void;
  onDeleteList?: (id: string) => void;
  onSearch: (query: string) => void;
  user?: any;
  syncStatus?: 'saved' | 'saving' | 'error' | 'offline';
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ 
    currentView, onChangeView, lists, enabledFeatures = ['tasks', 'calendar', 'habits', 'focus', 'notes', 'finance'],
    onOpenSettings, onOpenProfile, isOpen, onClose, onAddList, onDeleteList, onSearch, user, syncStatus = 'saved'
}) => {
  const [isManagingLists, setIsManagingLists] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // Neumorphic active state style
  const navItemClass = (view: ViewType | string) => `
    relative flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 text-sm font-bold select-none group
    ${currentView === view 
        ? 'text-primary-600 dark:text-primary-400 shadow-soft-pressed dark:shadow-soft-dark-pressed bg-background-light dark:bg-background-dark transform scale-[0.98]' 
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:-translate-y-0.5 hover:shadow-soft-sm dark:hover:shadow-soft-dark-sm bg-surface-light dark:bg-surface-dark'
    }
  `;

  const showFeature = (id: string) => enabledFeatures.includes(id);

  const handleCreateList = () => {
      if (newListTitle.trim() && onAddList) {
          const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#818cf8', '#c084fc', '#f472b6'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          onAddList(newListTitle, randomColor);
          setNewListTitle('');
      }
  };

  return (
    <>
        {/* Mobile Overlay */}
        <div 
            className={`fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 transition-opacity duration-500 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        <div className={`
            fixed md:static inset-y-0 left-0 z-50
            h-full flex flex-col 
            bg-transparent
            transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)
            w-[85vw] max-w-[300px]
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-[300px]'}
        `}>
        
        {/* Neumorphic Sidebar Container - Floating Look */}
        <div className="flex flex-col h-full py-4 pl-4 pr-2">
            <div className="flex-1 flex flex-col bg-surface-light dark:bg-surface-dark rounded-[2rem] shadow-soft dark:shadow-soft-dark overflow-hidden relative border border-white/20 dark:border-white/5">
                
                {/* Header Card */}
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Tracker</h1>
                        </div>
                        
                        <button 
                          onClick={onOpenProfile}
                          className="w-10 h-10 rounded-xl bg-background-light dark:bg-background-dark shadow-soft-pressed dark:shadow-soft-dark-pressed flex items-center justify-center overflow-hidden hover:scale-95 transition-transform"
                        >
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <User size={18} className="text-slate-400" />
                            )}
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group mb-2">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <input 
                            placeholder="Search..." 
                            className="w-full bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl py-3.5 pl-11 pr-4 outline-none shadow-soft-pressed dark:shadow-soft-dark-pressed placeholder:text-slate-400/50 transition-all focus:ring-2 focus:ring-primary-500/10"
                            onChange={(e) => { 
                                onSearch(e.target.value); 
                                if(e.target.value) onChangeView(ViewType.Search);
                            }} 
                        />
                    </div>
                </div>

                {/* Navigation List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-4 pb-4">
                    {showFeature('tasks') && (
                        <>
                            <div onClick={() => onChangeView(ViewType.Inbox)} className={navItemClass(ViewType.Inbox)}>
                                <Inbox size={20} /> Inbox
                            </div>
                            <div onClick={() => onChangeView(ViewType.Today)} className={navItemClass(ViewType.Today)}>
                                <Sun size={20} /> Today
                            </div>
                        </>
                    )}

                    <div className="py-4 flex items-center gap-4">
                        <div className="h-[2px] bg-background-light dark:bg-background-dark shadow-soft-pressed dark:shadow-soft-dark-pressed flex-1 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Apps</span>
                        <div className="h-[2px] bg-background-light dark:bg-background-dark shadow-soft-pressed dark:shadow-soft-dark-pressed flex-1 rounded-full"></div>
                    </div>

                    {showFeature('calendar') && (
                        <div onClick={() => onChangeView(ViewType.Calendar)} className={navItemClass(ViewType.Calendar)}>
                            <Calendar size={20} /> Calendar
                        </div>
                    )}
                    
                    {showFeature('habits') && (
                        <div onClick={() => onChangeView(ViewType.Habits)} className={navItemClass(ViewType.Habits)}>
                            <Target size={20} /> Habits
                        </div>
                    )}
                    {showFeature('focus') && (
                        <div onClick={() => onChangeView(ViewType.Focus)} className={navItemClass(ViewType.Focus)}>
                            <Clock size={20} /> Focus
                        </div>
                    )}
                    {showFeature('finance') && (
                        <div onClick={() => onChangeView(ViewType.Finance)} className={navItemClass(ViewType.Finance)}>
                            <Wallet size={20} /> Finance
                        </div>
                    )}

                    <div className="py-4 flex items-center gap-4">
                        <div className="h-[2px] bg-background-light dark:bg-background-dark shadow-soft-pressed dark:shadow-soft-dark-pressed flex-1 rounded-full"></div>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Lists</span>
                        <button onClick={() => setIsManagingLists(true)} className="p-1.5 rounded-lg bg-background-light dark:bg-background-dark shadow-soft dark:shadow-soft-dark text-slate-400 hover:text-primary-500 transition-colors"><Plus size={14}/></button>
                        <div className="h-[2px] bg-background-light dark:bg-background-dark shadow-soft-pressed dark:shadow-soft-dark-pressed flex-1 rounded-full"></div>
                    </div>

                    {lists.map(list => (
                        <div 
                            key={list.id} 
                            onClick={() => onChangeView(list.id)} 
                            className={navItemClass(list.id)}
                        >
                            <div className={`w-3 h-3 rounded-full shadow-sm`} style={{ backgroundColor: list.color }} />
                            <span className="truncate flex-1">{list.name}</span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 pt-2">
                    <button 
                        onClick={onOpenSettings}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-background-light dark:bg-background-dark shadow-soft dark:shadow-soft-dark text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-primary-500 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-soft-pressed dark:active:shadow-soft-dark-pressed"
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </div>
            </div>
        </div>
        </div>

        {/* Manage Lists Modal */}
        {isManagingLists && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-md p-4" onClick={() => setIsManagingLists(false)}>
                <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-scale-in border border-white/20" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">My Lists</h3>
                        <button onClick={() => setIsManagingLists(false)} className="p-3 rounded-xl bg-background-light dark:bg-background-dark shadow-soft dark:shadow-soft-dark text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex gap-3 mb-6">
                        <input 
                            autoFocus
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="New List Name"
                            className="flex-1 bg-background-light dark:bg-background-dark text-slate-800 dark:text-white rounded-xl px-4 py-3 outline-none shadow-soft-pressed dark:shadow-soft-dark-pressed font-bold placeholder:font-medium"
                        />
                        <button onClick={handleCreateList} disabled={!newListTitle.trim()} className="bg-primary-500 text-white p-3.5 rounded-xl shadow-lg hover:bg-primary-600 disabled:opacity-50 transition-all active:scale-95">
                            <Plus size={24} />
                        </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-3">
                        {lists.map(list => (
                            <div key={list.id} className="flex items-center justify-between p-4 rounded-xl bg-background-light dark:bg-background-dark shadow-soft dark:shadow-soft-dark">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.color }} />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{list.name}</span>
                                </div>
                                <button 
                                    onClick={() => onDeleteList && onDeleteList(list.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </>
  );
});

export default Sidebar;
