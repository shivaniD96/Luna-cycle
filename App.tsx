
import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { UserData, PartnerData, LogPayload } from './types';
import { calculateNextPeriod, getCurrentCycleDay, determinePhase, getCycleSummary } from './utils/cycleCalculator.ts';
import { PHASE_COLORS, PHASE_ICONS, PHASE_DESCRIPTIONS } from './constants.tsx';
import LogModal from './components/LogModal.tsx';
import AdvicePanel from './components/AdvicePanel.tsx';
import HistoryView from './components/HistoryView.tsx';
import SettingsView from './components/SettingsView.tsx';
import AuthScreen from './components/AuthScreen.tsx';
import PartnerPortal from './components/PartnerPortal.tsx';
import { SyncService } from './services/syncService.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'settings'>('overview');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('luna_cycle_data');
    if (!saved) return {
      logs: [],
      symptoms: [],
      settings: { 
        averageCycleLength: 28, 
        averagePeriodLength: 5,
        lockMethod: undefined,
        aiProvider: 'gemini'
      }
    };

    try {
      const parsed = JSON.parse(saved);
      return parsed;
    } catch (e) {
      return {
        logs: [],
        symptoms: [],
        settings: { 
          averageCycleLength: 28, 
          averagePeriodLength: 5,
          lockMethod: undefined,
          aiProvider: 'gemini'
        }
      };
    }
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalDate, setLogModalDate] = useState<string | undefined>();
  const [isSyncActive, setIsSyncActive] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/partner-view')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      const dataStr = params.get('data');
      if (dataStr) {
        try {
          const decoded = JSON.parse(atob(dataStr));
          setPartnerData(decoded);
        } catch (e) {
          console.error("Failed to decode partner data");
        }
      }
    }

    if (!userData.settings.lockMethod) {
      setIsUnlocked(true);
    }
  }, [userData.settings.lockMethod]);

  useEffect(() => {
    localStorage.setItem('luna_cycle_data', JSON.stringify(userData));
    
    if (isSyncActive) {
      const debounceTimer = setTimeout(async () => {
        await SyncService.saveToFile(userData);
      }, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [userData, isSyncActive]);

  const cycleDay = useMemo(() => getCurrentCycleDay(userData.logs), [userData.logs]);
  const avgCycle = useMemo(() => getCycleSummary(userData.logs, userData.settings.averageCycleLength), [userData.logs, userData.settings.averageCycleLength]);
  const currentPhase = useMemo(() => determinePhase(cycleDay, avgCycle, userData.settings.averagePeriodLength), [cycleDay, avgCycle, userData.settings.averagePeriodLength]);
  const nextPeriod = useMemo(() => calculateNextPeriod(userData.logs, avgCycle), [userData.logs, avgCycle]);
  
  const daysUntilNext = nextPeriod ? differenceInDays(nextPeriod, new Date()) : 28;

  const currentDaySymptoms = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return userData.symptoms.find(s => s.date === todayStr)?.physicalSymptoms || [];
  }, [userData.symptoms]);

  const handleSaveLog = (payload: LogPayload) => {
    setUserData(prev => {
      let newLogs = [...prev.logs];
      let newSymptoms = [...prev.symptoms];

      const filteredLogs = newLogs.filter(l => l.date !== payload.date);
      if (payload.period) {
        newLogs = [...filteredLogs, payload.period].sort((a,b) => a.date.localeCompare(b.date));
      } else {
        newLogs = filteredLogs;
      }

      const filteredSymptoms = newSymptoms.filter(s => s.date !== payload.date);
      if (payload.symptom) {
        newSymptoms = [...filteredSymptoms, payload.symptom].sort((a,b) => a.date.localeCompare(b.date));
      } else {
        newSymptoms = filteredSymptoms;
      }

      return { ...prev, logs: newLogs, symptoms: newSymptoms };
    });
  };

  const handleEnableSync = async () => {
    const success = await SyncService.requestFileHandle();
    if (success) {
      setIsSyncActive(true);
      SyncService.saveToFile(userData);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<UserData['settings']>) => {
    setUserData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const handleUpdateLock = (method: 'pin' | 'google' | undefined, value?: string) => {
    handleUpdateSettings({
      lockMethod: method,
      privacyPin: method === 'pin' ? value : undefined,
      googleUserEmail: method === 'google' ? value : undefined
    });
  };

  const generateShareLink = () => {
    const shareObj: PartnerData = {
      phase: currentPhase,
      daysUntilNext,
      symptoms: currentDaySymptoms,
      avgCycle
    };
    const url = `${window.location.origin}${window.location.pathname}#/partner-view?data=${btoa(JSON.stringify(shareObj))}`;
    navigator.clipboard.writeText(url);
    alert('Partner link copied to clipboard!');
  };

  if (partnerData) {
    return <PartnerPortal data={partnerData} />;
  }

  if (!isUnlocked && userData.settings.lockMethod) {
    return (
      <AuthScreen 
        correctPin={userData.settings.privacyPin} 
        lockMethod={userData.settings.lockMethod} 
        onUnlock={() => setIsUnlocked(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-32 relative">
      <header className="p-8 md:p-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-rose-100 flex items-center justify-center text-2xl">
              {PHASE_ICONS[currentPhase] || '✨'}
            </div>
            <div>
              <h1 className="text-4xl font-serif text-rose-900 leading-none">Luna</h1>
              <p className="text-[10px] text-rose-300 font-bold uppercase tracking-[0.2em] mt-1">Private Companion</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={generateShareLink} title="Share with Partner" className="p-4 bg-white/70 text-rose-400 rounded-2xl border border-white hover:shadow-md transition-all squishy">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/></svg>
              </button>
              <button onClick={() => setIsUnlocked(false)} className="p-4 bg-rose-50/50 text-rose-400 rounded-2xl border border-rose-100 hover:text-rose-600 transition-all squishy">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${isSyncActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600 cursor-pointer'}`} onClick={!isSyncActive ? () => setActiveTab('settings') : undefined}>
            <div className={`w-1.5 h-1.5 rounded-full ${isSyncActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
            {isSyncActive ? 'Synced' : 'Sync Disconnected'}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 space-y-10">
        
        <div className="flex bg-rose-50/70 p-1.5 rounded-[2rem] w-full max-w-sm mx-auto shadow-inner glass-card">
          {(['overview', 'history', 'settings'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-[1.5rem] text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-white text-rose-500 shadow-md scale-105' : 'text-rose-300 hover:text-rose-400'}`}
            >
              {tab === 'overview' ? 'Today' : tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <section className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl shadow-rose-100/40 border border-white text-center relative overflow-hidden glass-card">
              <div className={`absolute top-0 left-0 w-full h-3 ${PHASE_COLORS[currentPhase] || 'bg-rose-100'}`}></div>
              <div className="relative inline-block mb-10">
                <div className={`w-56 h-56 md:w-72 md:h-72 rounded-full border-[12px] border-white shadow-xl ${PHASE_COLORS[currentPhase] || 'bg-rose-100'} opacity-20 flex items-center justify-center animate-pulse`}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl mb-2">{PHASE_ICONS[currentPhase] || '🌙'}</span>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-[0.3em] mb-1">Cycle Day</span>
                  <span className="text-7xl md:text-9xl font-serif text-rose-900 leading-none">{cycleDay}</span>
                  <div className={`mt-3 px-4 py-1.5 rounded-full text-white text-xs font-bold ${PHASE_COLORS[currentPhase] || 'bg-rose-300'} shadow-lg`}>
                    {currentPhase}
                  </div>
                </div>
              </div>
              <div className="bg-rose-50/50 rounded-[2.5rem] p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{daysUntilNext === 0 ? "Expected Today" : `${daysUntilNext} Days Remaining`}</h2>
                <p className="text-gray-500 max-w-md mx-auto leading-relaxed text-sm font-medium">{PHASE_DESCRIPTIONS[currentPhase]}</p>
              </div>

              {/* LOG BUTTON (STAYED PERSISTENT) */}
              <button 
                onClick={() => { setLogModalDate(format(new Date(), 'yyyy-MM-dd')); setIsLogModalOpen(true); }}
                className={`w-full max-w-xs mx-auto py-5 rounded-[2rem] text-white font-bold shadow-2xl transition-all flex items-center justify-center gap-3 squishy text-lg ${PHASE_COLORS[currentPhase] || 'bg-rose-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
                Log Today
              </button>
            </section>

            <AdvicePanel 
              phase={currentPhase} 
              daysRemaining={daysUntilNext} 
              symptoms={currentDaySymptoms} 
              onOpenSettings={() => setActiveTab('settings')}
            />
          </div>
        )}

        {activeTab === 'history' && <HistoryView userData={userData} onDayClick={(date) => { setLogModalDate(date); setIsLogModalOpen(true); }} />}
        {activeTab === 'settings' && (
          <SettingsView 
            userData={userData} 
            onImport={(data) => { setUserData(data); setActiveTab('overview'); }} 
            isSyncActive={isSyncActive}
            onEnableSync={handleEnableSync}
            onUpdateLock={handleUpdateLock}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      <LogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} onSave={handleSaveLog} userData={userData} initialDate={logModalDate} />
    </div>
  );
};

export default App;
