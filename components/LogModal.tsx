
import React, { useState } from 'react';
import { MOODS, SYMPTOMS } from '../constants';
import { format } from 'date-fns';
import { LogPayload } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: LogPayload) => void;
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'period' | 'symptoms'>('period');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Period States
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');
  
  // Symptom States
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');

  if (!isOpen) return null;

  const toggleMood = (id: string) => {
    setSelectedMoods(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const addCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSymptom.trim();
    if (trimmed && !selectedSymptoms.includes(trimmed)) {
      setSelectedSymptoms(prev => [...prev, trimmed]);
      setCustomSymptom('');
    }
  };

  const handleSave = () => {
    const payload: LogPayload = {
      period: isPeriodDay ? { startDate: date, intensity } : null,
      symptom: (selectedMoods.length > 0 || selectedSymptoms.length > 0) 
        ? { date, moods: selectedMoods, physicalSymptoms: selectedSymptoms, energy: 3, notes: '' } 
        : null
    };
    
    onSave(payload);
    // Reset local state for next open if needed, or keep it for the session
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-900/10 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white">
        {/* Header */}
        <div className="p-10 pb-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif text-gray-800 leading-tight">Check In</h2>
            <button onClick={onClose} className="w-12 h-12 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-all squishy">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="flex bg-rose-50/50 p-1.5 rounded-[1.5rem] glass-card">
            <button 
              onClick={() => setActiveTab('period')}
              className={`relative flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'period' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}
            >
              Period
              {isPeriodDay && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-400 rounded-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('symptoms')}
              className={`relative flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'symptoms' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}
            >
              Vibe & Body
              {(selectedMoods.length > 0 || selectedSymptoms.length > 0) && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-10 py-4 scroll-smooth">
          <div className="space-y-8 pb-10">
            <div>
              <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-3">When?</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-rose-50/30 border-2 border-rose-50/50 rounded-3xl p-4 text-rose-900 font-bold focus:ring-4 focus:ring-rose-100 outline-none transition-all"
              />
            </div>

            {activeTab === 'period' ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between p-6 bg-rose-50/30 rounded-[2rem] border-2 border-rose-50/50">
                   <div>
                      <p className="font-bold text-gray-800 text-sm">Include Period Log</p>
                      <p className="text-[10px] text-rose-300 uppercase font-bold tracking-widest mt-1">Mark this as a flow day</p>
                   </div>
                   <button 
                    onClick={() => setIsPeriodDay(!isPeriodDay)}
                    className={`w-14 h-8 rounded-full transition-all relative ${isPeriodDay ? 'bg-rose-400' : 'bg-gray-200'}`}
                   >
                     <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${isPeriodDay ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>

                {isPeriodDay && (
                  <div className="animate-in zoom-in-95 duration-200">
                    <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-4">Flow Intensity</label>
                    <div className="grid grid-cols-3 gap-4">
                      {(['light', 'medium', 'heavy'] as const).map((flow) => (
                        <button
                          key={flow}
                          onClick={() => setIntensity(flow)}
                          className={`flex flex-col items-center py-6 rounded-[2rem] border-2 transition-all capitalize squishy ${intensity === flow ? 'border-rose-400 bg-rose-400 text-white font-bold shadow-lg shadow-rose-200' : 'border-rose-50 bg-rose-50/30 text-rose-300 hover:border-rose-100'}`}
                        >
                          <span className="text-xs">{flow}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-300">
                <div>
                  <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-4">Moods (Select multiple)</label>
                  <div className="grid grid-cols-3 gap-4">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => toggleMood(mood.id)}
                        className={`flex flex-col items-center py-5 rounded-[2rem] border-2 transition-all squishy ${selectedMoods.includes(mood.id) ? 'border-rose-400 bg-rose-50 text-rose-600 font-bold shadow-md shadow-rose-100' : 'border-rose-50 bg-rose-50/30 text-rose-300 hover:border-rose-100'}`}
                      >
                        <span className="text-3xl mb-2">{mood.emoji}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-4">Body Signals</label>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {SYMPTOMS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSymptom(s)}
                        className={`px-5 py-2.5 rounded-2xl border-2 transition-all text-xs font-bold ${selectedSymptoms.includes(s) ? 'border-rose-400 bg-rose-400 text-white shadow-lg shadow-rose-100' : 'border-rose-50 bg-rose-50/30 text-rose-300 hover:border-rose-100'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <form onSubmit={addCustomSymptom} className="flex gap-3">
                      <input 
                        type="text" 
                        value={customSymptom}
                        onChange={(e) => setCustomSymptom(e.target.value)}
                        placeholder="Add anything else..."
                        className="flex-1 bg-rose-50/30 border-2 border-rose-50/50 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-rose-100 outline-none transition-all placeholder:text-rose-200"
                      />
                      <button 
                        type="submit"
                        className="w-12 h-12 bg-rose-400 text-white rounded-2xl flex items-center justify-center hover:bg-rose-500 shadow-lg shadow-rose-100 transition-all squishy"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.filter(s => !SYMPTOMS.includes(s)).map((s) => (
                        <button
                          key={s}
                          onClick={() => toggleSymptom(s)}
                          className="px-5 py-2.5 rounded-2xl bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 animate-in zoom-in duration-200 hover:bg-indigo-600"
                        >
                          {s}
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 pt-6 border-t border-rose-50 bg-white">
          <button 
            onClick={handleSave}
            className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-5 rounded-[2.5rem] shadow-xl shadow-rose-100 transition-all transform hover:scale-[1.02] active:scale-[0.98] squishy"
          >
            Save Complete Check-In ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogModal;
