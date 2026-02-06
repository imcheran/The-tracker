
import React from 'react';
import { Task, Priority } from '../types';
import { format, isBefore, isSameDay } from 'date-fns';
import { Calendar, Flag, Tag, Check } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selected: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onSelect, selected }) => {
  
  const priorityConfig = {
    [Priority.High]: { bg: 'bg-coral', text: 'text-white' },
    [Priority.Medium]: { bg: 'bg-yellow-soft', text: 'text-charcoal' },
    [Priority.Low]: { bg: 'bg-cream', text: 'text-charcoal' },
    [Priority.None]: { bg: 'bg-gray-100', text: 'text-gray-400' }
  };

  const isOverdue = task.dueDate && 
    isBefore(new Date(task.dueDate), new Date()) && 
    !isSameDay(new Date(task.dueDate), new Date()) && 
    !task.isCompleted;

  return (
    <div 
      onClick={() => onSelect(task.id)}
      className={`
        group relative p-5 rounded-card cursor-pointer transition-all duration-300
        bg-white shadow-organic hover:shadow-organic-hover hover:-translate-y-1
        ${selected ? 'ring-2 ring-charcoal' : ''}
        ${task.isCompleted ? 'opacity-50 grayscale' : ''}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Organic Checkbox */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className={`
            w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 mt-0.5 border-2
            ${task.isCompleted 
                ? 'bg-yellow-soft border-yellow-soft text-charcoal' 
                : 'bg-transparent border-charcoal/10 hover:border-yellow-soft text-transparent hover:text-yellow-soft/50'
            }
          `}
        >
          <Check size={16} strokeWidth={4} />
        </button>

        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h3 className={`text-lg font-bold truncate pr-2 ${task.isCompleted ? 'line-through text-charcoal/40' : 'text-charcoal'}`}>
                    {task.title}
                </h3>
                {task.priority !== Priority.None && (
                    <div className={`w-3 h-3 rounded-full ${priorityConfig[task.priority].bg} shrink-0 mt-2`} />
                )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-3">
                {task.dueDate && (
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isOverdue ? 'bg-coral text-white' : 'bg-cream text-charcoal/70'}`}>
                        <Calendar size={12} />
                        <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                    </div>
                )}
                
                {task.tags.length > 0 && (
                    <div className="flex items-center gap-1 text-xs font-bold text-charcoal/50 bg-gray-50 px-3 py-1.5 rounded-full">
                        <Tag size={12} />
                        <span className="truncate max-w-[100px]">{task.tags.join(', ')}</span>
                    </div>
                )}
            </div>
            
            {task.description && (
                <p className="text-sm text-charcoal/60 mt-2 line-clamp-2 font-medium leading-relaxed">
                    {task.description.replace(/<[^>]*>?/gm, '')}
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
