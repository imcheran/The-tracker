
import React, { useState } from 'react';
import { 
  Inbox, Calendar, Target, Clock, Layers, Tags, 
  Settings, Plus, Search, Zap, Notebook, Wallet, Sun, CalendarDays, Trash2, X, User, Cloud, CloudOff, Loader2, Check,
  ListTodo
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

  // Pill style navigation items
  const navItemClass = (view: ViewType | string) => `
    relative flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 select-none group
    ${currentView === view 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
    }
  `;

  const iconClass = (view: ViewType | string) => `
    transition-colors duration-300
    ${currentView === view ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
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
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        <div className={`
            fixed md:static inset-y-0 left-0 z-50
            h-full md:h-auto md:rounded-[32px]
            bg-white dark:bg-slate-950 flex flex-col 
            transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            w-[85vw] max-w-[280px]
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:ml-0'}
            shadow-2xl md:shadow-none md:border-0
        `}>
        
        <div className="flex flex-col h-full px-4 pt-safe">
            {/* Header / Branding */}
            <div className="py-6 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Tracker</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'saved' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{syncStatus === 'saving' ? 'Syncing...' : 'Ready'}</span>
                        </div>
                    </div>
                </div>
                
                <button 
                  onClick={onOpenProfile}
                  className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-800 overflow-hidden hover:scale-105 active:scale-95 transition-transform"
                >
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <User size={20} />
                        </div>
                    )}
                </button>
            </div>

            {/* Global Search */}
            <div className="mb-6 mx-1">
                <div className="bg-slate-100/50 dark:bg-slate-900/50 flex items-center px-4 py-3 rounded-2xl gap-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all focus-within:bg-white dark:focus-within:bg-slate-800 shadow-sm border border-transparent focus-within:border-blue-100 dark:focus-within:border-slate-700">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        id="sidebar-search"
                        placeholder="Search..." 
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                        onChange={(e) => { 
                            onSearch(e.target.value); 
                            if(e.target.value) onChangeView(ViewType.Search);
                        }} 
                    />
                </div>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-4 px-1">
                
                {/* Main Views */}
                {showFeature('tasks') && (
                    <div className="space-y-1">
                        <div onClick={() => onChangeView(ViewType.All)} className={navItemClass(ViewType.All)}>
                            <ListTodo size={20} className={iconClass(ViewType.All)} /> 
                            <span className="font-semibold">All Tasks</span>
                        </div>
                        <div onClick={() => onChangeView(ViewType.Today)} className={navItemClass(ViewType.Today)}>
                            <Sun size={20} className={iconClass(ViewType.Today)} /> 
                            <span className="font-semibold">Today</span>
                        </div>
                        <div onClick={() => onChangeView(ViewType.Next7Days)} className={navItemClass(ViewType.Next7Days)}>
                            <CalendarDays size={20} className={iconClass(ViewType.Next7Days)} /> 
                            <span className="font-semibold">Next 7 Days</span>
                        </div>
                    </div>
                )}

                {/* Workspace Apps */}
                <div>
                    <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</div>
                    <div className="space-y-1">
                        {showFeature('calendar') && (
                            <div onClick={() => onChangeView(ViewType.Calendar)} className={navItemClass(ViewType.Calendar)}>
                                <Calendar size={20} className={iconClass(ViewType.Calendar)} /> <span>Calendar</span>
                            </div>
                        )}
                        {showFeature('habits') && (
                            <div onClick={() => onChangeView(ViewType.Habits)} className={navItemClass(ViewType.Habits)}>
                                <Target size={20} className={iconClass(ViewType.Habits)} /> <span>Habits</span>
                            </div>
                        )}
                        {showFeature('focus') && (
                            <div onClick={() => onChangeView(ViewType.Focus)} className={navItemClass(ViewType.Focus)}>
                                <Clock size={20} className={iconClass(ViewType.Focus)} /> <span>Focus</span>
                            </div>
                        )}
                        {showFeature('notes') && (
                            <div onClick={() => onChangeView(ViewType.Notes)} className={navItemClass(ViewType.Notes)}>
                                <Notebook size={20} className={iconClass(ViewType.Notes)} /> <span>Notes</span>
                            </div>
                        )}
                        {showFeature('finance') && (
                            <div onClick={() => onChangeView(ViewType.Finance)} className={navItemClass(ViewType.Finance)}>
                                <Wallet size={20} className={iconClass(ViewType.Finance)} /> <span>Finance</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Custom Lists */}
                <div>
                    <div className="flex items-center justify-between px-4 mb-2 group cursor-pointer" onClick={() => setIsManagingLists(true)}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Lists</span>
                        <Plus size={14} className="text-slate-400 group-hover:text-blue-600" />
                    </div>
                    
                    <div className="space-y-1">
                        <div onClick={() => onChangeView(ViewType.Inbox)} className={navItemClass(ViewType.Inbox)}>
                            <Inbox size={20} className={iconClass(ViewType.Inbox)} /> <span>Inbox</span>
                        </div>
                        {lists.map(list => (
                            <div key={list.id} onClick={() => onChangeView(list.id)} className={navItemClass(list.id)}>
                                <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-opacity-20 ring-current`} style={{ color: list.color, backgroundColor: list.color }} />
                                <span className="truncate flex-1 font-medium">{list.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Settings */}
            <div className="py-4 border-t border-slate-100 dark:border-slate-800 pb-safe">
                <button 
                    onClick={() => {
                        if (onOpenSettings) onOpenSettings();
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95 group"
                >
                    <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
                    <span className="text-sm font-bold">Settings</span>
                </button>
            </div>
        </div>

        {/* Create List Modal */}
        {isManagingLists && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsManagingLists(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Lists</h3>
                        <button onClick={() => setIsManagingLists(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input 
                            autoFocus
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="New List Name"
                            className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                        />
                        <button onClick={handleCreateList} disabled={!newListTitle.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95 shadow-lg shadow-blue-500/30">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                        {lists.map(list => (
                            <div key={list.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: list.color }} />
                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{list.name}</span>
                                </div>
                                <button onClick={() => onDeleteList?.(list.id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        </div>
    </>
  );
});

export default Sidebar;
