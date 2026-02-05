
import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Eraser, Pen, Palette, Minus, Plus } from 'lucide-react';

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ffffff'];

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, onCancel }) => {
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

    // Set canvas size to match display size
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        // Optional: clear background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current?.toDataURL('image/png');
    if (dataUrl) onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col animate-fade-in overflow-hidden">
      {/* Tool Bar Top */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <button onClick={onCancel} className="p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full">
          <X size={24} />
        </button>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsEraser(false)}
            className={`p-2.5 rounded-xl transition-all ${!isEraser ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Pen size={20} />
          </button>
          <button 
            onClick={() => setIsEraser(true)}
            className={`p-2.5 rounded-xl transition-all ${isEraser ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Eraser size={20} />
          </button>
        </div>
        <button onClick={handleSave} className="p-2 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
          <Check size={24} />
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full h-full bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-800 overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
          />
        </div>
      </div>

      {/* Control Bar Bottom - inspired by ink_bottom_tool_bar.xml */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setBrushSize(Math.max(1, brushSize - 2))} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Minus size={18}/></button>
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-blue-500 transition-all" style={{ width: `${(brushSize / 50) * 100}%` }} />
            </div>
            <button onClick={() => setBrushSize(Math.min(50, brushSize + 2))} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><Plus size={18}/></button>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{brushSize}px</span>
        </div>

        {!isEraser && (
          <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full shrink-0 border-2 transition-transform ${color === c ? 'scale-110 border-blue-500' : 'border-slate-100 dark:border-slate-800'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawingCanvas;
