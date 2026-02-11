
import React, { useRef, useEffect, useState } from 'react';
import { X, Check, Eraser, Pen, Minus, Plus, UserPlus, Mail, User, Archive, Trash2, Palette, Tag, Pin } from 'lucide-react';

// --- WheelPicker ---
interface WheelPickerProps {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
  height?: number;
  itemHeight?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({ items, selected, onSelect, height = 160, itemHeight = 40 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const index = items.indexOf(selected);
      if (index !== -1) {
        scrollRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []);

  const handleScrollEnd = () => {
      if (scrollRef.current) {
          const scrollTop = scrollRef.current.scrollTop;
          const index = Math.round(scrollTop / itemHeight);
          const safeIndex = Math.max(0, Math.min(index, items.length - 1));
          
          if (items[safeIndex] && items[safeIndex] !== selected) {
              onSelect(items[safeIndex]);
          }
      }
  }

  useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      let timeoutId: any;
      const handleScrollEvent = () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(handleScrollEnd, 150);
      };
      el.addEventListener('scroll', handleScrollEvent);
      return () => {
          el.removeEventListener('scroll', handleScrollEvent);
          clearTimeout(timeoutId);
      };
  }, [items, selected, itemHeight]);

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height }}>
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-slate-100 rounded-lg pointer-events-none z-0" style={{ height: itemHeight }} />
      <div ref={scrollRef} className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10" style={{ scrollBehavior: 'smooth' }}>
        <div style={{ height: (height - itemHeight) / 2 }} />
        {items.map((item, i) => (
          <div key={`${item}-${i}`} onClick={() => { onSelect(item); if (scrollRef.current) scrollRef.current.scrollTo({ top: i * itemHeight, behavior: 'smooth' }); }} className={`flex items-center justify-center snap-center transition-all duration-200 cursor-pointer ${item === selected ? 'text-slate-900 font-bold scale-110' : 'text-slate-400 font-medium scale-95'}`} style={{ height: itemHeight }}>{item}</div>
        ))}
        <div style={{ height: (height - itemHeight) / 2 }} />
      </div>
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none"/>
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none"/>
    </div>
  );
};

// --- DrawingCanvas ---
interface DrawingCanvasProps { onSave: (dataUrl: string) => void; onCancel: () => void; }
const DRAWING_COLORS = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff'];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => { setIsDrawing(true); draw(e); };
  const stopDrawing = () => { setIsDrawing(false); canvasRef.current?.getContext('2d')?.beginPath(); };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) { x = e.touches[0].clientX - rect.left; y = e.touches[0].clientY - rect.top; } 
    else { x = e.clientX - rect.left; y = e.clientY - rect.top; }
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => { const dataUrl = canvasRef.current?.toDataURL('image/png'); if (dataUrl) onSave(dataUrl); };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col animate-fade-in overflow-hidden">
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <button onClick={onCancel} className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full"><X size={24} /></button>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsEraser(false)} className={`p-2.5 rounded-xl transition-all ${!isEraser ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Pen size={20} /></button>
          <button onClick={() => setIsEraser(true)} className={`p-2.5 rounded-xl transition-all ${isEraser ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Eraser size={20} /></button>
        </div>
        <button onClick={handleSave} className="p-2 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Check size={24} /></button>
      </div>
      <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full h-full bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800 overflow-hidden">
          <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseOut={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} className="w-full h-full cursor-crosshair touch-none" />
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setBrushSize(Math.max(1, brushSize - 2))} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Minus size={18}/></button>
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden"><div className="absolute inset-y-0 left-0 bg-blue-500 transition-all" style={{ width: `${(brushSize / 50) * 100}%` }} /></div>
            <button onClick={() => setBrushSize(Math.min(50, brushSize + 2))} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Plus size={18}/></button>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{brushSize}px</span>
        </div>
        {!isEraser && (
          <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {DRAWING_COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-9 h-9 rounded-full shrink-0 border-2 transition-transform ${color === c ? 'scale-110 border-blue-500' : 'border-slate-100 dark:border-slate-800'}`} style={{ backgroundColor: c }} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// --- ShareModal ---
