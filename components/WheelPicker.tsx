import React, { useRef, useEffect } from 'react';

interface WheelPickerProps {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
  height?: number;
  itemHeight?: number;
}

export const WheelPicker: React.FC<WheelPickerProps> = ({ items, selected, onSelect, height = 160, itemHeight = 40 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial scroll position
  useEffect(() => {
    if (scrollRef.current) {
      const index = items.indexOf(selected);
      if (index !== -1) {
        scrollRef.current.scrollTop = index * itemHeight;
      }
    }
  }, []); // Run once on mount

  const handleScrollEnd = () => {
      if (scrollRef.current) {
          const scrollTop = scrollRef.current.scrollTop;
          const index = Math.round(scrollTop / itemHeight);
          // Clamp index
          const safeIndex = Math.max(0, Math.min(index, items.length - 1));
          
          if (items[safeIndex] && items[safeIndex] !== selected) {
              onSelect(items[safeIndex]);
          }
      }
  }

  // Debounce scroll end for snapping effect simulation
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
      {/* Selection Highlight */}
      <div 
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-slate-100 rounded-lg pointer-events-none z-0"
        style={{ height: itemHeight }}
      />
      
      {/* Scroll Container */}
      <div 
        ref={scrollRef}
        className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div style={{ height: (height - itemHeight) / 2 }} />
        {items.map((item, i) => (
          <div 
            key={`${item}-${i}`}
            onClick={() => {
                onSelect(item);
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({ top: i * itemHeight, behavior: 'smooth' });
                }
            }}
            className={`flex items-center justify-center snap-center transition-all duration-200 cursor-pointer
              ${item === selected ? 'text-slate-900 font-bold scale-110' : 'text-slate-400 font-medium scale-95'}
            `}
            style={{ height: itemHeight }}
          >
            {item}
          </div>
        ))}
        <div style={{ height: (height - itemHeight) / 2 }} />
      </div>

      {/* Gradients for depth */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent z-20 pointer-events-none"/>
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent z-20 pointer-events-none"/>
    </div>
  );
};