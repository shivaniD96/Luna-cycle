import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { UserData, PartnerData } from './types';
import { calculateNextPeriod, getCurrentCycleDay, determinePhase, getCycleSummary } from './utils/cycleCalculator';
import { PHASE_COLORS, PHASE_ICONS, PHASE_DESCRIPTIONS } from './constants';
import LogModal from './components/LogModal';
import AdvicePanel from './components/AdvicePanel';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import AuthScreen from './components/AuthScreen';
import PartnerPortal from './components/PartnerPortal';
import { SyncService } from './services/syncService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'settings'>('overview');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  
  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('luna_cycle_data');
    return saved ? JSON.parse(saved) : {
      logs: [],
      symptoms: [],
      settings: { 
        averageCycleLength: 28, 
        averagePeriodLength: 5,
        lockMethod: undefined
      }
    };
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

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
  }, []);

  useEffect(() => {
    localStorage.setItem('luna_cycle_data', JSON.stringify(userData));
    
    if (isSyncActive) {
      const debounceTimer = setTimeout(async () => {
        const success = await SyncService.saveToFile(userData);
        if (success) setLastSyncTime(new Date());
      }, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [userData, isSyncActive]);

  const cycleDay = useMemo(() => getCurrentCycleDay(userData.logs), [userData.logs]);
  const avgCycle = useMemo(() => getCycleSummary(userData.logs, userData.settings.averageCycleLength), [userData.logs]);
  const currentPhase = useMemo(() => determinePhase(cycleDay, avgCycle, userData.settings.averagePeriodLength), [cycleDay, avgCycle]);
  const nextPeriod = useMemo(() => calculateNextPeriod(userData.logs, avgCycle), [userData.logs, avgCycle]);
  
  const daysUntilNext = nextPeriod ? differenceInDays(nextPeriod, new Date()) : 28;

  const currentDaySymptoms = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return userData.symptoms.find(s => s.date === todayStr)?.physicalSymptoms || [];
  }, [userData.symptoms]);

  const handleSaveLog = (data: { type: 'period' | 'symptom', payload: any }) => {
    if (data.type === 'period') {
      setUserData(prev => ({ ...prev, logs: [...prev.logs, data.payload].sort((a,b) => a.startDate.localeCompare(b.startDate)) }));
    } else {
      setUserData(prev => {
        const filtered = prev.symptoms.filter(s => s.date !== data.payload.date);
        return { ...prev, symptoms: [...filtered, data.payload] };
      });
    }
  };

  const handleEnableSync = async () => {
    const success = await SyncService.requestFileHandle();
    if (success) {
      setIsSyncActive(true);
      SyncService.saveToFile(userData);
    }
  };

  const handleImport = (newData: UserData) => {
    setUserData(newData);
    setActiveTab('overview');
  };

  const handleUpdateLock = (method: 'pin' | 'google' | undefined, value?: string) => {
    setUserData(prev => ({
      ...prev,
      settings: { 
        ...prev.settings, 
        lockMethod: method,
        privacyPin: method === 'pin' ? value : undefined,
        googleUserEmail: method === 'google' ? value : undefined
      }
    }));
  };

  const generateShareLink = () => {
    const shareObj: PartnerData = {
      phase: currentPhase,
      daysUntilNext,
      symptoms: currentDaySymptoms,
      avgCycle
    };
    const url = `${window.location.origin}${window.location.pathname}#/partner-view?data=${btoa(JSON.stringify(shareObj))}`;
    setShareLink(url);
    // Scroll to share link info
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="min-h-screen pb-24 relative">
      <header className="p-8 md:p-12 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-rose-100 flex items-center justify-center text-2xl animate-bounce duration-3000">
            {PHASE_ICONS[currentPhase]}
          </div>
          <div>
            <h1 className="text-4xl font-serif text-rose-900 tracking-tight leading-none">Luna</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-[0.2em] bg-white/50 px-2 py-0.5 rounded-full border border-rose-100">Private</span>
              {isSyncActive && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-[9px] text-emerald-600 font-bold uppercase">Live Sync</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={generateShareLink}
            className="p-4 bg-white/70 text-rose-400 rounded-3xl shadow-sm border border-white hover:shadow-md transition-all squishy"
            title="Share with partner"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
          </button>
          <button 
            onClick={() => setIsUnlocked(false)}
            className="p-4 bg-rose-50/50 text-rose-400 rounded-3xl border border-rose-100 hover:text-rose-600 transition-all squishy"
            title="Lock App"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </button>
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

        {shareLink && (
          <div className="bg-white border-2 border-dashed border-emerald-200 p-5 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4 text-emerald-800 text-sm animate-in zoom-in-95 duration-300">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">✨</div>
            <span className="flex-1 font-medium">Link ready! Send this to your partner so they can support you with AI insights.</span>
            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={() => {navigator.clipboard.writeText(shareLink); alert('Link copied!');}}
                className="flex-1 md:flex-none px-6 py-2 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-100"
              >
                Copy Link
              </button>
              <button onClick={() => setShareLink(null)} className="p-2 text-emerald-300 hover:text-emerald-500 transition-colors">✕</button>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <section className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl shadow-rose-100/40 border border-white text-center relative overflow-hidden glass-card">
              <div className={`absolute top-0 left-0 w-full h-3 ${PHASE_COLORS[currentPhase]}`}></div>
              
              <div className="relative inline-block mb-10">
                <div className={`w-56 h-56 md:w-72 md:h-72 rounded-full border-[12px] border-white shadow-xl ${PHASE_COLORS[currentPhase]} opacity-20 flex items-center justify-center animate-pulse`}></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl mb-2">{PHASE_ICONS[currentPhase]}</span>
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-[0.3em] mb-1">Cycle Day</span>
                  <span className="text-7xl md:text-9xl font-serif text-rose-900 leading-none">{cycleDay}</span>
                  <div className={`mt-3 px-4 py-1.5 rounded-full text-white text-xs font-bold ${PHASE_COLORS[currentPhase]} shadow-lg`}>
                    {currentPhase}
                  </div>
                </div>
              </div>

              <div className="bg-rose-50/50 rounded-[2.5rem] p-6 mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {daysUntilNext === 0 ? "Period expected today!" : `Next period in ${daysUntilNext} days`}
                </h2>
                <p className="text-gray-500 max-w-md mx-auto leading-relaxed text-sm font-medium">
                  {PHASE_DESCRIPTIONS[currentPhase]}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="bg-rose-400 text-white p-10 rounded-[3rem] shadow-xl shadow-rose-200 flex flex-col items-center justify-center gap-3 hover:bg-rose-500 transition-all squishy"
              >
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">📝</div>
                <span className="font-bold text-xl tracking-tight">Log Today</span>
              </button>
              
              <div className="bg-indigo-50/80 text-indigo-700 p-10 rounded-[3rem] flex flex-col items-center justify-center gap-2 border border-indigo-100 glass-card">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Your Average</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-serif">{avgCycle}</span>
                  <span className="text-sm font-bold">days</span>
                </div>
                <div className="w-12 h-1 bg-indigo-200 rounded-full mt-2"></div>
              </div>
            </div>

            <AdvicePanel 
              phase={currentPhase} 
              daysRemaining={daysUntilNext} 
              symptoms={currentDaySymptoms} 
              onShare={generateShareLink}
            />
          </div>
        )}

        {activeTab === 'history' && <HistoryView userData={userData} />}
        {activeTab === 'settings' && (
          <SettingsView 
            userData={userData} 
            onImport={handleImport} 
            isSyncActive={isSyncActive}
            onEnableSync={handleEnableSync}
            onUpdateLock={handleUpdateLock}
          />
        )}

        <footer className="pt-20 pb-10 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-rose-300 text-xs font-bold bg-white/80 border border-rose-50 py-3 px-6 rounded-full w-max mx-auto shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            ENCRYPTED • PRIVATE • YOURS
          </div>
          {lastSyncTime && (
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
              Auto-saved to file: {format(lastSyncTime, 'hh:mm:ss a')}
            </p>
          )}
        </footer>
      </main>

      <LogModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        onSave={handleSaveLog}
      />
    </div>
  );
};

export default App;