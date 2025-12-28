import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { UserData, PartnerData, LogPayload } from './types';
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
  const [isUnlocked, setIsUnlocked] = useState(() => localStorage.getItem('luna_unlocked') === 'true');
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudEnabled, setCloudEnabled] = useState(() => localStorage.getItem('luna_cloud_enabled') === 'true');
  
  // LifeCycle: 'idle' -> 'discovering' -> 'ready'
  // CRITICAL: App must not save to cloud while in 'discovering' state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'discovering' | 'ready'>('idle');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('luna_notifications_enabled') === 'true');

  const [userData, setUserData] = useState<UserData>(() => {
    const saved = localStorage.getItem('luna_cycle_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return {
      logs: [], symptoms: [],
      settings: { averageCycleLength: 28, averagePeriodLength: 5, aiProvider: 'gemini' }
    };
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalDate, setLogModalDate] = useState<string | undefined>();

  // STARTUP DISCOVERY ENGINE
  useEffect(() => {
    const runDiscovery = async () => {
      const token = localStorage.getItem('luna_google_token');
      if (token && cloudEnabled) {
        SyncService.setToken(token);
        setSyncStatus('discovering');
        setIsSyncing(true);
        try {
          // Check Drive for existing file
          const cloudData = await SyncService.downloadFromCloud();
          if (cloudData) {
            // Logic: If local is empty (e.g. cache cleared), restore immediately
            const localIsEmpty = userData.logs.length === 0 && userData.symptoms.length === 0;
            if (localIsEmpty) {
              setUserData(cloudData);
              console.log("Auto-restored vault from Google Drive.");
            }
          }
        } catch (e) {
          console.error("Vault discovery failed", e);
        } finally {
          setIsSyncing(false);
          setSyncStatus('ready');
        }
      } else {
        setSyncStatus('ready');
      }
    };
    runDiscovery();
  }, [cloudEnabled]);

  // UNIFIED PERSISTENCE ENGINE
  useEffect(() => {
    // 1. Save locally (immediate)
    localStorage.setItem('luna_cycle_data', JSON.stringify(userData));

    // 2. Queue cloud sync (debounced)
    // ONLY run if syncStatus is 'ready' to avoid overwriting cloud with empty cache
    if (SyncService.accessToken && cloudEnabled && syncStatus === 'ready') {
      const timer = setTimeout(async () => {
        setIsSyncing(true);
        try {
          await SyncService.saveToCloud(userData);
        } catch (e) {
          console.error("Background sync failed", e);
        } finally {
          setIsSyncing(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userData, cloudEnabled, syncStatus]);

  const handleLinkCloud = async (token: string) => {
    SyncService.setToken(token);
    setCloudEnabled(true);
    localStorage.setItem('luna_cloud_enabled', 'true');
    setSyncStatus('discovering');
    setIsSyncing(true);
    try {
      const cloudData = await SyncService.downloadFromCloud();
      if (cloudData) {
        const localDataPresent = userData.logs.length > 0 || userData.symptoms.length > 0;
        if (!localDataPresent || confirm("Existing vault found! Restore your previous history now?")) {
          setUserData(cloudData);
          alert("Success! History restored from Drive.");
        }
      } else {
        // No file found, create a new one with current local data
        await SyncService.saveToCloud(userData);
      }
    } catch (e) {
      alert("Connection to Drive failed.");
    } finally {
      setIsSyncing(false);
      setSyncStatus('ready');
    }
  };

  const handleUpdateSettings = (newSettings: Partial<UserData['settings']>) => {
    setUserData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  };

  const handleSaveLog = (payload: LogPayload) => {
    setUserData(prev => {
      let newLogs = prev.logs.filter(l => l.date !== payload.date);
      if (payload.period) newLogs.push(payload.period);
      let newSymptoms = prev.symptoms.filter(s => s.date !== payload.date);
      if (payload.symptom) newSymptoms.push(payload.symptom);
      return { ...prev, logs: newLogs.sort((a,b) => a.date.localeCompare(b.date)), symptoms: newSymptoms.sort((a,b) => a.date.localeCompare(b.date)) };
    });
  };

  const avgCycle = useMemo(() => getCycleSummary(userData.logs, userData.settings.averageCycleLength), [userData.logs, userData.settings.averageCycleLength]);
  const cycleDay = useMemo(() => getCurrentCycleDay(userData.logs), [userData.logs]);
  const currentPhase = useMemo(() => determinePhase(cycleDay, avgCycle, userData.settings.averagePeriodLength), [cycleDay, avgCycle, userData.settings.averagePeriodLength]);
  const nextPeriod = useMemo(() => calculateNextPeriod(userData.logs, avgCycle), [userData.logs, avgCycle]);
  const daysUntilNext = nextPeriod ? differenceInDays(nextPeriod, new Date()) : 28;

  if (partnerData) return <PartnerPortal data={partnerData} />;
  if (!isUnlocked) return <AuthScreen onUnlock={(t) => { setIsUnlocked(true); localStorage.setItem('luna_unlocked', 'true'); if (t) handleLinkCloud(t); }} onStayOffline={() => { setIsUnlocked(true); localStorage.setItem('luna_unlocked', 'true'); }} />;

  return (
    <div className="min-h-screen pb-32">
      <nav className="fixed top-0 left-0 right-0 bg-[#fff9f8]/80 backdrop-blur-xl z-40 border-b border-rose-50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-rose-100 flex items-center justify-center text-xl">🌙</div>
          <span className="font-serif text-2xl text-rose-900">Luna</span>
        </div>
        {isSyncing && (
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 animate-pulse transition-all">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
              {syncStatus === 'discovering' ? 'Finding Vault...' : 'Vaulting...'}
            </span>
          </div>
        )}
      </nav>

      <main className="max-w-xl mx-auto px-6 pt-28">
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative h-80 flex flex-col items-center justify-center text-center overflow-hidden rounded-[3.5rem] bg-white shadow-2xl shadow-rose-100/50 border border-white transition-all">
              <div className={`absolute inset-0 opacity-10 ${PHASE_COLORS[currentPhase]}`}></div>
              <div className="relative z-10">
                <div className="text-7xl mb-6">{PHASE_ICONS[currentPhase]}</div>
                <h2 className="text-4xl font-serif text-gray-900 mb-2">{currentPhase} Phase</h2>
                <p className="text-rose-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">Cycle Day {cycleDay}</p>
                <div className="bg-rose-50/50 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-rose-100/50">
                   <p className="text-gray-500 text-xs font-semibold">Next period in <span className="text-rose-600 font-bold">{daysUntilNext} days</span></p>
                </div>
              </div>
            </section>
            <button onClick={() => setIsLogModalOpen(true)} className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-6 rounded-[2.5rem] shadow-xl shadow-rose-200 flex items-center justify-center gap-3 squishy">
              Log Today
            </button>
            <AdvicePanel phase={currentPhase} daysRemaining={daysUntilNext} symptoms={[]} />
          </div>
        )}

        {activeTab === 'history' && <HistoryView userData={userData} onDayClick={(d) => { setLogModalDate(d); setIsLogModalOpen(true); }} />}
        {activeTab === 'settings' && <SettingsView userData={userData} cloudEnabled={cloudEnabled} onUpdateSettings={handleUpdateSettings} onUpdateLock={() => {}} onLinkCloud={handleLinkCloud} notificationsEnabled={notificationsEnabled} onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)} onExport={() => {}} onImport={() => {}} />}
      </main>

      <div className="fixed bottom-8 left-6 right-6 z-50">
        <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 p-2 flex justify-around items-center h-20">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'overview' ? 'text-rose-500 scale-105' : 'text-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11z"/></svg>
            <span className="text-[9px] font-bold uppercase">Today</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'history' ? 'text-rose-500 scale-105' : 'text-gray-300'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
            <span className="text-[9px] font-bold uppercase">History</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-rose-500 scale-105' : 'text-gray-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span className="text-[9px] font-bold uppercase">Settings</span>
          </button>
        </nav>
      </div>

      <LogModal isOpen={isLogModalOpen} onClose={() => { setIsLogModalOpen(false); setLogModalDate(undefined); }} onSave={handleSaveLog} userData={userData} initialDate={logModalDate} cloudEnabled={cloudEnabled} onEnableCloud={handleLinkCloud} />
    </div>
  );
};

export default App;