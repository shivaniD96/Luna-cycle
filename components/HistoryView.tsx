
import React, { useState, useMemo, useRef } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  startOfWeek, 
  endOfWeek,
  addDays,
  startOfDay,
  setMonth,
  setYear,
  getYear
} from 'date-fns';
import { UserData, CyclePhase } from '../types';
import { PHASE_COLORS, PHASE_ICONS } from '../constants';
import { getPhaseForDate, getPeriodStartDates } from '../utils/cycleCalculator';

interface HistoryViewProps {
  userData: UserData;
  onDayClick: (date: string) => void;
}

const HistoryLegend = () => (
  <div className="flex flex-wrap items-center justify-center gap-3 mb-6 px-2">
    {Object.entries(PHASE_COLORS).map(([phase, color]) => (
      <div key={phase} className="flex items-center gap-1.5 bg-white/50 px-2.5 py-1 rounded-full border border-rose-50/50 shadow-sm">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-[9px] font-bold text-rose-800/60 uppercase tracking-widest">{phase}</span>
      </div>
    ))}
    <div className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 shadow-sm">
      <div className="w-2 h-2 rounded-full border border-dashed border-rose-300"></div>
      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Prediction</span>
    </div>
  </div>
);

const HistoryView: React.FC<HistoryViewProps> = ({ userData, onDayClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentMonth = useMemo(() => new Date(), []);
  
  const avgCycle = userData.settings.averageCycleLength || 28;
  const avgPeriod = userData.settings.averagePeriodLength || 5;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Current Month Focused Card */}
      <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-rose-100/30 border border-white glass-card relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-3xl font-serif text-rose-900">{format(currentMonth, 'MMMM yyyy')}</h3>
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-[0.2em] mt-1">Hormonal Roadmap</p>
          </div>
          <button 
            onClick={() => setIsExpanded(true)}
            className="group px-5 py-2.5 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-400 hover:text-white transition-all squishy flex items-center gap-2"
          >
            <span>Full Roadmap</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <HistoryLegend />

        <MonthGrid 
          month={currentMonth} 
          userData={userData} 
          onDayClick={onDayClick}
          avgCycle={avgCycle}
          avgPeriod={avgPeriod}
          isCompact={true}
        />
      </div>

      {/* Cycle Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100 glass-card">
          <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mb-1">Consistency</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-serif text-rose-900">{userData.logs.length > 3 ? 'Stable' : 'New User'}</p>
          </div>
        </div>
        <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 glass-card">
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">Total Logs</p>
          <p className="text-3xl font-serif text-indigo-900">{userData.logs.length + userData.symptoms.length}</p>
        </div>
      </div>

      {/* Roadmap Overlay */}
      {isExpanded && (
        <FullRoadmapModal 
          userData={userData} 
          onClose={() => setIsExpanded(false)} 
          onDayClick={onDayClick}
          avgCycle={avgCycle}
          avgPeriod={avgPeriod}
        />
      )}
    </div>
  );
};

interface RoadmapModalProps {
  userData: UserData;
  onClose: () => void;
  onDayClick: (date: string) => void;
  avgCycle: number;
  avgPeriod: number;
}

