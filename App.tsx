import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('luna_unlocked') === 'true';
  });
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudEnabled, setCloudEnabled] = useState(() => {
    return localStorage.getItem('luna_cloud_enabled') === 'true';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('luna_notifications_enabled') === 'true';
  });

  // Sync lifecycle: idle -> restoring -> ready
  const [syncStatus, setSyncStatus] = useState<'idle' | 'restoring' | 'ready'>('idle');
  
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
      return JSON.parse(saved);
    } catch (e) {
      return { logs: [], symptoms: [], settings: { averageCycleLength: 28, averagePeriodLength: 5, aiProvider: 'gemini' } };
    }
  });

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalDate, setLogModalDate] = useState<string | undefined>();

  // Handle Initial Boot Restoration
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('luna_google_token');
      if (savedToken && cloudEnabled) {
        SyncService.setToken(savedToken);
        setIsSyncing(true);
        setSyncStatus('restoring');
        try {
          const cloudData = await SyncService.downloadFromCloud();
          if (cloudData) {
            setUserData(cloudData);
            console.log("Restored vault from Drive.");
          }
        } catch (e) {
          console.error("Auto-restoration failed.");
        } finally {
          setIsSyncing(false);
          setSyncStatus('ready');
        }
      } else {
        setSyncStatus('ready');
      }
    };
    restoreSession();

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
  }, [cloudEnabled]);

  // Unified Save Effect
  useEffect(() => {
    // Save locally
    localStorage.setItem('luna_cycle_data', JSON.stringify(userData));
    
    // Save to Cloud ONLY if we aren't currently restoring
    if (SyncService.accessToken && cloudEnabled && syncStatus === 'ready') {
      const debounceTimer = setTimeout(async () => {
        setIsSyncing(true);
        try {
          const success = await SyncService.saveToCloud(userData);
          if (success) console.log("Cloud sync successful.");
        } catch (e) {
          console.error("Cloud sync failed.", e);
        } finally {
          setIsSyncing(false);
        }
      }, 3000);
      return () => clearTimeout(debounceTimer);
    }
  }, [userData, cloudEnabled, syncStatus]);

  const handleLinkCloud = async (token: string) => {
    SyncService.setToken(token);
    setCloudEnabled(true);
    localStorage.setItem('luna_cloud_enabled', 'true');
    setIsSyncing(true);
    setSyncStatus('restoring');

    try {
      const cloudData = await SyncService.downloadFromCloud();
      if (cloudData) {
        // If local data exists, confirm overwrite
        const localDataPresent = userData.logs.length > 0 || userData.symptoms.length > 0;
        if (!localDataPresent || confirm("Existing cloud vault found. Load it now? (This replaces local data)")) {
          setUserData(cloudData);
        }
      } else {
        // New user? Upload local data immediately to initialize
        await SyncService.saveToCloud(userData);
      }
    } catch (err) {
      console.error("Linking cloud failed:", err);
    } finally {
      setIsSyncing(false);
      setSyncStatus('ready');
    }
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Luna_Vault_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (importedData.logs) {
          if (confirm("Replace current data with this backup file?")) {
            setUserData(importedData);
          }
        }
      } catch (err) {
        alert("Invalid file format.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const avgCycle = useMemo(() => getCycleSummary(userData.logs, userData.settings.averageCycleLength), [userData.logs, userData.settings.averageCycleLength]);
  const cycleDay = useMemo(() => getCurrentCycleDay(userData.logs), [userData.logs]);
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
      newLogs = payload.period ? [...filteredLogs, payload.period] : filteredLogs;
      newLogs.sort((a,b) => a.date.localeCompare(b.date));

      const filteredSymptoms = newSymptoms.filter(s => s.date !== payload.date);
      newSymptoms = payload.symptom ? [...filteredSymptoms, payload.symptom] : filteredSymptoms;
      newSymptoms.sort((a,b) => a.date.localeCompare(b.date));

      return { ...prev, logs: newLogs, symptoms: newSymptoms };
    });
  };

  const handleUpdateSettings = (newSettings: Partial<UserData['settings']>) => {
    setUserData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const handleUpdateLock = (method: 'pin' | 'google' | undefined, value?: string) => {
    handleUpdateSettings({ lockMethod: method, privacyPin: value });
  };

  if (partnerData) {
    return <PartnerPortal data={partnerData} />;
  }

  if (!isUnlocked) {
    return <AuthScreen onUnlock={(token) => {
      setIsUnlocked(true);
      localStorage.setItem('luna_unlocked', 'true');
      if (token) handleLinkCloud(token);
    }} onStayOffline={() => {
      setIsUnlocked(true);
      localStorage.setItem('luna_unlocked', 'true');
    }} />;
  }

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
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              {syncStatus === 'restoring' ? 'Restoring...' : 'Syncing Vault'}
            </span>
          </div>
        )}
      </nav>

      <main className="max-w-xl mx-auto px-6 pt-28">
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <section className="relative h-80 flex flex-col items-center justify-center text-center overflow-hidden rounded-[3.5rem] bg-white shadow-2xl shadow-rose-100/50 border border-white transition-all">
              <div className={`absolute inset-0 opacity-10 ${PHASE_COLORS[currentPhase]}`}></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-500">{PHASE_ICONS[currentPhase]}</div>
                <h2 className="text-4xl font-serif text-gray-900 mb-2">{currentPhase} Phase</h2>
                <p className="text-rose-400 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">Cycle Day {cycleDay}</p>
                <div className="bg-rose-50/50 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-rose-100/50">
                   <p className="text-gray-500 text-xs font-semibold">Period in <span className="text-rose-600 font-bold">{daysUntilNext} days</span></p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[3rem] p-8 border border-rose-50 shadow-sm leading-relaxed text-center italic text-gray-600 font-medium">
              "{PHASE_DESCRIPTIONS[currentPhase]}"
            </section>

            <button 
              onClick={() => setIsLogModalOpen(true)}
              className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-6 rounded-[2.5rem] shadow-xl shadow-rose-200 transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3 squishy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Log Today
            </button>

            <AdvicePanel phase={currentPhase} daysRemaining={daysUntilNext} symptoms={currentDaySymptoms} />
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView 
            userData={userData} 
            onDayClick={(date) => {
              setLogModalDate(date);
              setIsLogModalOpen(true);
            }} 
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            userData={userData} 
            cloudEnabled={cloudEnabled}
            notificationsEnabled={notificationsEnabled}
            onUpdateSettings={handleUpdateSettings}
            onUpdateLock={handleUpdateLock}
            onLinkCloud={handleLinkCloud}
            onToggleNotifications={() => {
              const newVal = !notificationsEnabled;
              setNotificationsEnabled(newVal);
              localStorage.setItem('luna_notifications_enabled', String(newVal));
            }}
            onExport={handleExportData}
            onImport={handleImportData}
          />
        )}
      </main>

      <div className="fixed bottom-8 left-6 right-6 z-50">
        <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-rose-200/50 border border-white/50 p-2 flex justify-around items-center h-20">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'overview' ? 'text-rose-500 scale-105' : 'text-gray-300 hover:text-rose-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11z"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Today</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'history' ? 'text-rose-500 scale-105' : 'text-gray-300 hover:text-rose-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">History</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center justify-center gap-1.5 transition-all ${activeTab === 'settings' ? 'text-rose-500 scale-105' : 'text-gray-300 hover:text-rose-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span className="text-[9px] font-bold uppercase tracking-widest">Settings</span>
          </button>
        </nav>
      </div>

      <LogModal 
        isOpen={isLogModalOpen} 
        onClose={() => {
          setIsLogModalOpen(false);
          setLogModalDate(undefined);
        }} 
        onSave={handleSaveLog}
        userData={userData}
        initialDate={logModalDate}
        cloudEnabled={cloudEnabled}
        onEnableCloud={handleLinkCloud}
      />
    </div>
  );
};

export default App;