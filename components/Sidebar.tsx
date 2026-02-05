
import React, { useState } from 'react';
import { 
  Inbox, Calendar, Target, Clock, Layers, Tags, 
  Settings, Plus, Search, Zap, Notebook, Wallet, Sun, CalendarDays, Trash2, X, User, Cloud, CloudOff, Loader2, Check
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

  const navItemClass = (view: ViewType | string) => `
    relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium select-none group active:scale-95
    ${currentView === view 
        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
    }
  `;

  const iconClass = (view: ViewType | string) => `
    transition-colors duration-200
    ${currentView === view ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}
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

  const getSyncIcon = () => {
      if (!user) return null;
      switch (syncStatus) {
          case 'saving': return <Loader2 size={14} className="animate-spin text-blue-500" />;
          case 'error': return <CloudOff size={14} className="text-red-500" />;
          case 'offline': return <CloudOff size={14} className="text-slate-400" />;
          case 'saved': return <Cloud size={14} className="text-emerald-500" />;
          default: return <Check size={14} className="text-emerald-500" />;
      }
  };

  const getSyncText = () => {
      if (!user) return '';
      switch (syncStatus) {
          case 'saving': return 'Syncing...';
          case 'error': return 'Sync Error';
          case 'offline': return 'Offline';
          case 'saved': return 'Saved';
          default: return 'Saved';
      }
  };

  return (
    <>
        {/* Mobile Overlay */}
        <div 
            className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        <div className={`
            fixed md:static inset-y-0 left-0 z-50
            h-full bg-white dark:bg-slate-950 flex flex-col 
            transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
            w-[85vw] max-w-[280px] border-r border-slate-200/50 dark:border-slate-800
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-[280px]'}
            shadow-2xl md:shadow-none
        `}>
        
        <div className="flex flex-col h-full px-4 pt-safe">
            {/* Header */}
            <div className="py-6 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 active:scale-95">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-bold text-slate-900 dark:text-white leading-none tracking-tight">Tracker</span>
                        {/* Sync Status Indicator */}
                        {user && (
                            <div className="flex items-center gap-1.5 mt-1">
                                {getSyncIcon()}
                                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{getSyncText()}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Disc style profile trigger at the top for easy access */}
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

            {/* Search */}
            <div className="mb-6">
                <div className="bg-slate-100 dark:bg-slate-900 flex items-center px-3 py-2.5 rounded-xl gap-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all focus-within:bg-white dark:focus-within:bg-slate-800 shadow-sm border border-transparent focus-within:border-slate-200 dark:focus-within:border-slate-700">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        id="sidebar-search"
                        placeholder="Quick Search" 
                        className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400 font-medium"
                        onChange={(e) => { 
                            onSearch(e.target.value); 
                            if(e.target.value) onChangeView(ViewType.Search);
                        }} 
                    />
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pb-4">
                {showFeature('tasks') && (
                    <>
                        <div onClick={() => onChangeView(ViewType.Inbox)} className={navItemClass(ViewType.Inbox)}>
                            <Inbox size={18} className={iconClass(ViewType.Inbox)} /> Inbox
                        </div>
                        <div onClick={() => onChangeView(ViewType.Today)} className={navItemClass(ViewType.Today)}>
                            <Sun size={18} className={iconClass(ViewType.Today)} /> Today
                        </div>
                        <div onClick={() => onChangeView(ViewType.Next7Days)} className={navItemClass(ViewType.Next7Days)}>
                            <CalendarDays size={18} className={iconClass(ViewType.Next7Days)} /> Next 7 Days
                        </div>
                    </>
                )}

                <div className="my-4 h-px bg-slate-100 dark:bg-slate-800/50" />

                <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Workspace</div>

                {showFeature('calendar') && (
                    <div onClick={() => onChangeView(ViewType.Calendar)} className={navItemClass(ViewType.Calendar)}>
                        <Calendar size={18} className={iconClass(ViewType.Calendar)} /> Calendar
                    </div>
                )}
                
                {showFeature('habits') && (
                    <div onClick={() => onChangeView(ViewType.Habits)} className={navItemClass(ViewType.Habits)}>
                        <Target size={18} className={iconClass(ViewType.Habits)} /> Habits
                    </div>
                )}
                {showFeature('focus') && (
                    <div onClick={() => onChangeView(ViewType.Focus)} className={navItemClass(ViewType.Focus)}>
                        <Clock size={18} className={iconClass(ViewType.Focus)} /> Focus
                    </div>
                )}
                {showFeature('notes') && (
                    <div onClick={() => onChangeView(ViewType.Notes)} className={navItemClass(ViewType.Notes)}>
                        <Notebook size={18} className={iconClass(ViewType.Notes)} /> Notes
                    </div>
                )}
                {showFeature('finance') && (
                    <div onClick={() => onChangeView(ViewType.Finance)} className={navItemClass(ViewType.Finance)}>
                        <Wallet size={18} className={iconClass(ViewType.Finance)} /> Finance
                    </div>
                )}

                <div className="my-4 h-px bg-slate-100 dark:bg-slate-800/50" />

                <div className="flex items-center justify-between px-3 mb-2 group cursor-pointer" onClick={() => setIsManagingLists(true)}>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Lists</span>
                    <Plus size={14} className="text-slate-400 group-hover:text-blue-600" />
                </div>

                {lists.map(list => (
                    <div 
                        key={list.id} 
                        onClick={() => onChangeView(list.id)} 
                        className={navItemClass(list.id)}
                    >
                        <div className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: list.color }} />
                        <span className="truncate flex-1">{list.name}</span>
                    </div>
                ))}

                <div onClick={() => onChangeView(ViewType.Tags)} className={navItemClass(ViewType.Tags)}>
                    <Tags size={18} className={iconClass(ViewType.Tags)} /> Tags
                </div>
            </div>

            {/* Footer */}
            <div className="py-4 border-t border-slate-100 dark:border-slate-800 pb-safe">
                <button 
                    onClick={onOpenSettings}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
                >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Settings</span>
                </button>
            </div>
        </div>

        {/* Manage Lists Modal */}
        {isManagingLists && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4" onClick={() => setIsManagingLists(false)}>
                <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scale-in" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Lists</h3>
                        <button onClick={() => setIsManagingLists(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input 
                            autoFocus
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="New List Name"
                            className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                        />
                        <button onClick={handleCreateList} disabled={!newListTitle.trim()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors active:scale-95">
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                        {lists.map(list => (
                            <div key={list.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: list.color }} />
                                    <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{list.name}</span>
                                </div>
                                <button onClick={() => onDeleteList?.(list.id)} className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 size={14} />
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
