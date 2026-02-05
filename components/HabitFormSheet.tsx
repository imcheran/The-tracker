
import React, { useState, useEffect } from 'react';
import { Habit, HabitFrequencyType, HabitSection } from '../types';
import { 
  X, Check, ChevronRight, ChevronLeft, Plus, 
  Calendar, Clock, Bell, RefreshCw, Sun, Moon, Coffee, 
  Layout, Target, Quote, Image as ImageIcon,
  ArrowRight, ArrowLeft, Trash2, Settings, LayoutTemplate,
  ChevronDown
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { WheelPicker } from './WheelPicker';

interface HabitFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  initialData?: Habit;
}

const ICONS = ['💧', '📚', '🏃', '🧘', '🍎', '💤', '🎸', '💰', '🧹', '💊', '🐶', '🌿', '🏋️', '📝', '🎨', '💻', '🚲', '🏊', '🎹', '🎮'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];
const UNITS = ['Count', 'Cup', 'Milliliter', 'Minute', 'Hour', 'Kilometer', 'Page', 'Custom Unit'];

const CATEGORIES: Record<string, { name: string, icon: string, quote: string, color: string }[]> = {
    'Suggested': [
        { name: 'Drink water', icon: '💧', quote: 'Stay moisturized', color: '#3b82f6' },
        { name: 'Eat fruits', icon: '🍌', quote: 'Stay healthier, stay happier', color: '#84cc16' },
        { name: 'Early to rise', icon: '☀️', quote: 'Get up and be amazing', color: '#facc15' },
        { name: 'Read', icon: '📘', quote: 'A chapter a day lights your way', color: '#3b82f6' },
        { name: 'Meditate', icon: '🧘', quote: 'Find your inner peace', color: '#10b981' },
    ],
    'Health': [
        { name: 'No sugar', icon: '🚫', quote: 'Sweet enough already', color: '#ef4444' },
        { name: 'Take vitamins', icon: '💊', quote: 'Boost your health', color: '#facc15' },
        { name: 'Sleep 8 hours', icon: '😴', quote: 'Rest and recharge', color: '#6366f1' },
        { name: 'Walk', icon: '🚶', quote: 'Keep moving', color: '#10b981' },
    ]
};

