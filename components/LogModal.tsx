import React, { useState, useEffect } from 'react';
import { MOODS, SYMPTOMS } from '../constants';
import { format } from 'date-fns';
import { LogPayload, UserData } from '../types';
import { SyncService } from '../services/syncService';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: LogPayload) => void;
  userData: UserData;
  initialDate?: string;
  cloudEnabled: boolean;
  onEnableCloud: (token: string) => void;
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onSave, userData, initialDate, cloudEnabled, onEnableCloud }) => {
  const [activeTab, setActiveTab] = useState<'period' | 'symptoms'>('period');
  const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Period States
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [intensity, setIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');
  
  // Symptom States
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');

  // Load existing data for the selected date
  useEffect(() => {
    if (!isOpen) return;
    
    const existingPeriod = userData.logs.find(l => l.date === date);
    const existingSymptom = userData.symptoms.find(s => s.date === date);

    setIsPeriodDay(!!existingPeriod);
    if (existingPeriod) setIntensity(existingPeriod.intensity);

    setSelectedMoods(existingSymptom?.moods || []);
    setSelectedSymptoms(existingSymptom?.physicalSymptoms || []);
  }, [isOpen, date, userData]);

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
      date,
      period: isPeriodDay ? { date, intensity } : null,
      symptom: (selectedMoods.length > 0 || selectedSymptoms.length > 0) 
        ? { date, moods: selectedMoods, physicalSymptoms: selectedSymptoms, energy: 3, notes: '' } 
        : null
    };
    
    onSave(payload);
    onClose();
  };

  const handleCloudPrompt = () => {
    setIsSyncing(true);
    SyncService.triggerLogin(
      (token) => {
        setIsSyncing(false);
        onEnableCloud(token);
      },
      (err) => {
        setIsSyncing(false);
        if (err === 'MISSING_CLIENT_ID') {
          alert("Cloud Sync Setup Required: Please go to Settings to configure your Google OAuth Client ID first.");
        } else {
          alert("Authorization failed. Please check your internet or Google Cloud configuration in Settings.");
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-900/20 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white">
        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-gray-800 leading-tight">Check In</h2>
            <button onClick={onClose} className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-all squishy">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="flex bg-rose-50/50 p-1 rounded-2xl glass-card mb-6">
            <button 
              onClick={() => setActiveTab('period')}
              className={`relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'period' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}
            >
              Period
              {isPeriodDay && <div className="absolute top-1 right-2 w-1 h-1 bg-rose-400 rounded-full"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('symptoms')}
              className={`relative flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'symptoms' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}
            >
              Vibe & Body
              {(selectedMoods.length > 0 || selectedSymptoms.length > 0) && <div className="absolute top-1 right-2 w-1 h-1 bg-indigo-400 rounded-full"></div>}
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-2 px-1">Selected Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-rose-50/30 border-2 border-rose-50/50 rounded-2xl px-4 py-3 text-rose-900 font-bold focus:ring-4 focus:ring-rose-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4 scroll-smooth">
          <div className="space-y-8 pb-10">
            {activeTab === 'period' ? (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between p-6 bg-rose-50/30 rounded-3xl border-2 border-rose-50/50 transition-colors">
                   <div>
                      <p className="font-bold text-gray-800 text-sm">Include Period Log</p>
                      <p className="text-[10px] text-rose-300 uppercase font-bold tracking-widest mt-0.5">Toggle to add/remove this day</p>
                   </div>
                   <button 
                    onClick={() => setIsPeriodDay(!isPeriodDay)}
                    className={`w-12 h-7 rounded-full transition-all relative duration-300 ${isPeriodDay ? 'bg-rose-400' : 'bg-gray-200'}`}
                   >
                     <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${isPeriodDay ? 'translate-x-5' : 'translate-x-0'}`}></div>
                   </button>
                </div>

                {isPeriodDay && (
                  <div className="animate-in zoom-in-95 duration-200">
                    <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-4 px-1">Flow Intensity</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['light', 'medium', 'heavy'] as const).map((flow) => (
                        <button
                          key={flow}
                          onClick={() => setIntensity(flow)}
                          className={`flex flex-col items-center py-5 rounded-2xl border-2 transition-all capitalize squishy ${intensity === flow ? 'border-rose-400 bg-rose-400 text-white font-bold shadow-lg shadow-rose-100' : 'border-rose-50 bg-rose-50/30 text-rose-300 hover:border-rose-100'}`}
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
                  <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-4 px-1">Moods</label>
                  <div className="grid grid-cols-3 gap-3">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => toggleMood(mood.id)}
                        className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all squishy ${selectedMoods.includes(mood.id) ? 'border-rose-400 bg-rose-50 text-rose-600 font-bold shadow-md shadow-rose-50' : 'border-rose-50 bg-rose-50/30 text-rose-300 hover:border-rose-100'}`}
                      >
                        <span className="text-2xl mb-1">{mood.emoji}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-[0.2em] mb-4 px-1">Body Signals</label>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {SYMPTOMS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSymptom(s)}
                        className={`px-4 py-2 rounded-xl border-2 transition-all text-[10px] font-bold ${selectedSymptoms.includes(s) ? 'border-rose-400 bg-rose-400 text-white shadow-md shadow-rose-100' : 'border-rose-50 bg-rose-50/30 text-rose-300 hover:border-rose-100'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={addCustomSymptom} className="flex gap-2">
                    <input 
                      type="text" 
                      value={customSymptom}
                      onChange={(e) => setCustomSymptom(e.target.value)}
                      placeholder="Add another symptom..."
                      className="flex-1 bg-rose-50/30 border-2 border-rose-50/50 rounded-xl px-4 py-2.5 text-xs focus:ring-4 focus:ring-rose-100 outline-none transition-all placeholder:text-rose-200"
                    />
                    <button 
                      type="submit"
                      className="w-10 h-10 bg-rose-400 text-white rounded-xl flex items-center justify-center hover:bg-rose-500 shadow-md shadow-rose-100 transition-all squishy"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-rose-50 bg-white">
          {!cloudEnabled && (
            <button 
              onClick={handleCloudPrompt}
              disabled={isSyncing}
              className="w-full mb-3 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-3 h-3" alt="G" />
              {isSyncing ? 'Linking...' : 'Secure this data to private cloud'}
            </button>
          )}
          <button 
            onClick={handleSave}
            className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-4 rounded-3xl shadow-xl shadow-rose-100 transition-all transform hover:scale-[1.01] active:scale-[0.99] squishy"
          >
            Save for {format(new Date(date + 'T00:00:00'), 'MMM do')} ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogModal;