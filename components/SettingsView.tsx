
import React, { useState } from 'react';
import { UserData } from '../types';
import { GoogleGenAI } from "@google/genai";
import { SyncService } from '../services/syncService';

interface SettingsViewProps {
  userData: UserData;
  onImport: (data: UserData) => void;
  isSyncActive: boolean;
  onEnableSync: () => void;
  onUpdateLock: (method: 'pin' | 'google' | undefined, value?: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ userData, onImport, isSyncActive, onEnableSync, onUpdateLock }) => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formattedData, setFormattedData] = useState<string | null>(null);
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

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.logs && json.symptoms) {
          onImport(json);
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const formatForNotion = async () => {
    setIsFormatting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Convert the following menstrual cycle data into a beautiful Markdown table and summary for Notion. 
    Data: ${JSON.stringify({ logs: userData.logs, symptoms: userData.symptoms })}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setFormattedData(response.text || "Failed to format.");
    } catch (error) {
      setFormattedData("Error connecting to AI for formatting.");
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Privacy Lock
        </h3>
        <p className="text-sm text-gray-500 mb-6">Secure your sensitive data locally on this device.</p>
        <div className="space-y-4">
          <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-3">Lock with PIN</p>
            {userData.settings.lockMethod === 'pin' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <p className="font-bold text-gray-800">PIN Protection Active</p>
                </div>
                <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-rose-500 px-4 py-2 hover:bg-rose-100 rounded-xl transition-colors">Disable</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="password" maxLength={4} placeholder="Set 4-digit PIN" value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3 text-center text-2xl focus:ring-2 focus:ring-rose-200 outline-none font-bold text-rose-900"
                />
                <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all squishy">Activate</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9"/><path d="M3 12a9 9 0 0 0 9 9"/></svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          Live Private Sync
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Create a link to your own cloud folder. Pick a file inside your <strong>iCloud, Dropbox, or Google Drive</strong> folder. Luna will automatically sync changes to that file so your data stays private and synced across your devices.
        </p>
        
        <div className={`p-6 rounded-[2rem] border transition-all ${isSyncActive ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          {isSyncActive ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Successfully Connected</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Auto-syncing to your chosen file</p>
                </div>
              </div>
              <button onClick={onEnableSync} className="text-xs font-bold text-emerald-500 hover:text-emerald-700 underline text-left">Switch Sync File</button>
            </div>
          ) : (
            <button 
              onClick={onEnableSync} 
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all squishy flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Establish Live Sync Connection
            </button>
          )}
        </div>
      </section>

      <section className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 7v5l3 3"/></svg>
        </div>
        <h3 className="text-xl font-bold mb-2">AI Health Formatter</h3>
        <p className="text-indigo-200 text-sm mb-6">Convert your cycle history into a beautiful report for Notion or your doctor.</p>
        {!formattedData ? (
          <button onClick={formatForNotion} disabled={isFormatting} className="w-full py-4 bg-indigo-500 rounded-2xl font-bold shadow-lg shadow-indigo-950/50 hover:bg-indigo-400 transition-all squishy">
            {isFormatting ? 'Consulting Gemini...' : 'Generate AI Summary'}
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-indigo-950/50 p-6 rounded-2xl text-xs text-indigo-100 whitespace-pre-wrap max-h-60 overflow-y-auto border border-indigo-800">
              {formattedData}
            </div>
            <div className="flex gap-2">
              <button onClick={() => {navigator.clipboard.writeText(formattedData); alert('Copied!');}} className="flex-1 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors">Copy Report</button>
              <button onClick={() => setFormattedData(null)} className="px-6 py-3 bg-indigo-800 text-white rounded-xl font-bold">Reset</button>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Manual Backup</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between p-5 bg-rose-50/50 rounded-2xl cursor-pointer hover:bg-rose-100 transition-all border border-rose-100 border-dashed">
            <div>
              <span className="text-sm font-bold text-rose-900 block">Restore from Backup</span>
              <span className="text-[10px] text-rose-400 uppercase font-bold tracking-widest">Upload your .json file</span>
            </div>
            <input type="file" className="hidden" onChange={handleImport} accept=".json" />
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-400 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