interface ShareModalProps { isOpen: boolean; onClose: () => void; collaborators: string[]; onUpdateCollaborators: (emails: string[]) => void; }

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, collaborators, onUpdateCollaborators }) => {
  const [emailInput, setEmailInput] = useState('');
  const handleAdd = () => { if (emailInput && !collaborators.includes(emailInput)) { onUpdateCollaborators([...collaborators, emailInput]); setEmailInput(''); } };
  const handleRemove = (email: string) => { onUpdateCollaborators(collaborators.filter(c => c !== email)); };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in scale-in duration-200">
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2"><button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><X size={24} /></button><h2 className="text-xl font-bold text-slate-800 dark:text-white">Collaborators</h2></div>
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors">Save</button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><User size={20} /></div>
            <div className="flex-1 min-w-0"><div className="text-sm font-bold text-slate-800 dark:text-white">You (Owner)</div><div className="text-xs text-slate-500 truncate">primary-user@example.com</div></div>
          </div>
          {collaborators.map((email) => (
            <div key={email} className="flex items-center gap-4 px-4 py-3 group">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><Mail size={18} /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{email}</div></div>
              <button onClick={() => handleRemove(email)} className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={18} /></button>
            </div>
          ))}
          <div className="flex items-center gap-4 px-4 py-3 mt-2">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400"><UserPlus size={18} /></div>
            <input autoFocus value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Person or email to share with" className="flex-1 bg-transparent text-sm py-2 outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400" onKeyDown={(e) => { if(e.key === 'Enter') handleAdd(); }} />
            {emailInput && <button onClick={handleAdd} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full"><Check size={20} /></button>}
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborators can edit the note</p></div>
      </div>
    </div>
  );
};

// --- SelectionToolbar ---
interface SelectionToolbarProps { count: number; onClear: () => void; onArchive: () => void; onDelete: () => void; onColor: () => void; onLabel: () => void; onPin: () => void; }

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ count, onClear, onArchive, onDelete, onColor, onLabel, onPin }) => (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[95vw] max-w-lg">
      <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl flex items-center px-4 py-2 gap-2 animate-slide-up border border-slate-700/50">
        <button onClick={onClear} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
        <span className="flex-1 font-bold text-sm ml-2">{count} selected</span>
        <div className="flex items-center gap-1">
          <button onClick={onPin} title="Pin" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><Pin size={20} /></button>
          <button onClick={onColor} title="Background" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><Palette size={20} /></button>
          <button onClick={onLabel} title="Add label" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><Tag size={20} /></button>
          <button onClick={onArchive} title="Archive" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"><Archive size={20} /></button>
          <button onClick={onDelete} title="Delete" className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-red-400"><Trash2 size={20} /></button>
        </div>
      </div>
    </div>
);

// --- NoteBackgrounds ---
export const NOTE_THEMES = [
  { id: 'none', name: 'Default', color: 'transparent', icon: '∅' },
  { id: 'groceries', name: 'Groceries', color: '#eee7d6', icon: '🥑' },
  { id: 'food', name: 'Food', color: '#f7d4c7', icon: '🍕' },
  { id: 'music', name: 'Music', color: '#f2e6da', icon: '🎵' },
  { id: 'places', name: 'Places', color: '#f1e4de', icon: '🏔️' },
  { id: 'notes', name: 'Notes', color: '#fff0c7', icon: '📝' },
  { id: 'recipes', name: 'Recipes', color: '#ffccb0', icon: '🍳' },
  { id: 'travel', name: 'Travel', color: '#e3f2fd', icon: '✈️' },
  { id: 'video', name: 'Video', color: '#f3e5f5', icon: '🎬' },
  { id: 'celebration', name: 'Celebration', color: '#ffb7a5', icon: '🥳' },
];

