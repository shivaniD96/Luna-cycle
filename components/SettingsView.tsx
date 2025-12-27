
import React, { useState } from 'react';
import { UserData } from '../types';
import { SyncService } from '../services/syncService';

interface SettingsViewProps {
  userData: UserData;
  cloudEnabled: boolean;
  onUpdateLock: (method: 'pin' | 'google' | undefined, value?: string) => void;
  onUpdateSettings: (settings: Partial<UserData['settings']>) => void;
  onLinkCloud: (token: string) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  userData, cloudEnabled, onUpdateLock, onUpdateSettings, onLinkCloud,
  notificationsEnabled, onToggleNotifications, onExport, onImport
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleGoogleAuth = () => {
    setIsAuthorizing(true);
    SyncService.triggerLogin(
      (token) => {
        setIsAuthorizing(false);
        onLinkCloud(token);
      },
      (err) => {
        setIsAuthorizing(false);
        alert("Authorization failed. Please ensure your internet is connected.");
      }
    );
  };

  const handleSetPin = () => {
    if (pinInput.length === 4) {
      onUpdateLock('pin', pinInput);
      setPinInput('');
      alert('Privacy PIN set!');
    } else {
      alert('PIN must be 4 digits.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* CLOUD SYNC SECTION */}
      <section className={`rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden transition-all duration-500 ${cloudEnabled ? 'bg-indigo-600 shadow-indigo-100/50 text-white' : 'bg-white border-2 border-rose-100 shadow-rose-50'}`}>
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <h3 className={`text-xl font-bold flex items-center gap-2 mb-2 ${cloudEnabled ? 'text-white' : 'text-rose-900'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
             {cloudEnabled ? 'Cloud Vault Active' : 'Automatic Sync'}
          </h3>

          <p className={`text-xs leading-relaxed mb-6 ${cloudEnabled ? 'text-indigo-100' : 'text-gray-500'}`}>
            {cloudEnabled 
              ? "All your cycle data is being securely synced to a hidden folder in your Google Drive." 
              : "Keep your data safe and synced across devices using your private Google storage locker."}
          </p>
          
          {cloudEnabled ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-3 rounded-2xl border border-white/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Secured by Google</span>
              </div>
              <button onClick={() => { SyncService.logout(); window.location.reload(); }} className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest hover:text-white underline">Disconnect</button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleAuth}
              disabled={isAuthorizing}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 squishy transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5 brightness-0 invert" alt="G" />
              {isAuthorizing ? 'Connecting...' : 'Enable Cloud Backup'}
            </button>
          )}
        </div>
      </section>

      {/* DATA VAULT */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100 overflow-hidden relative">
        <div className="absolute top-[-10px] right-[-10px] w-24 h-24 bg-rose-50 rounded-full blur-2xl opacity-50"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Manual Backup
          </h3>
          <p className="text-xs text-gray-400 mb-6">Backup your data to a JSON file or move it to a new device without using the cloud.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button 
              onClick={onExport}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100"
            >
              Export JSON
            </button>
            
            <label className="w-full py-4 bg-white text-gray-400 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 border-dashed border-gray-100 hover:border-rose-100 hover:text-rose-400 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span>Import JSON</span>
              <input type="file" accept=".json" className="hidden" onChange={onImport} />
            </label>
          </div>
        </div>
      </section>

      {/* CYCLE SETTINGS */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 text-rose-500">Cycle Baseline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-2">Cycle Length</label>
            <div className="flex items-center gap-4">
               <input 
                type="number"
                value={userData.settings.averageCycleLength}
                onChange={(e) => onUpdateSettings({ averageCycleLength: parseInt(e.target.value) || 28 })}
                className="flex-1 bg-rose-50/30 border border-rose-100 rounded-2xl px-4 py-3 font-bold text-rose-900 outline-none"
              />
              <span className="text-xs font-bold text-rose-300">Days</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-2">Period Duration</label>
            <div className="flex items-center gap-4">
              <input 
                type="number"
                value={userData.settings.averagePeriodLength}
                onChange={(e) => onUpdateSettings({ averagePeriodLength: parseInt(e.target.value) || 5 })}
                className="flex-1 bg-rose-50/30 border border-rose-100 rounded-2xl px-4 py-3 font-bold text-rose-900 outline-none"
              />
              <span className="text-xs font-bold text-rose-300">Days</span>
            </div>
          </div>
        </div>
      </section>

      {/* LOCK SETTINGS */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">App Privacy Lock</h3>
        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 mt-4">
          {userData.settings.lockMethod === 'pin' ? (
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800">4-Digit PIN Enabled ✓</p>
              <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-rose-500 hover:underline">Remove Lock</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                type="password" maxLength={4} placeholder="Set 4-digit PIN" value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3 text-center font-bold outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold squishy">Set PIN</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
