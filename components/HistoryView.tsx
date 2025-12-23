
import React from 'react';
import { format, parseISO } from 'date-fns';
import { UserData } from '../types';
import { getDetailedHistory } from '../utils/cycleCalculator';
import { MOODS } from '../constants';

interface HistoryViewProps {
  userData: UserData;
}

const HistoryView: React.FC<HistoryViewProps> = ({ userData }) => {
  const periodHistory = getDetailedHistory(userData.logs);
  const sortedSymptoms = [...userData.symptoms].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shadow-rose-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
          </div>
          <div>
            <h3 className="text-2xl font-serif text-gray-800">Your Cycles</h3>
            <p className="text-rose-300 text-[10px] font-bold uppercase tracking-widest">Historical View</p>
          </div>
        </div>

        {periodHistory.length === 0 ? (
          <div className="bg-white/50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-rose-100 glass-card">
            <p className="text-rose-300 font-bold">No cycles logged yet. Start by logging your day!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {periodHistory.map((log, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white flex items-center justify-between glass-card hover:shadow-lg transition-all transform hover:-translate-y-1 group">
                <div>
                  <div className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mb-1">Started</div>
                  <div className="text-xl font-serif text-rose-900">
                    {format(parseISO(log.startDate), 'MMMM do, yyyy')}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-tighter text-rose-200">Intensity:</span>
                    <span className="text-[10px] font-bold text-rose-400 capitalize">{log.intensity}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mb-1">Duration</div>
                  <div className="px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full font-bold group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    {log.cycleLength ? `${log.cycleLength} Days` : 'Ongoing'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shadow-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <h3 className="text-2xl font-serif text-gray-800">Symptom Log</h3>
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">Daily Feelings</p>
          </div>
        </div>

        {sortedSymptoms.length === 0 ? (
          <div className="bg-white/50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-indigo-100 glass-card">
            <p className="text-indigo-300 font-bold">Log your mood and symptoms to see trends.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedSymptoms.map((symptom, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[3rem] shadow-sm border border-white glass-card">
                <div className="flex justify-between items-start mb-6">
                  <span className="px-4 py-1.5 bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-gray-100">
                    {format(parseISO(symptom.date), 'EEEE, MMM do')}
                  </span>
                  <div className="flex gap-1.5">
                    {symptom.moods.map(mId => (
                      <div key={mId} className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner shadow-rose-100" title={mId}>
                        {MOODS.find(m => m.id === mId)?.emoji || '😶'}
                      </div>
                    ))}
                    {symptom.moods.length === 0 && <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl grayscale opacity-50">😶</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {symptom.physicalSymptoms.map(s => (
                    <span key={s} className="px-5 py-2 bg-white text-rose-500 text-xs font-bold rounded-2xl border border-rose-50 shadow-sm">
                      {s}
                    </span>
                  ))}
                  {symptom.physicalSymptoms.length === 0 && <span className="text-gray-300 text-xs italic">A quiet day for symptoms...</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HistoryView;
