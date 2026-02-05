import React from 'react';
import { Check } from 'lucide-react';

interface ThemeStepProps {
  selected: string;
  onSelect: (id: string) => void;
}

export const ThemeStep: React.FC<ThemeStepProps> = ({ selected, onSelect }) => {
  const themes = [
    { id: 'blue', color: '#3b82f6', name: 'TickBlue' },
    { id: 'green', color: '#10b981', name: 'Mint' },
    { id: 'orange', color: '#f59e0b', name: 'Sunset' },
    { id: 'purple', color: '#8b5cf6', name: 'Grape' },
    { id: 'slate', color: '#475569', name: 'Dark' },
  ];

  return (
    <div className="flex flex-col h-full px-4 pt-8 max-w-sm mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Pick a theme</h2>
        <p className="text-slate-500 text-sm">Make it feel like home. You can switch themes anytime.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
          {themes.map(t => (
            <div 
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected === t.id ? 'bg-white border-cyan-400 shadow-md transform scale-105' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
            >
               <div className="w-12 h-12 rounded-full shadow-md flex items-center justify-center text-white transition-transform" style={{ backgroundColor: t.color }}>
                  {selected === t.id && <Check size={24} strokeWidth={3} />}
               </div>
               <span className={`text-lg font-medium ${selected === t.id ? 'text-slate-800' : 'text-slate-500'}`}>{t.name}</span>
            </div>
          ))}
      </div>
    </div>
  );
};