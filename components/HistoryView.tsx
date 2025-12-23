
import React, { useMemo } from 'react';
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
  isBefore,
  addDays,
  // Fix: Import startOfDay from date-fns
  startOfDay
} from 'date-fns';
import { UserData, CyclePhase } from '../types';
import { MOODS, PHASE_COLORS } from '../constants';
import { getPhaseForDate, getPeriodStartDates } from '../utils/cycleCalculator';

interface HistoryViewProps {
  userData: UserData;
  onDayClick: (date: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ userData, onDayClick }) => {
  // Generate a range of months (3 months back, 6 months forward)
  const monthRange = useMemo(() => {
    const start = addMonths(new Date(), -3);
    const months = [];
    for (let i = 0; i < 10; i++) {
      months.push(addMonths(start, i));
    }
    return months;
  }, []);

  const avgCycle = userData.settings.averageCycleLength || 28;
  const avgPeriod = userData.settings.averagePeriodLength || 5;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="px-2 sticky top-0 z-10 py-4 bg-[#fff9f8]/90 backdrop-blur-md">
        <h3 className="text-3xl font-serif text-rose-900">Your Roadmap</h3>
        <p className="text-[10px] text-rose-300 font-bold uppercase tracking-[0.2em] mt-1">
          Scroll vertically to see past logs and predictions
        </p>
      </div>

      <div className="space-y-16">
        {monthRange.map((month) => (
          <MonthGrid 
            key={month.toISOString()} 
            month={month} 
            userData={userData} 
            onDayClick={onDayClick}
            avgCycle={avgCycle}
            avgPeriod={avgPeriod}
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
}

const MonthGrid: React.FC<MonthGridProps> = ({ month, userData, onDayClick, avgCycle, avgPeriod }) => {
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  // Prediction Logic
  const periodStarts = useMemo(() => getPeriodStartDates(userData.logs), [userData.logs]);
  
  const isPredictedPeriod = (date: Date) => {
    if (periodStarts.length === 0) return false;
    const lastStart = periodStarts[periodStarts.length - 1];
    
    // Check next 3 predicted cycles
    for (let i = 1; i <= 3; i++) {
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
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6 px-4">
        <div className="h-px flex-1 bg-rose-100"></div>
        <h4 className="text-xl font-serif text-rose-800 whitespace-nowrap">{format(month, 'MMMM yyyy')}</h4>
        <div className="h-px flex-1 bg-rose-100"></div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-4 md:p-6 shadow-lg shadow-rose-100/20 border border-white glass-card">
        <div className="grid grid-cols-7 mb-4">
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
                  relative h-12 md:h-16 rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all group overflow-hidden
                  ${periodEntry ? 'bg-rose-400 text-white shadow-md' : predicted ? 'bg-rose-50/50 border-2 border-dashed border-rose-200 text-rose-800' : 'bg-rose-50/10 text-gray-700'}
                  ${isToday && !periodEntry ? 'ring-2 ring-rose-300 ring-offset-2' : ''}
                  hover:scale-105 active:scale-95
                `}
              >
                {/* Phase Indicator Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${PHASE_COLORS[phase]} opacity-60`}></div>
                
                <span className={`text-xs md:text-sm font-bold z-10 ${periodEntry ? 'text-white' : 'text-gray-600'}`}>
                  {format(day, 'd')}
                </span>
                
                {/* Mood Indicator */}
                {symptomEntry && !periodEntry && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                )}

                {/* Mini Phase Label (Desktop only) */}
                <div className="hidden md:block absolute bottom-1 text-[7px] font-bold uppercase tracking-tighter opacity-40">
                  {phase.slice(0, 3)}
                </div>

                {/* Prediction Label */}
                {predicted && !periodEntry && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                   </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
