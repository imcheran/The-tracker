
import React from 'react';

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

interface NoteBackgroundProps {
  themeId: string;
  isDark?: boolean;
  className?: string;
}

export const NoteBackground: React.FC<NoteBackgroundProps> = ({ themeId, isDark = false, className = "" }) => {
  if (!themeId || themeId === 'none') return null;

  const getThemeContent = () => {
    switch (themeId) {
      case 'groceries':
        return (
          <svg viewBox="0 0 850.39 850.39" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
            <rect width="850.39" height="850.39" fill={isDark ? "#284d87" : "#eee7d6"} />
            <path d="M820.12,495.54q8.73,-9.92 17.14,-20.1c0.28,-0.34 0.67,-0.71 1.09,-0.59s0.56,0.64 0.57,1.08c0.08,3.53 -3.26,6.3 -3.74,9.8 -0.17,1.18 0,2.38 -0.12,3.56a10.18,10.18 0,0 1,-3 5.7c-1.5,1.59 -3.26,2.9 -4.87,4.38 -1.93,1.79 -3.63,3.83 -5.59,5.6a14.19,14.19 0,0 1,-6.85 3.75c-0.75,-4.19 -3.39,-7.77 -6.11,-11a15.77,15.77 0,0 1,-2.1 -2.92,33.91 33.91,0 0,1 -1.36,-4c-1.1,-3.08 -3.29,-5.61 -5,-8.36a7.19,7.19 0,0 1,-1.44 -4.14,1.22 1.22,0 0,1 0.64,-1.16c0.66,-0.23 1.21,0.52 1.51,1.15a89.92,89.92 0,0 0,12.24 19.13c0.94,1.13 2,2.63 3.45,1.7A18.09,18.09 0,0 0,820.12 495.54Z" fill={isDark ? "#323e4d" : "#b0bb95"} />
            <path d="M540.26,458.7h26.11v187.73h-26.11z" fill={isDark ? "#293747" : "#d5e2c3"} />
            <path d="M561.66,434.3h35.53v212.13h-35.53z" fill={isDark ? "#293747" : "#d5e2c3"} />
            <path d="M587.78,504.08h35.53v142.35h-35.53z" fill={isDark ? "#293747" : "#d5e2c3"} />
            <path d="M680.14,660.56l-65.92,0l0.96,-214.27l65.93,0l-0.97,214.27z" fill={isDark ? "#263e5f" : "#bfd6a9"} />
            <path d="M56.6,413.89l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-22.19l-1,0l0,22.19l-13.77,0l0,-22.19l-1,0l0,22.19l-13.77,0l0,-22.19l-1,0l0,22.19l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,34.39l1,0l0,-34.39l13.77,0l0,34.39l1,0l0,-34.39l13.77,0l0,34.39l1,0l0,-34.39l14.27,0l0,-1z" fill={isDark ? "#293747" : "#f1e4de"} />
            <path d="M0.45,456.13c42,-11.55 55.66,-43 137,-42.59 77.07,0.4 146.84,-2.14 197.36,61.22 14.55,6 134.85,76.63 133.57,114.3 -1.3,38.09 -82.2,44.1 -134,45.38 -48.06,1.19 -80.06,-17.55 -141.71,50.52 -27.34,30.19 -71.28,47.2 -92.47,147.7C91,840.69 -8.15,810.4 1.69,798.41c60,-23.22 53.62,-34.78 71.92,-59.51 22.23,-30 46.88,-52.33 28.69,-101.46 -34.17,3 -37.8,-4.78 -46.36,-4.78s-48.47,5.64 -56.6,0.07C1.05,614.11 -0.45,456.13 -0.45,456.13Z" fill={isDark ? "#284d87" : "#bfd6a9"} opacity="0.6"/>
            <path d="M288.21,632.94c-28,0 -55.76,7.11 -96.44,52C175.4,703 153.07,716.4 133.24,745.8 120,765.48 107.8,792.36 99.3,832.66 91,840.69 -8.15,810.4 1.69,798.41c60,-23.22 53.62,-34.78 71.92,-59.51 22.23,-30 46.88,-52.33 28.69,-101.46l80.16,-30.5Z" fill={isDark ? "#2a5e5e" : "#93ae78"} />
          </svg>
        );
      case 'celebration':
        return (
          <svg viewBox="0 0 850.39 850.39" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
            <rect width="850.39" height="850.39" fill={isDark ? "#292445" : "#ffa291"} />
            <path d="M850.39,810.36l-850.39,0l0,-77.86l419.34,0l431.05,0l0,77.86z" fill={isDark ? "#362947" : "#fa6e64"} opacity={isDark ? "1" : "0.5"}/>
            <path d="M218.46,756.38a1.64,1.64 0,0 1,-3.28 0A1.64,1.64 0,0 1,218.46 756.38Z" fill={isDark ? "#5f3c7d" : "#ffccbd"} />
            <path d="M300.87,757.67a1.64,1.64 0,0 1,-3.28 0A1.64,1.64 0,0 1,300.87 757.67Z" fill={isDark ? "#5f3c7d" : "#ffccbd"} />
            <path d="M398.26,750.17a1.64,1.64 0,0 1,-3.27 0A1.64,1.64 0,0 1,398.26 750.17Z" fill={isDark ? "#5f3c7d" : "#ffccbd"} />
            <path d="M729,745.86a1.64,1.64 0,0 1,-3.27 0A1.64,1.64 0,0 1,729 745.86Z" fill={isDark ? "#5f3c7d" : "#ffccbd"} />
            <path d="M555.64,747.83a1.64,1.64 0,0 1,-3.28 0A1.64,1.64 0,0 1,555.64 747.83Z" fill={isDark ? "#5f3c7d" : "#ffccbd"} />
            <path d="M152.38,617.75a1.64,1.64 0,0 1,-3.27 0A1.64,1.64 0,0 1,152.38 617.75Z" fill={isDark ? "#19402d" : "#ffffff"} opacity="0.6" />
            <path d="M56.6,683.68a1.64,1.64 0,0 1,-3.28 0A1.64,1.64 0,0 1,56.6 683.68Z" fill={isDark ? "#19402d" : "#ffffff"} opacity="0.6" />
            <path d="M295.73,721.49a1.64,1.64 0,0 1,-3.27 0A1.64,1.64 0,0 1,295.73 721.49Z" fill={isDark ? "#19402d" : "#ffffff"} opacity="0.6" />
            <path d="M212.09,307.85c1.78,-0.15 2.82,25.47 3.92,50.67 0.09,1.87 -2.92,2.05 -3,0.17C212.23,335.27 210.46,308 212.09,307.85Z" fill={isDark ? "#1f4f39" : "#fa857d"} />
            <path d="M241.64,311.92c1.71,0.51 -6.72,24.72 -14.94,48.57 -0.61,1.77 -3.47,0.84 -2.84,-0.94C231.71,337.48 240.08,311.45 241.64,311.92Z" fill={isDark ? "#1f4f39" : "#fa857d"} />
          </svg>
        );
      case 'food':
        return (
          <svg viewBox="0 0 850.39 850.39" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
            <rect width="850.49" height="850.4" fill={isDark ? "#2e454a" : "#f7d4c7"} />
            <path d="M798.79,661s19.23,-8.75 36.84,-10.11c20.71,-1.61 36,15.49 36,15.49S828,671.8 798.79,661Z" fill={isDark ? "#8c7b66" : "#fcf2e9"} />
            <path d="M560.24,679.43s-1.63,-14.68 13.51,-20a40.36,40.36 0,0 1,28.2 0.7s21.43,10.48 2.56,24.93S561.17,687.58 560.24,679.43Z" fill={isDark ? "#702f09" : "#f4af87"} />
            <path d="M260.53,726.61c-0.9,-7 6.59,-32.23 59.07,-18.06 16.88,-70.47 62.26,-59.12 74.79,-56.15 47,-58 120.61,-11.75 136.55,15.37 5.68,-1.22 27,-3.18 40.31,12.35 13.32,-28.55 66,-86.78 120.17,-18.19 24.79,-12.07 51.55,6.78 51.55,6.78s-0.43,-14.36 21,-14.45c16.77,-0.07 65.31,13.66 86.44,8.06V764.43s-500.27,-2 -533.59,-2S261.43,733.58 260.53,726.61Z" fill={isDark ? "#8c7b66" : "#fcf2e9"} />
            <path d="M427.77,686.16s5.46,-5.83 28.9,-4.3c19.26,1.25 20.87,3.26 20.55,4.22s-6,-0.72 -21.84,-1.55A129.61,129.61 0,0 0,427.77 686.16Z" fill={isDark ? "#6a5b35" : "#f7d4c7"} />
            <path d="M473.26,750.36s35.46,-26.57 48.27,-32.54c14.45,-6.74 45.76,-19.83 78.56,-5.67 29,12.52 22.37,13.7 22.37,13.7s-23.12,-17.5 -59.62,-16.17c-40.88,1.5 -76,36.18 -88.06,41.19C472.93,751.64 473.26,750.36 473.26,750.36Z" fill={isDark ? "#6a5b35" : "#f7d4c7"} />
          </svg>
        );
      case 'music':
        return (
          <svg viewBox="0 0 850.39 850.39" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
             <rect width="850.39" height="850.39" fill={isDark ? "#4d6666" : "#f2e6da"} />
             <path d="M605.5,526A177.51,177.51 0,0 1,745.8 812.24c-32.47,41.84 -243.85,44 -276.41,5.2A177.51,177.51 0,0 1,605.5 526Z" fill={isDark ? "#3c8a8c" : "#ffffff"} opacity="0.3"/>
             <path d="M450,703c0,-84.92 69.08,-154 154,-154s154,69.08 154,154c0,21.47 -4.42,40.3 -12.4,56.45h2.23C755.66,743.24 760,724.4 760,703c0,-86 -70,-156 -156,-156S448,617 448,703c0,21.4 4.34,40.24 12.17,56.45h2.23C454.42,743.3 450,724.47 450,703Z" fill={isDark ? "#33312f" : "#dd8b66"} />
             <path d="M658.61,704H548.41c-0.68,48.8 -1,97.6 -0.7,146.39H659.05C659.67,764.5 658.91,722.48 658.61,704Z" fill={isDark ? "#2a5e5e" : "#adcadb"} />
             <path d="M534,218s157.8,-72.57 163.8,-75.57 17.14,-8.22 17.77,-7C716.32,137 699,144 689,149 681.36,152.82 534,218 534,218Z" fill={isDark ? "#84807a" : "#ffffff"} opacity="0.5"/>
             <path d="M168.26,219.25a56.26,56.26 0,0 1,10.5 -32.79,56.49 56.49,0 1,0 83.74,74.83 56.49,56.49 0,0 1,-94.24 -42Z" fill={isDark ? "#567271" : "#eddac5"} />
          </svg>
        );
      case 'places':
        return (
          <svg viewBox="0 0 850.39 850.39" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
             <rect width="850.39" height="850.39" fill={isDark ? "#1f2937" : "#f1e4de"} />
             <path d="M680.14,660.56l-65.92,0l0.96,-214.27l65.93,0l-0.97,214.27z" fill={isDark ? "#4b5563" : "#bfd6a9"} />
             <path d="M460.2,428.73h56.51v88.3h-56.51z" fill={isDark ? "#374151" : "#bdd0a7"} />
             <path d="M540.26,458.7h26.11v187.73h-26.11z" fill={isDark ? "#4b5563" : "#d5e2c3"} />
             <path d="M140.4,454.1l9.31,12.84l0,-88.29l-9.31,-12.85l0,88.3z" fill={isDark ? "#374151" : "#bdd0a7"} />
             <path d="M56.6,449.28l11.56,13.81l0,-148.34l-11.56,-13.81l0,148.34z" fill={isDark ? "#4b5563" : "#d5e2c3"} />
             <path d="M738.12,682.49l-83.03,-0l-0,-220.83l83.03,-0z" fill={isDark ? "#4b5563" : "#cde0b8"} />
             <path d="M56.6,413.89l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-21.69l14.27,0l0,-1l-14.27,0l0,-22.19l-1,0l0,22.19l-13.77,0l0,-22.19l-1,0l0,22.19l-13.77,0l0,-22.19l-1,0l0,22.19l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,21.69l-11.79,0l0,1l11.79,0l0,34.39l1,0l0,-34.39l13.77,0l0,34.39l1,0l0,-34.39l14.27,0l0,-1z" fill={isDark ? "#374151" : "#f1e4de"} />
          </svg>
        );
      case 'notes':
        return (
          <svg viewBox="0 0 850.39 850.39" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="xMidYMid slice">
            <rect width="850.39" height="850.39" fill={isDark ? "#585faa" : "#fff0c7"} />
            <path d="M0.63,613.57h850v-60c0,-19.91 0.25,-76.7 0.25,-96.61 0,-18.44 -0.25,0 -0.25,-18.44 -40,27 -206,48 -275,25s-86,-22 -127,-22 -157.28,-20.83 -222,-59c-17.42,-10.27 -31.85,-14.76 -45.25,-15.24 -16.59,-0.6 -31.6,4.94 -48.75,13.24 -19.39,9.39 -132,53 -132,53v180Z" fill={isDark ? "#524fa1" : "#fee8aa"} />
            <path d="M0,567s120,9 222,0 178,14 306,13 236.39,-13 322.39,5v50.55L0,635Z" fill={isDark ? "#4d3f99" : "#fce399"} />
            <path d="M0,669l302.4,2.87L315,672q267.5,0 535.39,0.35V607.11C775.39,618.11 603,626 446,609c-50.31,-5.45 -114.27,-8.43 -178,-10 -135.1,-3.26 -268,0.09 -268,0.09V669Z" fill={isDark ? "#48348d" : "#ffdb82"} />
            <path d="M0,743.08c184.7,8.39 368.91,16.37 553.61,24.77L601,770c85.67,-10.33 163.73,-20.2 249.39,-30.54V646.69S827,649 722,651c-36.85,0.7 -84.79,-1.43 -140,-3.84 -102,-4.47 -228.83,-9.9 -356,-0.16C18.14,662.91 0,638 0,638c0.12,24.3 -0.12,22.34 0,46.64C0.05,695.23 0,732.48 0,743.08Z" fill={isDark ? "#3c2d72" : "#f7cd6c"} />
            <path d="M0,850.39H850.39v-122S677.5,759.5 556.5,754.5s-274,-36 -406,-39l-11.93,-0.26C17.4,712.68 0,715.79 0,715.79c-0.14,20.28 0.11,77.75 0,98C-0.22,840.54 0.19,823.68 0,850.39Z" fill={isDark ? "#2c234a" : "#f69a4d"} />
            <path d="M777,0V538.43A14.78,14.78 0,0 1,789 532a13,13 0,0 1,12 8V0Z" fill={isDark ? "#453995" : "#fad568"} />
            <path d="M800.96,539.84l-1.5,-299.65l0,-240.35l1.5,0l0,540z" fill={isDark ? "#6f60aa" : "#ffefc7"} />
            <path d="M753,0V537s4,-7 12,-6 11,9 11,9a12.91,12.91 0,0 1,1 -1.57V0Z" fill={isDark ? "#211f3f" : "#f4b44e"} />
          </svg>
        );
      case 'recipes':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="none">
             <rect width="100" height="100" fill={isDark ? "#3e2723" : "#fed4c0"} />
             <circle cx="20" cy="20" r="15" fill={isDark ? "#5d4037" : "#ffccbc"} opacity="0.5" />
             <circle cx="80" cy="80" r="25" fill={isDark ? "#5d4037" : "#ffab91"} opacity="0.5" />
             <path d="M0 100 L40 40 L80 100 Z" fill={isDark ? "#4e342e" : "#ffccbc"} opacity="0.3" />
          </svg>
        );
      case 'travel':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="none">
             <rect width="100" height="100" fill={isDark ? "#01579b" : "#c1e8ff"} />
             <path d="M0 60 Q 25 50, 50 60 T 100 60 V 100 H 0 V 60 Z" fill={isDark ? "#0277bd" : "#81d4fa"} opacity="0.5" />
             <circle cx="80" cy="20" r="8" fill={isDark ? "#ffeb3b" : "#fff9c4"} opacity="0.8" />
             <path d="M10 20 L30 15 L10 10 Z" fill={isDark ? "#ffffff" : "#e1f5fe"} opacity="0.6" />
          </svg>
        );
      case 'video':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover" preserveAspectRatio="none">
             <rect width="100" height="100" fill={isDark ? "#311b92" : "#ffddba"} />
             <path d="M0 0 L100 100" stroke={isDark ? "#4527a0" : "#ffcc80"} strokeWidth="5" opacity="0.3" />
             <path d="M100 0 L0 100" stroke={isDark ? "#4527a0" : "#ffcc80"} strokeWidth="5" opacity="0.3" />
             <circle cx="50" cy="50" r="20" fill="none" stroke={isDark ? "#512da8" : "#ffb74d"} strokeWidth="3" opacity="0.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {getThemeContent()}
    </div>
  );
};
