
import React, { useState, useEffect } from 'react';
import { Play, Pause, Menu, Zap } from 'lucide-react';
import { FocusCategory, Task, FocusSession } from '../types';

interface FocusViewProps {
  categories: FocusCategory[];
  activeTask?: Task;
  onFocusComplete: (session: FocusSession) => void;
  onMenuClick?: () => void;
}

const FocusView: React.FC<FocusViewProps> = ({ 
    activeTask, onMenuClick
}) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeLeft / (25 * 60));

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="pt-6 px-6 pb-2 shrink-0 flex justify-between items-center">
          <button onClick={onMenuClick} className="md:hidden p-3 bg-white rounded-full shadow-organic text-charcoal">
               <Menu size={24}/>
          </button>
          <h1 className="text-[40px] font-black text-charcoal tracking-tight">Focus</h1>
          <div className="w-12"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">
          {/* Organic Timer Circle */}
          <div className="relative w-[320px] h-[320px] flex items-center justify-center mb-12">
              <svg className="absolute inset-0 w-full h-full -rotate-90 overflow-visible">
                  {/* Track */}
                  <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#FFFFFF" strokeWidth="24" className="shadow-sm" />
                  {/* Progress */}
                  <circle 
                      cx="50%" cy="50%" r="45%" fill="none" stroke="#F4D06F" strokeWidth="24" 
                      strokeDasharray={2 * Math.PI * (144)} // approx
                      strokeDashoffset={2 * Math.PI * (144) * (1 - progress)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear drop-shadow-md"
                  />
              </svg>
              
              <div className="flex flex-col items-center z-10">
                  <div className="text-[72px] font-black text-charcoal tracking-tighter tabular-nums leading-none">
                      {formatTime(timeLeft)}
                  </div>
                  <div className="text-charcoal/40 font-bold mt-2 uppercase tracking-widest text-sm">
                      {isActive ? 'Focusing' : 'Ready'}
                  </div>
              </div>
          </div>

          <div className="flex gap-6">
              <button 
                  onClick={() => setIsActive(!isActive)}
                  className="w-24 h-24 bg-charcoal text-white rounded-[32px] shadow-organic flex items-center justify-center hover:scale-105 transition-transform"
              >
                  {isActive ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor"/>}
              </button>
          </div>
          
          {activeTask && (
              <div className="mt-12 bg-white px-6 py-3 rounded-full shadow-organic flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-coral animate-pulse"></div>
                  <span className="font-bold text-charcoal">{activeTask.title}</span>
              </div>
          )}
      </div>
    </div>
  );
};

export default FocusView;
