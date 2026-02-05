
import React, { useState } from 'react';
import { Task, List, Priority } from '../types';
import { Plus, MoreHorizontal, Circle, CheckCircle2, Menu } from 'lucide-react';
import { format } from 'date-fns';
import TaskInputSheet from './TaskInputSheet';

interface KanbanViewProps {
  tasks: Task[];
  lists: List[];
  onToggleTask: (taskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onMenuClick?: () => void;
  onAddTask: (task: Task) => void;
}

const KanbanView: React.FC<KanbanViewProps> = ({ tasks, lists, onToggleTask, onSelectTask, onMenuClick, onAddTask }) => {
  const allLists = [{ id: 'inbox', name: 'Inbox', color: '#3b82f6' }, ...lists];
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.High: return 'text-red-500';
      case Priority.Medium: return 'text-yellow-500';
      case Priority.Low: return 'text-blue-500';
      default: return 'text-slate-300';
    }
  };

  const SubtaskPie = ({ task }: { task: Task }) => {
      if (!task.subtasks || task.subtasks.length === 0) return null;
      const total = task.subtasks.length;
      const completed = task.subtasks.filter(s => s.isCompleted).length;
      const percentage = (completed / total) * 100;
      
      const radius = 5;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return (
          <div className="flex items-center gap-1" title={`${completed}/${total} subtasks`}>
              <div className="relative w-3 h-3 -rotate-90">
                  <svg className="w-full h-full">
                      <circle cx="50%" cy="50%" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                      <circle 
                        cx="50%" cy="50%" r={radius} fill="none" stroke="#3b82f6" strokeWidth="1.5" 
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                      />
                  </svg>
              </div>
              <span className="text-[9px] font-medium text-slate-500">{completed}/{total}</span>
          </div>
      );
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-100 overflow-hidden">
        {/* Header - Safe Area Wrapper */}
        <div className="pt-safe border-b border-slate-200 bg-white shrink-0">
            <div className="min-h-12 pb-2 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <button onClick={onMenuClick} className="p-1 -ml-1 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
                        <Menu size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-slate-800">Project Board</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">
                        Group by List
                    </button>
                </div>
            </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
            <div className="flex h-full gap-4 min-w-max">
                {allLists.map(list => {
                    const listTasks = tasks.filter(t => t.listId === list.id && !t.isCompleted);
                    
                    return (
                        <div key={list.id} className="w-64 flex flex-col h-full">
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: list.color }} />
                                    <h3 className="font-bold text-sm text-slate-700">{list.name}</h3>
                                    <span className="text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded-full shadow-sm">{listTasks.length}</span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal size={14} />
                                </button>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 pb-4">
                                {listTasks.map(task => (
                                    <div 
                                        key={task.id}
                                        onClick={() => onSelectTask(task.id)}
                                        className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                                className={`mt-0.5 ${getPriorityColor(task.priority)} hover:opacity-80 transition-opacity`}
                                            >
                                                <Circle size={14} />
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-slate-800 leading-tight mb-1">{task.title}</div>
                                                
                                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                    {task.tags.length > 0 && (
                                                        <>
                                                            {task.tags.map(tag => (
                                                                <span key={tag} className="text-[9px] font-medium bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </>
                                                    )}
                                                    <SubtaskPie task={task} />
                                                </div>

                                                {task.dueDate && (
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                                        <span className="text-[9px] font-medium text-red-500 bg-red-50 px-1 py-0.5 rounded">
                                                            {format(new Date(task.dueDate), 'MMM d')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={() => setActiveListId(list.id)}
                                    className="w-full py-1.5 flex items-center justify-center gap-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg border border-transparent hover:border-slate-200 border-dashed transition-all text-xs font-medium"
                                >
                                    <Plus size={14} /> Add Task
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        
        <TaskInputSheet 
            isOpen={!!activeListId}
            onClose={() => setActiveListId(null)}
            onAddTask={onAddTask}
            lists={lists}
            initialConfig={{ listId: activeListId || 'inbox' }}
        />
    </div>
  );
};

export default KanbanView;
