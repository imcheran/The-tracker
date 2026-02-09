
import React from 'react';
import { Layers, Calendar, Clock, Menu } from 'lucide-react';
import { ViewType } from '../types';

interface MobileNavigationProps {
  currentView: ViewType | string;
  onChangeView: (view: ViewType) => void;
  onMenuClick: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = React.memo(({ currentView, onChangeView, onMenuClick }) => {
  const navItems = [
    { id: ViewType.Inbox, icon: Layers, label: 'Tasks', color: 'text-blue-600 dark:text-blue-400' },
    { id: ViewType.Calendar, icon: Calendar, label: 'Calendar', color: 'text-rose-500' },
    { id: ViewType.Focus, icon: Clock, label: 'Focus', color: 'text-indigo-500' },
  ];

  return (
    <div 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-30 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
    >
      <div className="flex justify-between items-center h-14 px-4">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === ViewType.Inbox && (currentView === ViewType.All || currentView === ViewType.Today || currentView === ViewType.Next7Days));
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className="flex flex-col items-center justify-center min-w-[3.5rem] h-full gap-1 group relative"
            >
              <div className={`
                  p-1.5 rounded-xl transition-all duration-300
                  ${isActive ? `${item.color} -translate-y-1` : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}
              `}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold transition-all ${isActive ? `${item.color} scale-100` : 'text-slate-400 dark:text-slate-500 scale-90'}`}>
                  {item.label}
              </span>
            </button>
          );
        })}
        
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center min-w-[3.5rem] h-full gap-1 group"
        >
          <div className="p-1.5 rounded-xl text-slate-400 dark:text-slate-500 group-hover:text-slate-600 transition-all">
              <Menu size={22} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 scale-90">Menu</span>
        </button>
      </div>
    </div>
  );
});
