
import React from 'react';
import { X, Share2, User } from 'lucide-react';
import { Habit } from '../types';
import { format } from 'date-fns';

interface HabitShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
}

const HabitShareModal: React.FC<HabitShareModalProps> = ({ isOpen, onClose, habit }) => {
  if (!isOpen) return null;

  const calculateStats = () => {
      const dates = Object.keys(habit.history)
          .filter(d => habit.history[d].completed)
          .sort();
      
      const totalDays = dates.length;
      return { totalDays };
  };

  const { totalDays } = calculateStats();

  const handleShare = async () => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: habit.name,
                  text: `I have persisted for ${totalDays} days on ${habit.name}!`,
              });
          } catch (err) {
              console.error('Share failed', err);
          }
      } else {
          alert("Ready to capture! Take a screenshot to share.");
      }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="relative flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
        
        {/* The Card - Matching the screenshot */}
        <div className="w-[340px] aspect-[9/16] rounded-[24px] overflow-hidden relative shadow-2xl bg-[#6ee7b7] text-white flex flex-col select-none animate-in zoom-in-95 duration-500">
            
            {/* Top Bar */}
            <div className="flex justify-between items-center p-6">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{habit.icon}</span>
                    <span className="font-medium text-lg">{habit.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-80">
                    <span className="text-sm font-medium">TickTick</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col px-8 relative">
                
                <div className="mt-8 z-10">
                    <h1 className="text-3xl font-normal leading-tight opacity-90">
                        I have persisted<br/>
                        for <span className="font-bold text-4xl">{totalDays}</span> Days
                    </h1>
                    <div className="mt-2 text-sm opacity-60 font-medium">
                        — {format(new Date(), 'd MMM yyyy')} —
                    </div>
                </div>

                {/* Illustration Placeholder - Using SVG composition to mimic fruit bowl */}
                <div className="absolute right-[-40px] top-[140px] w-[300px] h-[300px]">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                        {/* Bowl */}
                        <path d="M20 120 Q 100 170 180 120" fill="#fef3c7" stroke="none" />
                        <ellipse cx="100" cy="120" rx="80" ry="15" fill="#fde68a" />
                        
                        {/* Watermelon */}
                        <path d="M30 110 L 80 110 A 25 25 0 0 1 55 135 Z" fill="#ef4444" transform="rotate(-15 55 120)" />
                        <path d="M30 110 L 80 110" stroke="#166534" strokeWidth="4" transform="rotate(-15 55 120)" />
                        
                        {/* Orange */}
                        <circle cx="110" cy="105" r="25" fill="#f97316" />
                        <circle cx="110" cy="105" r="22" fill="#fdba74" />
                        <path d="M110 80 L 110 130 M 85 105 L 135 105" stroke="#fff7ed" strokeWidth="2" />
                        
                        {/* Apple/Pear */}
                        <path d="M140 80 Q 170 80 160 120 Q 140 130 140 120 Q 140 130 120 120 Q 110 80 140 80" fill="#fef08a" />
                        
                        {/* Leaves */}
                        <path d="M160 120 Q 180 100 190 110" fill="none" stroke="#22c55e" strokeWidth="3" />
                        <circle cx="170" cy="110" r="3" fill="#22c55e" />
                        
                        {/* Sparkles */}
                        <rect x="40" y="50" width="8" height="8" transform="rotate(45 44 54)" fill="white" />
                        <rect x="170" y="40" width="6" height="6" transform="rotate(45 173 43)" fill="white" />
                    </svg>
                </div>
            </div>

            {/* Footer Profile */}
            <div className="p-6 mt-auto">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50">
                        <div className="w-full h-full bg-orange-200 flex items-center justify-center">
                            <User size={20} className="text-orange-600"/>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-sm uppercase tracking-wide">CHERAN G</span>
                        <span className="text-[10px] opacity-70">An invitation for a self-disciplined life</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <div className="flex gap-4">
            <button 
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
            >
                <X size={24} />
            </button>
            <button 
                onClick={handleShare}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 hover:bg-blue-700"
            >
                <Share2 size={18} />
                Share
            </button>
        </div>

      </div>
    </div>
  );
};

export default HabitShareModal;