export const NoteBackground: React.FC<{ themeId: string; isDark?: boolean; className?: string }> = ({ themeId, isDark = false, className = "" }) => {
  if (!themeId || themeId === 'none') return null;
  const getThemeContent = () => {
    switch (themeId) {
      case 'groceries': return <svg viewBox="0 0 850.39 850.39" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice"><rect width="850.39" height="850.39" fill={isDark ? "#284d87" : "#eee7d6"} /><path d="M820.12,495.54q8.73,-9.92 17.14,-20.1c0.28,-0.34 0.67,-0.71 1.09,-0.59s0.56,0.64 0.57,1.08c0.08,3.53 -3.26,6.3 -3.74,9.8 -0.17,1.18 0,2.38 -0.12,3.56a10.18,10.18 0,0 1,-3 5.7c-1.5,1.59 -3.26,2.9 -4.87,4.38 -1.93,1.79 -3.63,3.83 -5.59,5.6a14.19,14.19 0,0 1,-6.85 3.75c-0.75,-4.19 -3.39,-7.77 -6.11,-11a15.77,15.77 0,0 1,-2.1 -2.92,33.91 33.91,0 0,1 -1.36,-4c-1.1,-3.08 -3.29,-5.61 -5,-8.36a7.19,7.19 0,0 1,-1.44 -4.14,1.22 1.22,0 0,1 0.64,-1.16c0.66,-0.23 1.21,0.52 1.51,1.15a89.92,89.92 0,0 0,12.24 19.13c0.94,1.13 2,2.63 3.45,1.7A18.09,18.09 0,0 0,820.12 495.54Z" fill={isDark ? "#323e4d" : "#b0bb95"} /><path d="M540.26,458.7h26.11v187.73h-26.11z" fill={isDark ? "#293747" : "#d5e2c3"} /><path d="M561.66,434.3h35.53v212.13h-35.53z" fill={isDark ? "#293747" : "#d5e2c3"} /><path d="M587.78,504.08h35.53v142.35h-35.53z" fill={isDark ? "#293747" : "#d5e2c3"} /><path d="M680.14,660.56l-65.92,0l0.96,-214.27l65.93,0l-0.97,214.27z" fill={isDark ? "#263e5f" : "#bfd6a9"} /><path d="M56.6,413.89l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-22.19l-1,0l0,22.19l-13.77,0l0,-22.19l-1,0l0,22.19l-13.77,0l0,-22.19l-1,0l0,22.19l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,34.39l1,0l0,-34.39l13.77,0l0,34.39l1,0l0,-34.39l13.77,0l0,34.39l1,0l0,-34.39l14.27,0l0,-1z" fill={isDark ? "#293747" : "#f1e4de"} /><path d="M0.45,456.13c42,-11.55 55.66,-43 137,-42.59 77.07,0.4 146.84,-2.14 197.36,61.22 14.55,6 134.85,76.63 133.57,114.3 -1.3,38.09 -82.2,44.1 -134,45.38 -48.06,1.19 -80.06,-17.55 -141.71,50.52 -27.34,30.19 -71.28,47.2 -92.47,147.7C91,840.69 -8.15,810.4 1.69,798.41c60,-23.22 53.62,-34.78 71.92,-59.51 22.23,-30 46.88,-52.33 28.69,-101.46 -34.17,3 -37.8,-4.78 -46.36,-4.78s-48.47,5.64 -56.6,0.07C1.05,614.11 -0.45,456.13 -0.45,456.13Z" fill={isDark ? "#284d87" : "#bfd6a9"} opacity="0.6"/><path d="M288.21,632.94c-28,0 -55.76,7.11 -96.44,52C175.4,703 153.07,716.4 133.24,745.8 120,765.48 107.8,792.36 99.3,832.66 91,840.69 -8.15,810.4 1.69,798.41c60,-23.22 53.62,-34.78 71.92,-59.51 22.23,-30 46.88,-52.33 28.69,-101.46l80.16,-30.5Z" fill={isDark ? "#2a5e5e" : "#93ae78"} /></svg>;
      case 'travel': return <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="none"><rect width="100" height="100" fill={isDark ? "#01579b" : "#c1e8ff"} /><path d="M0 60 Q 25 50, 50 60 T 100 60 V 100 H 0 V 60 Z" fill={isDark ? "#0277bd" : "#81d4fa"} opacity="0.5" /><circle cx="80" cy="20" r="8" fill={isDark ? "#ffeb3b" : "#fff9c4"} opacity="0.8" /><path d="M10 20 L30 15 L10 10 Z" fill={isDark ? "#ffffff" : "#e1f5fe"} opacity="0.6" /></svg>;
      case 'video': return <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="none"><rect width="100" height="100" fill={isDark ? "#311b92" : "#ffddba"} /><path d="M0 0 L100 100" stroke={isDark ? "#4527a0" : "#ffcc80"} strokeWidth="5" opacity="0.3" /><path d="M100 0 L0 100" stroke={isDark ? "#4527a0" : "#ffcc80"} strokeWidth="5" opacity="0.3" /><circle cx="50" cy="50" r="20" fill="none" stroke={isDark ? "#512da8" : "#ffb74d"} strokeWidth="3" opacity="0.5" /></svg>;
      default: return null;
    }
  };
  return <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>{getThemeContent()}</div>;
};
