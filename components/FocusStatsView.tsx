
import React, { useMemo, useState } from 'react';
import { X, Share2, ChevronLeft, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import { FocusSession } from '../types';
import { 
  format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, subDays, startOfYear, endOfYear, 
  startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, subWeeks, subYears
} from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FocusStatsViewProps {
  sessions: FocusSession[];
  onClose: () => void;
}

type TimeRange = 'Week' | 'Month' | 'Year';

const FocusStatsView: React.FC<FocusStatsViewProps> = ({ sessions, onClose }) => {
  const [range, setRange] = useState<TimeRange>('Week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Data Calculations ---

  const completedSessions = useMemo(() => 
    sessions.filter(s => s.status === 'completed'), 
  [sessions]);

  // 1. Overview Cards
  const stats = useMemo(() => {
    const today = new Date();
    const todaySessions = completedSessions.filter(s => isToday(new Date(s.timestamp)));
    
    const todayCount = todaySessions.length;
    const todayDuration = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    
    const totalCount = completedSessions.length;
    const totalDuration = completedSessions.reduce((acc, s) => acc + s.duration, 0);

    return { todayCount, todayDuration, totalCount, totalDuration };
  }, [completedSessions]);

  // 2. Trends Data
  const trendsData = useMemo(() => {
    let data: { label: string; value: number; fullDate: Date }[] = [];
    
    if (range === 'Week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start, end });
      
      data = days.map(day => {
        const dayTotal = completedSessions
          .filter(s => isSameDay(new Date(s.timestamp), day))
          .reduce((acc, s) => acc + s.duration, 0);
        return { 
          label: format(day, 'EEEEE'), // S, M, T...
          value: dayTotal,
          fullDate: day
        };
      });
    } else if (range === 'Month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const days = eachDayOfInterval({ start, end });
      
      data = days.filter((_, i) => i % 3 === 0 || i === days.length - 1).map(day => {
         const dayTotal = completedSessions
          .filter(s => isSameDay(new Date(s.timestamp), day))
          .reduce((acc, s) => acc + s.duration, 0);
         return {
             label: format(day, 'd'),
             value: dayTotal,
             fullDate: day
         };
      });
    } else {
        const start = startOfYear(currentDate);
        const end = endOfYear(currentDate);
        const months = eachMonthOfInterval({ start, end });
        
        data = months.map(month => {
            const monthTotal = completedSessions
                .filter(s => new Date(s.timestamp).getMonth() === month.getMonth() && new Date(s.timestamp).getFullYear() === month.getFullYear())
                .reduce((acc, s) => acc + s.duration, 0);
            return {
                label: format(month, 'MMM'),
                value: monthTotal,
                fullDate: month
            };
        });
    }
    
    return data;
  }, [completedSessions, range, currentDate]);

  // 3. Power Hour (Hourly Distribution)
  const hourlyData = useMemo(() => {
      const hours = Array(24).fill(0);
      completedSessions.forEach(s => {
          const hour = new Date(s.timestamp).getHours();
          hours[hour] += s.duration;
      });
      
      return hours.map((mins, h) => ({
          hour: h,
          label: h % 4 === 0 ? `${h}:00` : '',
          value: mins
      }));
  }, [completedSessions]);

  const bestHour = useMemo(() => {
      const max = Math.max(...hourlyData.map(d => d.value));
      const best = hourlyData.find(d => d.value === max);
      if (!best || best.value === 0) return null;
      return `${best.hour}:00 - ${best.hour + 1}:00`;
  }, [hourlyData]);

  // 4. Year Grids (Heatmap)
  const heatmapData = useMemo(() => {
      const today = new Date();
      const start = subDays(today, 364); // Last 365 days
      const days = eachDayOfInterval({ start, end: today });
      
      return days.map(day => {
          const minutes = completedSessions
            .filter(s => isSameDay(new Date(s.timestamp), day))
            .reduce((acc, s) => acc + s.duration, 0);
          
          let level = 0;
          if (minutes > 0) level = 1;
          if (minutes > 30) level = 2;
          if (minutes > 60) level = 3;
          if (minutes > 180) level = 4;

          return { date: day, level, minutes };
      });
  }, [completedSessions]);

  // Helpers
  const formatDuration = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
  };

  const handleNav = (dir: 'prev' | 'next') => {
      if (range === 'Week') setCurrentDate(d => dir === 'prev' ? subWeeks(d, 1) : subWeeks(d, -1));
      if (range === 'Month') setCurrentDate(d => dir === 'prev' ? subMonths(d, 1) : subMonths(d, -1));
      if (range === 'Year') setCurrentDate(d => dir === 'prev' ? subYears(d, 1) : subYears(d, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#000000] text-white flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Header with Safe Area Padding */}
      <div className="pt-safe bg-[#000000] z-20 shrink-0">
          <div className="h-16 flex items-center justify-between px-4">
              <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-full">
                  <X size={24} />
              </button>
              <span className="font-bold text-lg">Focus Statistics</span>
              <button className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full">
                  <Share2 size={24} />
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-safe">
          
          {/* Smart Insight Banner */}
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 shrink-0">
                  <Zap size={18} fill="currentColor" />
              </div>
              <div>
                  <h4 className="font-bold text-sm text-blue-100 mb-1">Focus Insight</h4>
                  <p className="text-xs text-blue-200/70 leading-relaxed">
                      {bestHour 
                        ? `You are most productive between ${bestHour}. Try scheduling your deep work then!` 
                        : "Start focusing today to unlock personalized insights about your productivity patterns."}
                  </p>
              </div>
          </div>

          {/* 1. Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#1c1c1e] p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Today</div>
                  <div className="text-3xl font-black text-white">{formatDuration(stats.todayDuration)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{stats.todayCount} sessions</div>
              </div>
              <div className="bg-[#1c1c1e] p-4 rounded-2xl">
                  <div className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Total</div>
                  <div className="text-3xl font-black text-white">{formatDuration(stats.totalDuration)}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{stats.totalCount} sessions</div>
              </div>
          </div>

          {/* 2. Trends Chart */}
          <div className="bg-[#1c1c1e] p-5 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg">Activity</h3>
                  <div className="flex items-center gap-2 text-sm text-blue-500 font-bold cursor-pointer select-none">
                      <ChevronLeft size={16} onClick={() => handleNav('prev')} />
                      <span>{range === 'Week' ? 'Week' : range === 'Month' ? 'Month' : 'Year'}</span>
                      <ChevronRight size={16} onClick={() => handleNav('next')} />
                  </div>
              </div>

              {/* Range Toggle */}
              <div className="flex justify-center mb-8">
                  <div className="bg-[#2c2c2e] p-1 rounded-xl flex">
                      {(['Week', 'Month', 'Year'] as const).map(r => (
                          <button
                              key={r}
                              onClick={() => setRange(r)}
                              className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                          >
                              {r}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Bar Chart */}
              <div className="h-48 w-full">
                  {trendsData.reduce((a,b) => a + b.value, 0) === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
                          <TrendingUp size={32} />
                          <span className="text-xs font-bold">No Data</span>
                      </div>
                  ) : (
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendsData}>
                              <XAxis 
                                  dataKey="label" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                                  dy={10}
                              />
                              <Tooltip 
                                  cursor={{ fill: '#ffffff10' }}
                                  contentStyle={{ backgroundColor: '#2c2c2e', border: 'none', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                                  labelStyle={{ color: '#94a3b8' }}
                                  itemStyle={{ color: '#fff' }}
                                  formatter={(value: number) => [`${value} mins`, 'Focus']}
                              />
                              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                  {trendsData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#3b82f6' : '#2c2c2e'} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  )}
              </div>
          </div>

          {/* 3. Power Hour */}
          <div className="bg-[#1c1c1e] p-5 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      Power Hour <span className="text-amber-400">⚡</span>
                  </h3>
              </div>

              <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourlyData} barCategoryGap={1}>
                          <XAxis 
                              dataKey="label" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#64748b', fontSize: 10 }}
                              dy={5}
                              interval={0}
                          />
                          <Tooltip 
                              cursor={{ fill: '#ffffff10' }}
                              contentStyle={{ backgroundColor: '#2c2c2e', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                              formatter={(value: number) => [`${value} mins`]}
                          />
                          <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                              {hourlyData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#fbbf24' : '#2c2c2e'} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-[9px] font-bold text-slate-600 mt-2 px-1 uppercase tracking-widest">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
              </div>
          </div>

          {/* 4. Year Grids */}
          <div className="bg-[#1c1c1e] p-5 rounded-3xl mb-8">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      Consistency <span className="text-emerald-400">🌱</span>
                  </h3>
                  <div className="text-xs text-slate-500 font-bold">Last 365 Days</div>
              </div>

              {/* Heatmap Container */}
              <div className="overflow-x-auto pb-2 no-scrollbar">
                  <div 
                    className="grid gap-1 min-w-[600px]" 
                    style={{ 
                        gridTemplateRows: 'repeat(7, 1fr)', 
                        gridAutoFlow: 'column',
                        height: '120px' 
                    }}
                  >
                      {heatmapData.map((day, i) => (
                          <div 
                              key={i}
                              title={`${format(day.date, 'MMM d, yyyy')}: ${day.minutes} mins`}
                              className={`w-2.5 h-2.5 rounded-[2px] transition-colors hover:ring-1 hover:ring-white ${
                                  day.level === 0 ? 'bg-[#2c2c2e]' :
                                  day.level === 1 ? 'bg-emerald-900/60' :
                                  day.level === 2 ? 'bg-emerald-700' :
                                  day.level === 3 ? 'bg-emerald-500' :
                                  'bg-emerald-300'
                              }`}
                          />
                      ))}
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default FocusStatsView;
