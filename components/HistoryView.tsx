
import React, { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  getDay, 
  startOfWeek, 
  endOfWeek,
  parseISO
} from 'date-fns';
import { UserData } from '../types';
import { MOODS } from '../constants';

interface HistoryViewProps {
  userData: UserData;
  onDayClick: (date: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ userData, onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const stats = useMemo(() => {
    const logsThisMonth = userData.logs.filter(l => isSameMonth(parseISO(l.date), currentMonth));
    return {
      periodDays: logsThisMonth.length,
      symptomDays: userData.symptoms.filter(s => isSameMonth(parseISO(s.date), currentMonth)).length
    };
  }, [userData, currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-3xl font-serif text-rose-900">{format(currentMonth, 'MMMM yyyy')}</h3>
          <p className="text-[10px] text-rose-300 font-bold uppercase tracking-[0.2em] mt-1">Tap a day to log or edit</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-12 h-12 bg-white rounded-2xl border border-rose-50 flex items-center justify-center text-rose-400 hover:text-rose-600 shadow-sm transition-all squishy">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button onClick={nextMonth} className="w-12 h-12 bg-white rounded-2xl border border-rose-50 flex items-center justify-center text-rose-400 hover:text-rose-600 shadow-sm transition-all squishy">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-[3rem] p-4 md:p-8 shadow-xl shadow-rose-100/30 border border-white glass-card">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-rose-200 uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {calendarDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const periodEntry = userData.logs.find(l => l.date === dateStr);
            const symptomEntry = userData.symptoms.find(s => s.date === dateStr);
            const isToday = isSameDay(day, new Date());
            const currentMonthDay = isSameMonth(day, currentMonth);

            return (
              <button
                key={dateStr}
                onClick={() => onDayClick(dateStr)}
                className={`
                  relative h-14 md:h-20 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all group squishy
                  ${!currentMonthDay ? 'opacity-20 pointer-events-none' : 'opacity-100'}
                  ${periodEntry ? 'bg-rose-400 text-white shadow-lg shadow-rose-100' : 'bg-rose-50/30 text-rose-900'}
                  ${isToday && !periodEntry ? 'border-2 border-rose-200' : 'border border-transparent'}
                  hover:scale-105 active:scale-95
                `}
              >
                <span className={`text-sm md:text-lg font-bold ${periodEntry ? 'text-white' : 'text-rose-900'}`}>
                  {format(day, 'd')}
                </span>
                
                {/* Indicators */}
                <div className="flex gap-1 mt-1">
                  {symptomEntry && (
                    <div className={`w-1 h-1 rounded-full ${periodEntry ? 'bg-white' : 'bg-indigo-400'}`}></div>
                  )}
                  {periodEntry && (
                     <div className="absolute top-1.5 right-1.5 opacity-50">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                     </div>
                  )}
                </div>

                {/* Hover Mood Emoji (if exists) */}
                {symptomEntry?.moods?.[0] && currentMonthDay && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-xl md:text-2xl bg-white/80 rounded-full p-1 shadow-sm">
                      {MOODS.find(m => m.id === symptomEntry.moods[0])?.emoji}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-rose-50/50 p-6 rounded-[2.5rem] border border-rose-100 glass-card">
          <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mb-1">Period Days</p>
          <p className="text-3xl font-serif text-rose-900">{stats.periodDays}</p>
        </div>
        <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 glass-card">
          <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mb-1">Logged Symptoms</p>
          <p className="text-3xl font-serif text-indigo-900">{stats.symptomDays}</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