const FullRoadmapModal: React.FC<RoadmapModalProps> = ({ userData, onClose, onDayClick, avgCycle, avgPeriod }) => {
  const [baseDate, setBaseDate] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  const monthRange = useMemo(() => {
    const range = [];
    const start = addMonths(baseDate, -6);
    for (let i = 0; i < 24; i++) {
      range.push(addMonths(start, i));
    }
    return range;
  }, [baseDate]);

  const years = useMemo(() => {
    const currentYear = getYear(new Date());
    return Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleJump = (year: number, monthIdx: number) => {
    const newDate = setYear(setMonth(new Date(), monthIdx), year);
    setBaseDate(newDate);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#fff9f8] animate-in fade-in zoom-in-95 duration-300 flex flex-col">
      <header className="p-6 md:p-10 bg-[#fff9f8]/95 backdrop-blur-xl border-b border-rose-50 shadow-sm relative z-20">
        <div className="flex items-center justify-between mb-4 max-w-5xl mx-auto">
          <div>
            <h2 className="text-4xl font-serif text-rose-900">Your Roadmap</h2>
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-[0.2em] mt-1">Scroll for predictions</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 bg-white text-rose-400 rounded-[1.5rem] flex items-center justify-center hover:bg-rose-50 transition-all border border-rose-100 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <HistoryLegend />

        <div className="flex flex-col md:flex-row items-center gap-4 max-w-5xl mx-auto mt-4">
          <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-rose-50">
            <select 
              className="bg-transparent border-none text-sm font-bold text-rose-600 outline-none px-2 py-1 cursor-pointer"
              value={getYear(baseDate)}
              onChange={(e) => handleJump(parseInt(e.target.value), baseDate.getMonth())}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <div className="flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {months.map((m, idx) => (
              <button
                key={m}
                onClick={() => handleJump(getYear(baseDate), idx)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 ${baseDate.getMonth() === idx ? 'bg-rose-400 text-white shadow-lg' : 'bg-white/50 text-rose-300 hover:text-rose-500 border border-transparent hover:border-rose-100'}`}
              >
                {m}
              </button>
            ))}
          </div>

          <button onClick={() => { setBaseDate(new Date()); if (scrollRef.current) scrollRef.current.scrollTop = 0; }} className="px-6 py-2.5 bg-rose-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-rose-800 transition-colors shadow-lg">
            Today
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-20 py-12 space-y-24 scroll-smooth bg-gradient-to-b from-[#fff9f8] to-white">
        <div className="max-w-xl mx-auto space-y-32">
          {monthRange.map((month) => (
            <div key={month.toISOString()} className="relative">
              <MonthGrid 
                month={month} 
                userData={userData} 
                onDayClick={onDayClick}
                avgCycle={avgCycle}
                avgPeriod={avgPeriod}
                isCompact={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MonthGridProps {
  month: Date;
  userData: UserData;
  onDayClick: (date: string) => void;
  avgCycle: number;
  avgPeriod: number;
  isCompact?: boolean;
}

const MonthGrid: React.FC<MonthGridProps> = ({ month, userData, onDayClick, avgCycle, avgPeriod, isCompact }) => {
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const periodStarts = useMemo(() => getPeriodStartDates(userData.logs), [userData.logs]);
  
  const isPredictedPeriod = (date: Date) => {
    if (periodStarts.length === 0) return false;
    const lastStart = periodStarts[periodStarts.length - 1];
    for (let i = 1; i <= 12; i++) {
      const predictedStart = addDays(lastStart, avgCycle * i);
      const predictedEnd = addDays(predictedStart, avgPeriod - 1);
      const day = startOfDay(date);
      if ((isSameDay(day, predictedStart) || day > predictedStart) && (isSameDay(day, predictedEnd) || day < predictedEnd)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className={`animate-in fade-in duration-700 ${!isCompact ? 'month-section' : ''}`}>
      {!isCompact && (
        <div className="flex items-center gap-6 mb-10 group">
          <h4 className="text-3xl font-serif text-rose-900 whitespace-nowrap group-hover:translate-x-2 transition-transform duration-500">
            {format(month, 'MMMM yyyy')}
          </h4>
          <div className="h-px flex-1 bg-gradient-to-r from-rose-100 to-transparent"></div>
        </div>
      )}

      <div className="grid grid-cols-7 mb-4">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-[9px] font-bold text-rose-200 uppercase tracking-[0.3em] py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1.5 md:gap-3">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const periodEntry = userData.logs.find(l => l.date === dateStr);
          const symptomEntry = userData.symptoms.find(s => s.date === dateStr);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, month);
          const predicted = isPredictedPeriod(day);
          const phase = getPhaseForDate(day, userData.logs, avgCycle, avgPeriod);

          if (!isCurrentMonth) return <div key={dateStr} className="h-12 md:h-20" />;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                relative h-12 md:h-20 rounded-2xl md:rounded-[1.5rem] flex flex-col items-center justify-center transition-all group overflow-hidden border-2
                ${periodEntry ? 'bg-rose-400 text-white border-rose-400 shadow-lg' : predicted ? 'bg-rose-50/20 border-dashed border-rose-300 text-rose-800' : 'bg-rose-50/5 border-transparent text-gray-700 hover:bg-rose-50/20'}
                ${isToday && !periodEntry ? 'ring-2 ring-rose-300 ring-offset-2' : ''}
                hover:scale-105 active:scale-95
              `}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${PHASE_COLORS[phase as CyclePhase]} opacity-50`}></div>
              <span className={`text-sm md:text-base font-bold z-10 ${periodEntry ? 'text-white' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </span>
              {symptomEntry && !periodEntry && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryView;
