
import React, { useState } from 'react';
import { UserData } from '../types';
import { GoogleGenAI } from "@google/genai";

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
    const prompt = `Format this cycle data into a beautiful Markdown table for Notion: ${JSON.stringify({ logs: userData.logs, symptoms: userData.symptoms })}`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setFormattedData(response.text || "Failed to format.");
    } catch (error) {
      setFormattedData("Error connecting to AI.");
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 relative overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          Live Private Sync
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Luna uses <strong>local-first</strong> technology. Pick a file inside your <strong>iCloud/Dropbox</strong> folder to enable live sync without our servers seeing your data.
        </p>
        
        <div className={`p-6 rounded-[2rem] border transition-all ${isSyncActive ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          {isSyncActive ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Successfully Linked</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Changes are auto-saved</p>
                </div>
              </div>
              <div className="bg-white/50 p-4 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-bold uppercase mb-1">Privacy Refresh Info</p>
                <p className="text-[11px] text-emerald-600 leading-tight">Browsers forget file links when you refresh for security. If you refresh, just tap "Establish Connection" and pick your file again.</p>
              </div>
            </div>
          ) : (
            <button 
              onClick={onEnableSync} 
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition-all squishy flex items-center justify-center gap-3"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              Establish Connection
            </button>
          )}
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Privacy Lock
        </h3>
        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 mt-4">
          <p className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-3">4-Digit PIN</p>
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
              <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold">Set</button>
            </div>
          )}
        </div>
      </section>

      <section className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl text-white">
        <h3 className="text-xl font-bold mb-4">AI Notion Export</h3>
        {!formattedData ? (
          <button onClick={formatForNotion} disabled={isFormatting} className="w-full py-4 bg-indigo-500 rounded-2xl font-bold shadow-lg hover:bg-indigo-400 transition-all squishy">
            {isFormatting ? 'Formatting...' : 'Generate Notion Summary'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-950/50 p-4 rounded-2xl text-[10px] text-indigo-100 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {formattedData}
            </div>
            <button onClick={() => {navigator.clipboard.writeText(formattedData); alert('Copied!');}} className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold">Copy</button>
          </div>
        )}
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Manual Backup</h3>
        <label className="flex items-center justify-between p-5 bg-rose-50/50 rounded-2xl cursor-pointer hover:bg-rose-100 transition-all border border-rose-100 border-dashed">
          <span className="text-sm font-bold text-rose-900">Restore .json file</span>
          <input type="file" className="hidden" onChange={handleImport} accept=".json" />
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/></svg>
        </label>
      </section>
    </div>
  );
};

export default SettingsView;
