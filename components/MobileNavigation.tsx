
import React from 'react';
import { Layers, Calendar, Clock, Menu, Wallet } from 'lucide-react';
import { ViewType } from '../types';

interface MobileNavigationProps {
  currentView: ViewType | string;
  onChangeView: (view: ViewType) => void;
  onMenuClick: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = React.memo(({ currentView, onChangeView, onMenuClick }) => {
  const navItems = [
    { id: ViewType.Inbox, icon: Layers },
    { id: ViewType.Calendar, icon: Calendar },
    { id: ViewType.Focus, icon: Clock },
    { id: ViewType.Finance, icon: Wallet },
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 flex justify-center pb-safe">
      <div className="bg-white/90 backdrop-blur-lg rounded-full shadow-organic px-2 py-2 flex items-center justify-between w-full max-w-sm border border-white/50">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === ViewType.Inbox && (currentView === ViewType.All || currentView === ViewType.Today));
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewType)}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                ${isActive ? 'bg-charcoal text-yellow-soft scale-110 shadow-lg' : 'text-charcoal/50 hover:bg-cream hover:text-charcoal'}
              `}
            >
              <item.icon size={22} strokeWidth={2.5} />
            </button>
          );
        })}
        
        <button
          onClick={onMenuClick}
          className="w-12 h-12 rounded-full flex items-center justify-center text-charcoal/50 hover:bg-cream hover:text-charcoal transition-all"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});
