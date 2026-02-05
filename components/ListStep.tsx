import React from 'react';
import { Briefcase, User, ShoppingCart, Dumbbell, Plane, Book } from 'lucide-react';

interface ListStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

export const ListStep: React.FC<ListStepProps> = ({ selected, onToggle }) => {
  const lists = [
    { id: 'Work', icon: Briefcase, color: '#3b82f6' },
    { id: 'Personal', icon: User, color: '#10b981' },
    { id: 'Shopping', icon: ShoppingCart, color: '#f59e0b' },
    { id: 'Fitness', icon: Dumbbell, color: '#ef4444' },
    { id: 'Travel', icon: Plane, color: '#8b5cf6' },
    { id: 'Reading', icon: Book, color: '#ec4899' },
  ];

  return (
    <div className="flex flex-col h-full px-4 pt-8 max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Create your first lists</h2>
        <p className="text-slate-500 text-sm">Organize your tasks into categories to keep things tidy.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
         {lists.map(l => {
           const isSelected = selected.includes(l.id);
           return (
             <button
               key={l.id}
               onClick={() => onToggle(l.id)}
               className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${isSelected ? 'border-current bg-opacity-5 shadow-sm scale-105' : 'border-slate-100 bg-white hover:border-slate-200'}`}
               style={{ 
                   borderColor: isSelected ? l.color : undefined,
                   backgroundColor: isSelected ? `${l.color}10` : undefined
               }}
             >
                <div 
                    className="mb-3 p-3 rounded-full transition-colors" 
                    style={{ backgroundColor: isSelected ? l.color : '#f1f5f9', color: isSelected ? 'white' : '#94a3b8' }}
                >
                    <l.icon size={24} />
                </div>
                <span className={`font-bold text-sm ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>{l.id}</span>
             </button>
           );
         })}
      </div>
    </div>
  );
};