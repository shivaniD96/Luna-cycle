
import React, { useState, useRef } from 'react';
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
  const [showCloudSetup, setShowCloudSetup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customClientId, setCustomClientId] = useState(SyncService.getClientId() === 'YOUR_GOOGLE_CLIENT_ID' ? '' : SyncService.getClientId());

  const handleGoogleAuth = () => {
    setIsAuthorizing(true);
    SyncService.triggerLogin(
      (token) => {
        setIsAuthorizing(false);
        onLinkCloud(token);
      },
      (err) => {
        setIsAuthorizing(false);
        if (err === 'MISSING_CLIENT_ID' || err === 'INVALID_CLIENT' || (err && err.error === 'invalid_client')) {
          setShowCloudSetup(true);
        } else {
          alert("Authorization failed. Ensure your Internet is connected or check your Client ID configuration.");
          setShowCloudSetup(true);
        }
      }
    );
  };

  const saveClientId = () => {
    if (!customClientId.includes('.apps.googleusercontent.com')) {
      alert("Invalid Client ID format.");
      return;
    }
    SyncService.setCustomClientId(customClientId.trim());
    alert('Client ID updated. You can try linking now.');
    setShowCloudSetup(false);
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
      
      {/* DATA & BACKUP */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100 overflow-hidden relative">
        <div className="absolute top-[-10px] right-[-10px] w-24 h-24 bg-rose-50 rounded-full blur-2xl opacity-50"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Data Vault
          </h3>
          <p className="text-xs text-gray-400 mb-6">Backup your data to a private file or move it to a new device without any cloud setup.</p>
          
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={onExport}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100"
            >
              Export Backup File
            </button>
            
            <label className="w-full py-4 bg-white text-gray-400 rounded-2xl font-bold text-xs uppercase tracking-widest border-2 border-dashed border-gray-100 hover:border-rose-100 hover:text-rose-400 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span>Import From Backup</span>
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={onImport}
              />
            </label>
          </div>
        </div>
      </section>

      {/* CLOUD INFO */}
      <section className={`rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden transition-all duration-500 ${cloudEnabled ? 'bg-indigo-600 shadow-indigo-100/50' : 'bg-white border-2 border-rose-100 shadow-rose-50'}`}>
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${cloudEnabled ? 'text-white' : 'text-rose-900'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cloudEnabled ? 'text-white' : 'text-rose-400'}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
               {cloudEnabled ? 'Luna Private Cloud' : 'Cloud Sync (Advanced)'}
            </h3>
            {!cloudEnabled && (
              <button onClick={() => setShowCloudSetup(!showCloudSetup)} className="text-[10px] font-bold text-rose-300 uppercase tracking-widest hover:text-rose-500 transition-colors">
                {showCloudSetup ? 'Hide Setup' : 'Setup Guide'}
              </button>
            )}
          </div>

          {showCloudSetup && !cloudEnabled && (
            <div className="mb-6 space-y-4 p-5 bg-rose-50/50 rounded-2xl border border-rose-100 animate-in slide-in-from-top-2 text-left">
              <div className="text-[10px] text-rose-800 leading-relaxed space-y-2">
                <p>1. Go to <a href="https://console.cloud.google.com/" target="_blank" className="underline font-bold">Google Cloud Console</a>.</p>
                <p>2. Create a Project and an <strong>OAuth Client ID</strong> (Web Application).</p>
                <div className="p-2 bg-slate-900 text-white rounded-lg mt-2">
                  <p className="font-bold text-emerald-400 uppercase text-[8px] mb-1">Authorized Origin:</p>
                  <code className="text-[9px] break-all select-all">{window.location.origin}</code>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-bold text-rose-300 uppercase tracking-widest">Your Google Client ID</label>
                <input 
                  type="text" 
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder="...apps.googleusercontent.com"
                  className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-[10px] font-medium outline-none font-mono"
                />
                <button onClick={saveClientId} className="text-[10px] font-bold text-rose-500 underline">Save Client ID</button>
              </div>
            </div>
          )}

          <p className={`text-xs leading-relaxed mb-6 ${cloudEnabled ? 'text-indigo-100' : 'text-gray-500'}`}>
            {cloudEnabled 
              ? "Luna is automatically backing up every change to your hidden Google Drive vault." 
              : "Sync across devices automatically using your own Google account. Requires a one-time technical setup."}
          </p>
          
          {cloudEnabled ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-3 rounded-2xl border border-white/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Connected & Secure</span>
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
              {isAuthorizing ? 'Authorizing...' : 'Link Google Drive'}
            </button>
          )}
        </div>
      </section>

      {/* NOTIFICATIONS */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          Smart Reminders
        </h3>
        <p className="text-xs text-gray-400 mb-6 px-1">Native device alerts for periods and ovulation.</p>
        
        <div className="flex items-center justify-between p-6 bg-indigo-50/30 rounded-3xl border border-indigo-50">
          <p className="font-bold text-gray-800 text-sm">Enable Alerts</p>
          <button 
            onClick={onToggleNotifications}
            className={`w-12 h-7 rounded-full transition-all relative duration-300 ${notificationsEnabled ? 'bg-indigo-500' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ease-in-out ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </button>
        </div>
      </section>

      {/* CYCLE BASICS */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 text-rose-500">Cycle Defaults</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-2">Average Cycle Length</label>
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
            <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-2">Average Period Duration</label>
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

      {/* LOCK */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">Privacy Lock</h3>
        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 mt-4">
          {userData.settings.lockMethod === 'pin' ? (
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800">PIN Secure ✓</p>
              <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-rose-500">Disable</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                type="password" maxLength={4} placeholder="Set 4-digit PIN" value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3 text-center font-bold outline-none"
              />
              <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold squishy">Set</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
