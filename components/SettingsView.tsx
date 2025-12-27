
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
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  userData, cloudEnabled, onUpdateLock, onUpdateSettings, onLinkCloud,
  notificationsEnabled, onToggleNotifications
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [showCloudSetup, setShowCloudSetup] = useState(false);
  const [customClientId, setCustomClientId] = useState(SyncService.getClientId());

  const handleGoogleAuth = () => {
    setIsAuthorizing(true);
    SyncService.triggerLogin(
      (token) => {
        setIsAuthorizing(false);
        onLinkCloud(token);
      },
      (err) => {
        setIsAuthorizing(false);
        if (err === 'MISSING_CLIENT_ID') {
          setShowCloudSetup(true);
        } else {
          alert("Authorization failed. Error: " + (err?.error || "Unknown Error") + "\n\nTip: Ensure your URL is added to 'Authorized JavaScript Origins' in Google Cloud Console.");
          setShowCloudSetup(true);
        }
      }
    );
  };

  const saveClientId = () => {
    SyncService.setCustomClientId(customClientId);
    alert('Client ID updated. Try syncing now.');
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
      
      {/* CLOUD INFO */}
      <section className={`rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden transition-all duration-500 ${cloudEnabled ? 'bg-indigo-600 shadow-indigo-100/50' : 'bg-white border-2 border-rose-100 shadow-rose-50'}`}>
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${cloudEnabled ? 'text-white' : 'text-rose-900'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cloudEnabled ? 'text-white' : 'text-rose-400'}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
               {cloudEnabled ? 'Luna Private Cloud' : 'Private Cloud Sync'}
            </h3>
            {!cloudEnabled && (
              <button onClick={() => setShowCloudSetup(!showCloudSetup)} className="text-[10px] font-bold text-rose-300 uppercase tracking-widest hover:text-rose-500 transition-colors">
                {showCloudSetup ? 'Hide Setup' : 'Setup Guide'}
              </button>
            )}
          </div>

          {showCloudSetup && !cloudEnabled && (
            <div className="mb-6 space-y-4 p-5 bg-rose-50/50 rounded-2xl border border-rose-100 animate-in slide-in-from-top-2">
              <p className="text-[11px] text-rose-800 leading-relaxed">
                To sync, you need a <strong>Google OAuth Client ID</strong> authorized for this domain. 
                <br/><br/>
                1. Go to <a href="https://console.cloud.google.com/" target="_blank" className="underline font-bold">Google Cloud Console</a>.
                <br/>
                2. Create a Project & 'OAuth Client ID' (Web App).
                <br/>
                3. Add <code className="bg-white px-1 rounded">{window.location.origin}</code> to 'Authorized JavaScript Origins'.
              </p>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-rose-300 uppercase tracking-widest">Your Client ID</label>
                <input 
                  type="text" 
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder="...apps.googleusercontent.com"
                  className="w-full bg-white border border-rose-100 rounded-xl px-3 py-2 text-[10px] font-medium outline-none"
                />
                <button onClick={saveClientId} className="text-[10px] font-bold text-rose-500 underline">Save Client ID</button>
              </div>
            </div>
          )}

          <p className={`text-xs leading-relaxed mb-6 ${cloudEnabled ? 'text-indigo-100' : 'text-gray-500'}`}>
            {cloudEnabled 
              ? "Luna is automatically backing up every change to your hidden Google Drive vault." 
              : "Sync your data silently across devices using your own Google account. No third-party servers."}
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
