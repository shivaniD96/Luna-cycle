
import React, { useState } from 'react';
import { UserData } from '../types';

interface SettingsViewProps {
  userData: UserData;
  onImport: (data: UserData) => void;
  isSyncActive: boolean;
  onEnableSync: () => void;
  onUpdateLock: (method: 'pin' | 'google' | undefined, value?: string) => void;
  onUpdateSettings: (settings: Partial<UserData['settings']>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  userData, onImport, isSyncActive, onEnableSync, onUpdateLock, onUpdateSettings 
}) => {
  const [pinInput, setPinInput] = useState('');

  const handleSetPin = () => {
    if (pinInput.length === 4) {
      onUpdateLock('pin', pinInput);
      setPinInput('');
      alert('Privacy PIN set successfully!');
    } else {
      alert('PIN must be exactly 4 digits.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* CYCLE SETTINGS */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14v-4"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 12 2 2"/><path d="m5 12 2-2"/></svg>
          Cycle Baseline
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-2">Average Cycle Length</label>
            <input 
              type="number"
              value={userData.settings.averageCycleLength}
              onChange={(e) => onUpdateSettings({ averageCycleLength: parseInt(e.target.value) || 28 })}
              className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl px-4 py-3 font-bold text-rose-900 outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest mb-2">Average Period Duration</label>
            <input 
              type="number"
              value={userData.settings.averagePeriodLength}
              onChange={(e) => onUpdateSettings({ averagePeriodLength: parseInt(e.target.value) || 5 })}
              className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl px-4 py-3 font-bold text-rose-900 outline-none"
            />
          </div>
        </div>
      </section>

      {/* SYNC SECTION */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 relative overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          Private Cloud Sync
        </h3>
        <p className="text-xs text-gray-400 mb-4 px-1">Link a local folder to keep your data backed up and private.</p>
        <div className={`p-6 rounded-[2rem] border transition-all ${isSyncActive ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          {isSyncActive ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <p className="font-bold text-emerald-900">Actively Linked</p>
            </div>
          ) : (
            <button onClick={onEnableSync} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3 squishy">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Resume Connection
            </button>
          )}
        </div>
      </section>

      {/* PRIVACY LOCK */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Privacy Lock
        </h3>
        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 mt-4">
          {userData.settings.lockMethod === 'pin' ? (
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-800">PIN Active ✓</p>
              <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-rose-500">Disable</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input 
                type="password" maxLength={4} placeholder="Set PIN" value={pinInput}
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
