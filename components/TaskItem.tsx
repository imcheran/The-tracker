
import React from 'react';
import { Task, Priority } from '../types';
import { format, isSameDay, isBefore } from 'date-fns';
import { Calendar, Flag, Tag } from 'lucide-react';

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
    [Priority.None]: 'text-slate-300'
  };

  // isPast polyfill: check if due date is before now and not today
  const isOverdue = task.dueDate && 
    isBefore(new Date(task.dueDate), new Date()) && 
    !isSameDay(new Date(task.dueDate), new Date()) && 
    !task.isCompleted;

  return (
    <div 
      onClick={() => onSelect(task.id)}
      className={`
        group flex items-start gap-3 p-3 rounded-lg border-b border-slate-100 cursor-pointer transition-all hover:shadow-md
        ${selected ? 'bg-blue-50 border-blue-100' : 'bg-white hover:bg-slate-50'}
        ${task.isCompleted ? 'opacity-60' : ''}
      `}
    >
      <div className="pt-1">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`
            w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${task.isCompleted 
                ? 'bg-blue-500 border-blue-500' 
                : `border-slate-300 hover:border-blue-500 ${priorityColor[task.priority].replace('text-', 'border-')}`
            }
          `}
        >
          {task.isCompleted && <div className="w-2.5 h-1.5 border-b-2 border-l-2 border-white -rotate-45 -mt-0.5" />}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
            {task.title}
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            {task.dueDate && (
                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                    <Calendar size={12} />
                    <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                </div>
            )}
            
            {task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                    <Tag size={12} />
                    <span className="truncate max-w-[100px]">{task.tags.join(', ')}</span>
                </div>
            )}

            <Flag size={12} className={priorityColor[task.priority]} />
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
