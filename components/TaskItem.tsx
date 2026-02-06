
import React from 'react';
import { Task, Priority } from '../types';
import { format, isSameDay, isBefore } from 'date-fns';
import { Calendar, Flag, Tag, Check, Circle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selected: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onSelect, selected }) => {
  const priorityColor = {
    [Priority.High]: 'text-red-500',
    [Priority.Medium]: 'text-yellow-500',
    [Priority.Low]: 'text-blue-500',
    [Priority.None]: 'text-slate-300 dark:text-slate-600'
  };

  // isPast polyfill
  const isOverdue = task.dueDate && 
    isBefore(new Date(task.dueDate), new Date()) && 
    !isSameDay(new Date(task.dueDate), new Date()) && 
    !task.isCompleted;

  return (
    <div 
      onClick={() => onSelect(task.id)}
      className={`
        group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 ease-out border border-white/40 dark:border-white/5
        ${selected 
            ? 'bg-blue-50 dark:bg-blue-900/20 shadow-soft-pressed dark:shadow-soft-dark-pressed' 
            : 'bg-surface-light dark:bg-surface-dark shadow-soft-sm dark:shadow-soft-dark-sm hover:-translate-y-1 hover:shadow-soft dark:hover:shadow-soft-dark'
        }
        ${task.isCompleted ? 'opacity-60 grayscale' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Neumorphic Checkbox */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`
            w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 mt-0.5
            ${task.isCompleted 
                ? 'bg-primary-500 text-white shadow-inner' 
                : 'bg-background-light dark:bg-background-dark shadow-soft-pressed dark:shadow-soft-dark-pressed text-transparent hover:text-slate-300'
            }
          `}
        >
          <Check size={14} strokeWidth={4} />
        </button>

        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h3 className={`text-base font-bold truncate pr-2 ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                    {task.title}
                </h3>
                {task.priority !== Priority.None && (
                    <Flag size={14} className={`${priorityColor[task.priority]} shrink-0 mt-1`} fill="currentColor" />
                )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
                {task.dueDate && (
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <Calendar size={12} />
                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                    </div>
                )}
                
                {task.tags.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                        <Tag size={12} />
                        <span className="truncate max-w-[100px]">{task.tags.join(', ')}</span>
                    </div>
                )}
            </div>
            
            {task.description && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-1 font-medium">
                    {task.description.replace(/<[^>]*>?/gm, '')}
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
