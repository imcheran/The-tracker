
import React, { useState } from 'react';
import { Task, Priority, ViewType, List, AppSettings, Habit } from '../types';
import { 
  Plus, Inbox, Menu, MoreVertical, Eye, EyeOff, Notebook
} from 'lucide-react';
import { isSameDay, addDays, isBefore } from 'date-fns';
import TaskInputSheet from './TaskInputSheet';
import TaskItem from './TaskItem';

interface TaskViewProps {
  tasks: Task[];
  lists: List[];
  viewType: ViewType | string;
  searchQuery?: string;
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onSelectTask: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onMenuClick?: () => void;
  onChangeView?: (view: ViewType | string) => void;
  settings?: AppSettings;
  habits?: Habit[];
  onUpdateHabit?: (habit: Habit) => void;
  user?: any;
}

const TaskView: React.FC<TaskViewProps> = ({ 
    tasks, lists, viewType, searchQuery, onToggleTask, onAddTask, onUpdateTask, onSelectTask, onMenuClick
}) => {
  const [showInputSheet, setShowInputSheet] = useState(false);
  const [isSimplifiedView, setIsSimplifiedView] = useState(false);
  
  // Determine filter logic
  const isNotesView = viewType === ViewType.Notes;
  const filteredTasks = tasks.filter(task => {
      if (task.isDeleted) return false;
      const matchesSearch = searchQuery 
        ? (task.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      if (!matchesSearch) return false;
      
      if (isNotesView) return task.isNote === true;
      if (task.isNote && viewType !== ViewType.All && viewType !== ViewType.Search) return false;
      
      const today = new Date();
      switch (viewType) {
          case ViewType.Inbox: return task.listId === 'inbox' && !task.isCompleted && !task.isEvent;
          case ViewType.Today: return task.dueDate && isSameDay(new Date(task.dueDate), today) && !task.isCompleted;
          case ViewType.All: return !task.isCompleted;
          default: return task.listId === viewType && !task.isCompleted;
      }
  }).sort((a, b) => (b.priority - a.priority));

  const getHeaderTitle = () => {
      if (searchQuery) return 'Search';
      switch (viewType) {
          case ViewType.Inbox: return 'Inbox';
          case ViewType.Today: return 'Today';
          case ViewType.Notes: return 'Notes';
          default: return lists.find(l => l.id === viewType)?.name || 'Tasks';
      }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="md:hidden p-3 bg-white rounded-full shadow-organic text-charcoal hover:scale-105 transition-transform">
                        <Menu size={24} />
                    </button>
                </div>
                
                {!isNotesView && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsSimplifiedView(!isSimplifiedView)} className="p-3 bg-white rounded-full shadow-organic text-charcoal/50 hover:text-charcoal transition-colors">
                            {isSimplifiedView ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                        <button className="p-3 bg-white rounded-full shadow-organic text-charcoal/50 hover:text-charcoal transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                )}
            </div>
            
            <h1 className="text-[48px] font-black text-charcoal tracking-tighter mt-4 leading-[1.1]">
                {getHeaderTitle()}
            </h1>
            <p className="text-charcoal/50 font-medium text-lg ml-1 mt-1">{filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'} pending</p>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-32 pt-4">
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-40">
                    <div className="w-40 h-40 bg-white rounded-full shadow-organic flex items-center justify-center mb-6">
                        {isNotesView ? <Notebook size={64} className="text-charcoal"/> : <Inbox size={64} className="text-charcoal"/>}
                    </div>
                    <p className="text-charcoal font-bold text-xl">All clear for now</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTasks.map(task => (
                        <TaskItem 
                            key={task.id}
                            task={task}
                            onToggle={(id) => onToggleTask(id)}
                            onSelect={(id) => onSelectTask(id)}
                            selected={false}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* FAB */}
        <div className="fixed bottom-24 right-6 z-40">
            <button 
                onClick={() => setShowInputSheet(true)}
                className="w-16 h-16 rounded-[24px] bg-charcoal text-white shadow-organic flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
                <Plus size={32} strokeWidth={3} />
            </button>
        </div>

        <TaskInputSheet 
            isOpen={showInputSheet}
            onClose={() => setShowInputSheet(false)}
            onAddTask={onAddTask}
            lists={lists}
            initialConfig={{ listId: (!isNotesView && viewType !== ViewType.Inbox) ? viewType : 'inbox', isNote: isNotesView }}
        />
    </div>
  );
};

export default TaskView;
