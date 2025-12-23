
import React, { useState, useEffect } from 'react';
import { getCycleAdvice } from '../services/geminiService';
import { CyclePhase } from '../types';

interface AdvicePanelProps {
  phase: CyclePhase;
  daysRemaining: number;
  symptoms: string[];
  onShare?: () => void;
}

const AdvicePanel: React.FC<AdvicePanelProps> = ({ phase, daysRemaining, symptoms, onShare }) => {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [role, setRole] = useState<'user' | 'partner'>('user');

  const fetchAdvice = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await getCycleAdvice({ phase, daysRemaining, symptoms, role });
      if (result.length > 0 && !result[0].includes("trouble connecting")) {
        setTips(result);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [role, phase]);

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl shadow-rose-100/30 border border-rose-50 glass-card overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 7v5l3 3"/></svg>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative">
        <div>
          <h3 className="text-2xl font-serif text-gray-800">Daily Wisdom</h3>
          <p className="text-rose-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">AI-Powered Cycle Guide</p>
        </div>
        
        <div className="flex bg-rose-50/50 p-1.5 rounded-2xl self-start md:self-center glass-card">
          <button 
            onClick={() => setRole('user')}
            className={`px-6 py-2 text-xs rounded-xl transition-all font-bold ${role === 'user' ? 'bg-white shadow-md text-rose-500 scale-105' : 'text-rose-300'}`}
          >
            For Me
          </button>
          <button 
            onClick={() => setRole('partner')}
            className={`px-6 py-2 text-xs rounded-xl transition-all font-bold ${role === 'partner' ? 'bg-white shadow-md text-rose-500 scale-105' : 'text-rose-300'}`}
          >
            For Partner
          </button>
        </div>
      </div>

      <div className="relative min-h-[160px]">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-rose-50 rounded-full w-3/4"></div>
            <div className="h-4 bg-rose-50 rounded-full w-full"></div>
            <div className="h-4 bg-rose-50 rounded-full w-2/3"></div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-center">
            <p className="text-rose-600 font-bold text-sm mb-2">Connection Pending</p>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              AI recommendations are warming up. This can happen if the API key is still being verified.
            </p>
            <button onClick={fetchAdvice} className="px-6 py-2 bg-rose-400 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500 transition-colors">
              Try Reconnecting
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tips.map((tip, i) => (
              <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-6 h-6 bg-rose-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-rose-400 text-[10px] font-bold">{i + 1}</span>
                </div>
                <p className="text-gray-600 leading-relaxed font-medium text-sm">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button 
          onClick={fetchAdvice}
          disabled={loading}
          className="group text-[10px] text-rose-400 font-bold uppercase tracking-[0.2em] hover:text-rose-600 transition-colors flex items-center gap-2"
        >
          <div className={`p-2 bg-rose-50 rounded-xl group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          </div>
          Refresh Insight
        </button>

        {onShare && (
          <button 
            onClick={onShare}
            className="flex items-center gap-2 text-[10px] text-indigo-400 font-bold uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors bg-indigo-50/50 px-4 py-2 rounded-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
            Share Phase
          </button>
        )}
      </div>
    </div>
  );
};

export default AdvicePanel;
