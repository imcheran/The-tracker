import React from 'react';
import { X, Zap } from 'lucide-react';
import { Habit } from '../types';
import { format } from 'date-fns';

interface HabitReminderSheetProps {
  habit: Habit;
  onClose: () => void;
  onCheckIn: () => void;
  onFocus?: () => void;
}

export const HabitReminderSheet: React.FC<HabitReminderSheetProps> = ({ habit, onClose, onCheckIn, onFocus }) => {
  // Calculate progress for the arc
  const totalDays = Object.keys(habit.history).length;
  // Visual progress (mock logic: progress towards goal or generic fill)
  const progressPercent = Math.min(100, (totalDays / 21) * 100); // Assume 21 days to form habit logic for visual
  
  // Circle geometry for Arc
  const size = 172;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc is usually ~240 degrees in these views, but let's do a full circle or 3/4
  // If ArcProgressView implies an open arc (like a speedometer), we adjust.
  // Standard TickTick reminder is often a full circle. Let's assume full circle for simplicity or 270deg.
  // Let's go with full circle for "completion" feel.
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 transition-opacity pointer-events-auto" 
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="w-full sm:w-[400px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-android-bottom-sheet relative">
        <div className="h-[500px] relative flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-start p-5">
                <span className="text-sm font-medium text-blue-600 mt-2 ml-2">
                    {format(new Date(), 'EEE, MMM d')}
                </span>
                
                <div className="flex items-center gap-1">
                    <button 
                        onClick={onFocus}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                        title="Focus"
                    >
                        <Zap size={20} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Arc Progress Section */}
            <div className="flex-1 flex flex-col items-center pt-4">
                <div className="relative w-[172px] h-[172px] flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth={strokeWidth}
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r={radius}
                            fill="none"
                            stroke={habit.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    
                    {/* Habit Icon */}
                    <div className="text-5xl animate-in zoom-in duration-500">
                        {habit.icon}
                    </div>
                </div>

                {/* Habit Name & Content */}
                <div className="mt-8 text-center px-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 truncate">
                        {habit.name}
                    </h2>
                    <p className="text-slate-400 text-sm h-6">
                        {habit.description || "Keep it up!"}
                    </p>
                </div>
            </div>

            {/* Bottom Buttons */}
            <div className="p-5 pb-8">
                <div className="flex items-center justify-between text-sm font-bold">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Skip
                    </button>
                    <button 
                         onClick={onClose}
                        className="flex-1 py-3 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Snooze
                    </button>
                    <button 
                        onClick={() => { onCheckIn(); onClose(); }}
                        className="flex-1 py-3 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        style={{ color: habit.color }}
                    >
                        Check In
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default HabitReminderSheet;