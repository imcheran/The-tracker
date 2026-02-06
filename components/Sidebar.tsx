
import React, { useState } from 'react';
import { 
  Inbox, Calendar, Target, Clock, Tags, 
  Settings, Plus, Search, Zap, Wallet, Sun, User, X
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
    currentView, onChangeView, lists, enabledFeatures = ['tasks', 'calendar', 'habits', 'focus', 'finance'],
    onOpenSettings, onOpenProfile, isOpen, onClose, onAddList, onSearch, user
}) => {
  
  const navItemClass = (view: ViewType | string) => `
    flex items-center gap-4 px-5 py-4 rounded-card cursor-pointer transition-all duration-300 text-sm font-bold
    ${currentView === view 
        ? 'bg-yellow-soft text-charcoal shadow-organic' 
        : 'text-charcoal/60 hover:bg-cream hover:text-charcoal'
    }
  `;

  return (
    <>
        <div 
            className={`fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-40 transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        />

        <div className={`
            fixed inset-y-4 left-4 z-50
            flex flex-col 
            bg-white rounded-[32px] shadow-organic
            transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)
            w-[85vw] max-w-[280px]
            ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}
        `}>
            
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-coral rounded-full flex items-center justify-center text-white shadow-lg">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <h1 className="text-2xl font-black text-charcoal tracking-tight">Tracker</h1>
                    </div>
                    
                    <button 
                      onClick={onOpenProfile}
                      className="w-10 h-10 rounded-full bg-cream flex items-center justify-center overflow-hidden border-2 border-white shadow-sm"
                    >
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <User size={18} className="text-charcoal/50" />
                        )}
                    </button>
                </div>

                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
                    <input 
                        placeholder="Search..." 
                        className="w-full bg-cream/50 text-charcoal text-sm font-bold rounded-2xl py-3 pl-11 pr-4 outline-none focus:bg-cream transition-colors placeholder:text-charcoal/30"
                        onChange={(e) => { 
                            onSearch(e.target.value); 
                            if(e.target.value) onChangeView(ViewType.Search);
                        }} 
                    />
                </div>
            </div>

            {/* Menu */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-1">
                <div onClick={() => onChangeView(ViewType.Inbox)} className={navItemClass(ViewType.Inbox)}>
                    <Inbox size={20} /> Inbox
                </div>
                <div onClick={() => onChangeView(ViewType.Today)} className={navItemClass(ViewType.Today)}>
                    <Sun size={20} /> Today
                </div>

                <div className="py-4 px-2">
                    <div className="h-0.5 bg-cream rounded-full w-full"></div>
                </div>

                {enabledFeatures.includes('calendar') && (
                    <div onClick={() => onChangeView(ViewType.Calendar)} className={navItemClass(ViewType.Calendar)}>
                        <Calendar size={20} /> Calendar
                    </div>
                )}
                {enabledFeatures.includes('habits') && (
                    <div onClick={() => onChangeView(ViewType.Habits)} className={navItemClass(ViewType.Habits)}>
                        <Target size={20} /> Habits
                    </div>
                )}
                {enabledFeatures.includes('focus') && (
                    <div onClick={() => onChangeView(ViewType.Focus)} className={navItemClass(ViewType.Focus)}>
                        <Clock size={20} /> Focus
                    </div>
                )}
                {enabledFeatures.includes('finance') && (
                    <div onClick={() => onChangeView(ViewType.Finance)} className={navItemClass(ViewType.Finance)}>
                        <Wallet size={20} /> Finance
                    </div>
                )}

                <div className="py-4 px-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal/40 uppercase tracking-wider">Lists</span>
                    <button onClick={() => onAddList?.('New List', '#F4A58A')} className="p-1 bg-cream rounded-full text-charcoal hover:bg-yellow-soft transition-colors"><Plus size={14}/></button>
                </div>

                {lists.map(list => (
                    <div 
                        key={list.id} 
                        onClick={() => onChangeView(list.id)} 
                        className={navItemClass(list.id)}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: list.color }} />
                        <span className="truncate flex-1">{list.name}</span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4">
                <button 
                    onClick={onOpenSettings}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-cream text-charcoal font-bold text-sm hover:bg-charcoal hover:text-white transition-all"
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
            </div>
        </div>
    </>
  );
});

export default Sidebar;
