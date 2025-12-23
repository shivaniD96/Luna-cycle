
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  parseISO,
  addDays,
  startOfDay,
  setMonth,
  setYear,
  getYear
} from 'date-fns';
import { UserData, CyclePhase } from '../types';
import { MOODS, PHASE_COLORS } from '../constants';
import { getPhaseForDate, getPeriodStartDates } from '../utils/cycleCalculator';

interface HistoryViewProps {
  userData: UserData;
  onDayClick: (date: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ userData, onDayClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentMonth = useMemo(() => new Date(), []);
  
  const avgCycle = userData.settings.averageCycleLength || 28;
  const avgPeriod = userData.settings.averagePeriodLength || 5;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Compact View Section */}
      <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-rose-100/30 border border-white glass-card relative overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-serif text-rose-900">{format(currentMonth, 'MMMM yyyy')}</h3>
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-[0.2em] mt-1">Focusing on your current cycle</p>
          </div>
          <button 
            onClick={() => setIsExpanded(true)}
            className="px-5 py-2.5 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all squishy"
          >
            See Full Roadmap
          </button>
        </div>

        <MonthGrid 
          month={currentMonth} 
          userData={userData} 
          onDayClick={onDayClick}
          avgCycle={avgCycle}
          avgPeriod={avgPeriod}
          isCompact={true}
        />
      </div>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100 glass-card">
          <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mb-1">Total Logs</p>
          <p className="text-3xl font-serif text-rose-900">{userData.logs.length}</p>
        </div>
        <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 glass-card">
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">Mood Tracks</p>
          <p className="text-3xl font-serif text-indigo-900">{userData.symptoms.length}</p>
        </div>
      </div>

      {/* Full Roadmap Modal */}
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

  // Generate a long range (12 months back, 24 months forward)
  const monthRange = useMemo(() => {
    const range = [];
    const start = addMonths(baseDate, -12);
    for (let i = 0; i < 36; i++) {
      range.push(addMonths(start, i));
    }
    return range;
  }, [baseDate]);

  const years = useMemo(() => {
    const currentYear = getYear(new Date());
    return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }, []);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleJump = (year: number, monthIdx: number) => {
    let newDate = new Date();
    newDate = setYear(newDate, year);
    newDate = setMonth(newDate, monthIdx);
    setBaseDate(newDate);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#fff9f8] animate-in fade-in zoom-in-95 duration-300 flex flex-col">
      {/* Sticky Header */}
      <header className="p-6 md:p-8 bg-[#fff9f8]/90 backdrop-blur-xl border-b border-rose-50 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif text-rose-900">Roadmap</h2>
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-[0.2em] mt-1">Scroll vertically for predictions</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white text-rose-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 transition-all squishy border border-rose-100 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Jump Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <select 
            className="bg-white border border-rose-100 rounded-xl px-4 py-2 text-xs font-bold text-rose-500 outline-none shadow-sm"
            value={getYear(baseDate)}
            onChange={(e) => handleJump(parseInt(e.target.value), baseDate.getMonth())}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex gap-1">
            {months.map((m, idx) => (
              <button
                key={m}
                onClick={() => handleJump(getYear(baseDate), idx)}
                className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all ${baseDate.getMonth() === idx ? 'bg-rose-400 text-white shadow-md' : 'bg-white text-rose-300 border border-rose-50'}`}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setBaseDate(new Date())}
            className="ml-auto px-4 py-2 bg-indigo-50 text-indigo-500 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
          >
            Jump to Today
          </button>
        </div>
      </header>

      {/* Scrolling Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-20 py-10 space-y-20 scroll-smooth">
        {monthRange.map((month) => (
          <MonthGrid 
            key={month.toISOString()} 
            month={month} 
            userData={userData} 
            onDayClick={onDayClick}
            avgCycle={avgCycle}
            avgPeriod={avgPeriod}
            isCompact={false}
          />
        ))}
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
    for (let i = 1; i <= 6; i++) {
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
    <div className={`animate-in fade-in duration-500 ${!isCompact ? 'max-w-xl mx-auto' : ''}`}>
      {!isCompact && (
        <div className="flex items-center gap-4 mb-6">
          <h4 className="text-xl font-serif text-rose-800 whitespace-nowrap">{format(month, 'MMMM yyyy')}</h4>
          <div className="h-px flex-1 bg-rose-100/50"></div>
        </div>
      )}

      <div className={`grid grid-cols-7 mb-4`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-[9px] font-bold text-rose-200 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const periodEntry = userData.logs.find(l => l.date === dateStr);
          const symptomEntry = userData.symptoms.find(s => s.date === dateStr);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, month);
          const predicted = isPredictedPeriod(day);
          const phase = getPhaseForDate(day, userData.logs, avgCycle, avgPeriod);

          if (!isCurrentMonth) return <div key={dateStr} className="h-12 md:h-16" />;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`
                relative h-12 md:h-16 rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all group overflow-hidden border-2
                ${periodEntry ? 'bg-rose-400 text-white border-rose-400 shadow-md' : predicted ? 'bg-rose-50/30 border-dashed border-rose-200 text-rose-800' : 'bg-rose-50/10 border-transparent text-gray-700'}
                ${isToday && !periodEntry ? 'ring-2 ring-rose-300 ring-offset-1' : ''}
                hover:scale-105 active:scale-95
              `}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${PHASE_COLORS[phase]} opacity-40`}></div>
              
              <span className={`text-xs md:text-sm font-bold z-10 ${periodEntry ? 'text-white' : 'text-gray-600'}`}>
                {format(day, 'd')}
              </span>
              
              {symptomEntry && !periodEntry && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
              )}

              {predicted && !periodEntry && (
                 <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                 </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryView;