const SECTIONS: HabitSection[] = ['Morning', 'Afternoon', 'Night', 'Others'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const HabitFormSheet: React.FC<HabitFormSheetProps> = ({ isOpen, onClose, onSave, initialData }) => {
  // Navigation State
  const [step, setStep] = useState<'gallery' | 'basics' | 'settings'>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<string>('Suggested');
  
  // Data State
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  
  // Settings State
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([0,1,2,3,4,5,6]); // All days
  const [frequencyCount, setFrequencyCount] = useState<number>(1);
  const [section, setSection] = useState<HabitSection>('Morning');
  const [startDate, setStartDate] = useState(new Date());
  const [goalDaysOption, setGoalDaysOption] = useState<string>('Forever');
  const [customGoalDays, setCustomGoalDays] = useState<string>('');
  
  const [reminders, setReminders] = useState<string[]>([]);
  const [isAutoLog, setIsAutoLog] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  
  // Goal State
  const [goalType, setGoalType] = useState<'all' | 'amount'>('all');
  const [targetValue, setTargetValue] = useState<string>('1');
  const [unit, setUnit] = useState('Count');
  
  // Modal Visibility
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showGoalDaysModal, setShowGoalDaysModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setStep('settings');
            loadData(initialData);
        } else {
            setStep('gallery');
            resetData();
        }
    }
  }, [isOpen, initialData]);

  const resetData = () => {
      setName('');
      setQuote('');
      setIcon(ICONS[0]);
      setColor(COLORS[0]);
      setFrequencyType('daily');
      setFrequencyDays([0,1,2,3,4,5,6]);
      setFrequencyCount(1);
      setSection('Morning');
      setStartDate(new Date());
      setGoalDaysOption('Forever');
      setCustomGoalDays('');
      setReminders([]);
      setGoalType('all');
      setTargetValue('1');
      setUnit('Count');
      setIsAutoLog(false);
      setShowWidget(false);
      setSelectedCategory('Suggested');
  };

  const loadData = (data: Habit) => {
      setName(data.name);
      setQuote(data.quote || '');
      setIcon(data.icon);
      setColor(data.color);
      setFrequencyType(data.frequencyType || 'daily');
      setFrequencyDays(data.frequencyDays || [0,1,2,3,4,5,6]);
      setFrequencyCount(data.frequencyCount || 1);
      setSection(data.section || 'Morning');
      setStartDate(data.startDate ? new Date(data.startDate) : new Date());
      
      // Calculate Goal Days Option
      if (!data.endDate) {
          setGoalDaysOption('Forever');
      } else {
          const start = data.startDate ? new Date(data.startDate) : new Date();
          const end = new Date(data.endDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if ([7, 21, 30, 100, 365].includes(diffDays)) {
              setGoalDaysOption(`${diffDays} Days`);
          } else {
              setGoalDaysOption('Custom');
              setCustomGoalDays(diffDays.toString());
          }
      }

      setReminders(data.reminders || []);
      
      if (data.targetValue) {
          setGoalType('amount');
          setTargetValue(data.targetValue.toString());
          setUnit(data.unit || 'Count');
      } else {
          setGoalType('all');
      }
      
      setIsAutoLog(data.isAutoLog || false);
      setShowWidget(data.showWidget || false);
  };

  const handleSelectPreset = (preset: any) => {
      setName(preset.name);
      setIcon(preset.icon);
      setQuote(preset.quote);
      setColor(preset.color);
      setStep('basics');
  };

  const handleSave = () => {
    let endDate: Date | undefined = undefined;
    
    if (goalDaysOption !== 'Forever') {
        const days = goalDaysOption === 'Custom' ? parseInt(customGoalDays) : parseInt(goalDaysOption.split(' ')[0]);
        if (!isNaN(days) && days > 0) {
            endDate = addDays(startDate, days);
        }
    }

    const newHabit: Habit = {
      id: initialData?.id || Date.now().toString(),
      name,
      icon,
      color,
      description: quote,
      quote,
      goal: frequencyType === 'daily' ? frequencyDays.length : frequencyCount,
      frequencyType,
      frequencyDays,
      frequencyCount,
      section,
      startDate,
      endDate,
      reminders,
      targetValue: goalType === 'amount' ? parseFloat(targetValue) : undefined,
      unit: goalType === 'amount' ? unit : undefined,
      isAutoLog,
      showWidget,
      history: initialData?.history || {},
      createdDate: initialData?.createdDate || new Date(),
    };
    onSave(newHabit);
    onClose();
  };

  const toggleDay = (dayIndex: number) => {
      if (frequencyDays.includes(dayIndex)) {
          if (frequencyDays.length > 1) {
              setFrequencyDays(frequencyDays.filter(d => d !== dayIndex));
          }
      } else {
          setFrequencyDays([...frequencyDays, dayIndex].sort());
      }
  };

  const addReminder = () => {
      setReminders([...reminders, "09:00"]);
  };

  const removeReminder = (index: number) => {
      setReminders(reminders.filter((_, i) => i !== index));
  };

  const handleFreqTypeChange = (type: HabitFrequencyType) => {
      setFrequencyType(type);
      if (type === 'weekly') setFrequencyCount(3);
      if (type === 'interval') setFrequencyCount(2); 
      if (type === 'daily') setFrequencyDays([0,1,2,3,4,5,6]);
  };

  if (!isOpen) return null;

  if (step === 'gallery') {
      return (
        <div className="fixed inset-0 z-[60] bg-[#1e293b] animate-android-view flex flex-col text-white">
            <div className="pt-safe bg-[#1e293b] shrink-0 border-b border-slate-700/50">
                <div className="h-14 flex items-center justify-between px-4">
                    <div className="flex items-center">
                        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:bg-slate-800 rounded-full"><ArrowLeft size={24}/></button>
                        <span className="text-lg font-bold ml-2">Gallery</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <button onClick={() => { resetData(); setStep('basics'); }} className="p-2 bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 rounded-full"><Plus size={20}/></button>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 px-6 py-4 border-b border-slate-700/50 overflow-x-auto no-scrollbar shrink-0">
                {Object.keys(CATEGORIES).map((cat) => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-sm font-bold whitespace-nowrap cursor-pointer pb-2 border-b-2 transition-colors ${
                            selectedCategory === cat 
                            ? 'text-white border-orange-500' 
                            : 'text-slate-500 border-transparent hover:text-slate-400'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1e293b]">
                {CATEGORIES[selectedCategory]?.map((p, i) => (
                    <div key={i} className="bg-[#293548] p-4 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer hover:bg-[#334155] transition-colors group" onClick={() => handleSelectPreset(p)}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: `${p.color}20` }}>
                                {p.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">{p.name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{p.quote}</p>
                            </div>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-slate-600 group-hover:text-white transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-[#1e293b] border-t border-slate-700/50 pb-safe shrink-0">
                <button 
                    onClick={() => { resetData(); setStep('basics'); }}
                    className="w-full py-3 bg-[#e65100] hover:bg-[#ef6c00] text-white font-bold rounded-full shadow-lg transition-transform active:scale-95"
                >
                    Create a new habit
                </button>
            </div>
        </div>
      );
  }

  if (step === 'basics') {
      return (
        <div className="fixed inset-0 z-[60] bg-slate-900 text-white animate-android-view flex flex-col">
            <div className="pt-safe bg-slate-900 shrink-0">
                <div className="h-14 flex items-center px-4">
                    <button onClick={() => setStep('gallery')} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full"><ArrowLeft size={24}/></button>
                    <span className="text-lg font-bold ml-2">New Habit</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400">Name</label>
                    <div className="bg-slate-800 rounded-xl flex items-center px-4 py-3">
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-white text-lg font-medium placeholder-slate-600"
                            placeholder="Habit Name"
                            autoFocus
                        />
                        {name && <button onClick={() => setName('')} className="p-1 bg-slate-700 rounded-full text-slate-400"><X size={14}/></button>}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-400">Icon</label>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: color }}>
                            {icon}
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-2xl p-4">
                        <div className="grid grid-cols-7 gap-3">
                            {ICONS.map(i => (
                                <button
                                    key={i}
                                    onClick={() => setIcon(i)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${icon === i ? 'bg-slate-700 scale-110 ring-2 ring-orange-500' : 'bg-slate-900 hover:bg-slate-700'}`}
                                >
                                    {i}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6 overflow-x-auto pb-2 no-scrollbar">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${color === c ? 'scale-110 ring-2 ring-white' : ''}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                         <label className="text-sm font-bold text-slate-400">Quote</label>
                         <RefreshCw size={14} className="text-orange-500" />
                    </div>
                    <div className="bg-slate-800 rounded-xl px-4 py-3">
                        <input 
                            value={quote}
                            onChange={(e) => setQuote(e.target.value)}
                            className="w-full bg-transparent border-none outline-none text-slate-300 text-sm placeholder-slate-600"
                            placeholder="Motivate yourself..."
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 pb-safe shrink-0">
                <button 
                    onClick={() => setStep('settings')}
                    disabled={!name}
                    className="w-full py-3 bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-full shadow-lg hover:bg-orange-600 transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
      );
  }

  const ArrowIcon = <ChevronRight size={16} className="text-slate-500" />;
  
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900 text-white animate-android-view flex flex-col">
        {/* Header */}
        <div className="pt-safe bg-slate-900 shrink-0 border-b border-slate-800/50">
            <div className="h-14 flex items-center justify-between px-4">
                <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full"><X size={24}/></button>
                <span className="text-lg font-bold">Edit Habit</span>
                <button onClick={handleSave} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full"><Check size={24}/></button>
            </div>
        </div>

        {/* Name & Icon Row */}
        <div className="p-4 flex items-center gap-4 bg-[#232323]">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl relative" style={{ backgroundColor: `${color}20` }}>
                {icon}
                <div className="absolute bottom-0 right-0 bg-slate-700 rounded-full p-0.5 border border-[#232323]">
                    <Settings size={10} className="text-white"/>
                </div>
            </div>
            <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">Name & Icon</div>
                <div className="bg-slate-800 rounded-lg px-3 py-2 text-slate-200 font-medium">
                    {name}
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
            
            {/* Frequency Section */}
            <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-4">
                <label className="text-slate-400 text-sm font-medium">Frequency</label>
                
                <div className="flex gap-6 border-b border-slate-700 pb-2">
                    {(['daily', 'weekly', 'interval'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => handleFreqTypeChange(f)}
                            className={`pb-2 text-xs font-bold uppercase transition-colors relative ${frequencyType === f ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {f}
                            {frequencyType === f && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"/>}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center min-h-[60px] items-center w-full">
                    {frequencyType === 'daily' && (
                        <div className="flex justify-between w-full">
                            {WEEKDAYS.map((day, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleDay(i)}
                                    className={`w-9 h-9 rounded-full text-xs font-bold transition-all ${frequencyDays.includes(i) ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    )}
                    {frequencyType === 'weekly' && (
                        <div className="w-full h-32 relative">
                             <WheelPicker 
                                items={['1', '2', '3', '4', '5', '6']} 
                                selected={frequencyCount.toString()} 
                                onSelect={(val) => setFrequencyCount(parseInt(val))} 
                                height={120}
                                itemHeight={40}
                             />
                             <div className="absolute right-10 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">days per week</div>
                        </div>
                    )}
                    {frequencyType === 'interval' && (
                        <div className="w-full h-32 relative flex justify-center gap-4">
                             <div className="flex items-center text-slate-400 font-medium text-sm">Every</div>
                             <div className="w-20">
                                <WheelPicker 
                                    items={Array.from({length: 30}, (_, i) => (i+1).toString())} 
                                    selected={frequencyCount.toString()} 
                                    onSelect={(val) => setFrequencyCount(parseInt(val))} 
                                    height={120}
                                    itemHeight={40}
                                />
                             </div>
                             <div className="flex items-center text-slate-400 font-medium text-sm">days</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Settings Group */}
            <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden divide-y divide-slate-800">
                
                {/* Goal Row */}
                <div onClick={() => setShowGoalModal(true)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <span className="font-medium text-slate-200 text-sm">Goal</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">{goalType === 'all' ? 'Achieve it all' : `${targetValue} ${unit}`}</span>
                        {ArrowIcon}
                    </div>
                </div>

                {/* Start Date */}
                <div onClick={() => setShowStartDateModal(true)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <span className="font-medium text-slate-200 text-sm">Start Date</span>
                    <div className="flex items-center gap-2">
                         <span className="text-sm text-slate-500">{format(startDate, 'MMM d')}</span>
                         {ArrowIcon}
                    </div>
                </div>

                {/* Goal Days */}
                <div onClick={() => setShowGoalDaysModal(true)} className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-slate-200 text-sm">Goal Days</span>
                        <div className="w-3 h-3 rounded-full border border-slate-500 text-[8px] flex items-center justify-center text-slate-500">i</div>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-sm text-slate-500">{goalDaysOption === 'Custom' ? `${customGoalDays} Days` : goalDaysOption}</span>
                         {ArrowIcon}
                    </div>
                </div>
            </div>

            {/* Section & Reminder */}
            <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200 text-sm">Section</span>
                    <Plus size={16} className="text-slate-500"/>
                 </div>
                 <div className="flex gap-2 overflow-x-auto no-scrollbar">
                     {SECTIONS.map(s => (
                         <button 
                            key={s} 
                            onClick={() => setSection(s)}
                            className={`px-4 py-2 text-xs font-bold rounded-full transition-colors whitespace-nowrap ${section === s ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                        >
                             {s}
                         </button>
                     ))}
                 </div>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200 text-sm">Reminder</span>
                </div>
                {reminders.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {reminders.map((r, i) => (
                            <div key={i} className="flex items-center gap-2 bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold">
                                {r}
                                <X size={14} className="text-slate-400 cursor-pointer hover:text-white" onClick={() => removeReminder(i)} />
                            </div>
                        ))}
                    </div>
                )}
                <button onClick={addReminder} className="flex items-center gap-2 text-blue-500 text-sm font-bold mt-2 hover:text-blue-400">
                    <Plus size={16}/> Add
                </button>
            </div>

            {/* Toggles */}
            <div className="bg-[#1c1c1e] rounded-2xl p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsAutoLog(!isAutoLog)}>
                <span className="font-medium text-slate-200 text-sm">Auto pop-up of habit log</span>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${isAutoLog ? 'bg-blue-500' : 'bg-slate-600'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${isAutoLog ? 'left-6' : 'left-1'}`}></div>
                </div>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl p-4 flex justify-between items-center cursor-pointer">
                <div className="flex flex-col">
                    <span className="font-medium text-slate-200 text-sm">Quote</span>
                    {quote && <span className="text-xs text-slate-500 mt-1">{quote}</span>}
                </div>
                <RefreshCw size={16} className="text-blue-500"/>
            </div>

        </div>

        {/* Goal Modal */}
        {showGoalModal && (
            <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowGoalModal(false)}>
                <div className="bg-[#1c1c1e] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <div className="p-6 space-y-6">
                        <h3 className="text-lg font-bold text-white">Goal</h3>
                        
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${goalType === 'all' ? 'border-blue-500' : 'border-slate-500'}`}>
                                    {goalType === 'all' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"/>}
                                </div>
                                <span className={`font-medium ${goalType === 'all' ? 'text-white' : 'text-slate-400'}`}>Achieve it all</span>
                                <input type="radio" checked={goalType === 'all'} onChange={() => setGoalType('all')} className="hidden"/>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${goalType === 'amount' ? 'border-blue-500' : 'border-slate-500'}`}>
                                    {goalType === 'amount' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"/>}
                                </div>
                                <span className={`font-medium ${goalType === 'amount' ? 'text-white' : 'text-slate-400'}`}>Reach a certain amount</span>
                                <input type="radio" checked={goalType === 'amount'} onChange={() => setGoalType('amount')} className="hidden"/>
                            </label>
                        </div>

                        {goalType === 'amount' && (
                            <div className="space-y-4 animate-in slide-in-from-top-2">
                                <div className="flex gap-4 items-center">
                                    <span className="text-sm text-slate-400 w-16">Daily</span>
                                    <input 
                                        type="number" 
                                        value={targetValue} 
                                        onChange={(e) => setTargetValue(e.target.value)}
                                        className="bg-[#2c2c2e] text-white p-2 rounded-lg outline-none w-20 text-center"
                                    />
                                    <div className="relative flex-1">
                                        <button onClick={() => setShowUnitPicker(!showUnitPicker)} className="w-full bg-[#2c2c2e] text-white p-2 rounded-lg flex justify-between items-center text-sm">
                                            {unit} <ChevronDown size={14}/>
                                        </button>
                                        {showUnitPicker && (
                                            <div className="absolute top-full left-0 right-0 bg-[#3a3a3c] rounded-lg mt-1 z-10 max-h-40 overflow-y-auto">
                                                {UNITS.map(u => (
                                                    <div key={u} onClick={() => { setUnit(u); setShowUnitPicker(false); }} className="p-2 hover:bg-white/10 cursor-pointer text-sm">{u}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-sm text-slate-400 w-24">When checking</span>
                                    <div className="bg-[#2c2c2e] text-white p-2 rounded-lg text-sm flex-1">Auto</div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-sm text-slate-400 w-24">Record ({unit})</span>
                                    <input 
                                        value={targetValue} 
                                        readOnly
                                        className="bg-[#2c2c2e] text-slate-400 p-2 rounded-lg outline-none w-20 text-center text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end p-4 gap-6">
                        <button onClick={() => setShowGoalModal(false)} className="text-blue-500 font-bold hover:text-white transition-colors">Cancel</button>
                        <button onClick={() => setShowGoalModal(false)} className="text-blue-500 font-bold hover:text-white transition-colors">OK</button>
                    </div>
                </div>
            </div>
        )}

        {/* Goal Days Modal */}
        {showGoalDaysModal && (
            <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowGoalDaysModal(false)}>
                <div className="bg-[#1c1c1e] w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-slate-800">
                        <h3 className="font-bold text-white">Goal Days</h3>
                    </div>
                    <div className="p-2 space-y-1">
                        {['Forever', '7 Days', '21 Days', '30 Days', '100 Days', '365 Days', 'Custom'].map(opt => (
                            <button 
                                key={opt} 
                                onClick={() => { 
                                    setGoalDaysOption(opt); 
                                    if(opt !== 'Custom') setShowGoalDaysModal(false); 
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors"
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${goalDaysOption === opt ? 'border-blue-500' : 'border-slate-600'}`}>
                                    {goalDaysOption === opt && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"/>}
                                </div>
                                <span className="text-slate-200 text-sm flex-1 text-left">{opt}</span>
                                {opt === 'Custom' && goalDaysOption === 'Custom' && (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            autoFocus
                                            value={customGoalDays}
                                            onChange={(e) => setCustomGoalDays(e.target.value)}
                                            placeholder="1~999"
                                            className="bg-[#2c2c2e] text-white p-1 rounded w-16 text-center text-xs outline-none"
                                        />
                                        <span className="text-xs text-slate-500">Days</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-end p-4 gap-6">
                        <button onClick={() => setShowGoalDaysModal(false)} className="text-blue-500 font-bold text-sm">Cancel</button>
                        <button onClick={() => setShowGoalDaysModal(false)} className="text-blue-500 font-bold text-sm">OK</button>
                    </div>
                </div>
            </div>
        )}

        {/* Start Date Modal */}
        {showStartDateModal && (
            <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowStartDateModal(false)}>
                <div className="bg-[#1c1c1e] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-4" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-white mb-4">Date</h3>
                    <input 
                        type="date" 
                        value={format(startDate, 'yyyy-MM-dd')}
                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : new Date())}
                        className="w-full bg-[#2c2c2e] text-white p-3 rounded-xl outline-none mb-4 color-scheme-dark"
                    />
                    <div className="flex justify-end gap-6">
                        <button onClick={() => setShowStartDateModal(false)} className="text-blue-500 font-bold text-sm">Cancel</button>
                        <button onClick={() => setShowStartDateModal(false)} className="text-blue-500 font-bold text-sm">Confirm</button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default HabitFormSheet;
