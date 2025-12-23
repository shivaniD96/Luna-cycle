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
        <p className="text-sm text-gray-500 mb-6">Secure your sensitive data locally.</p>
        <div className="space-y-4">
          <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
            <p className="text-xs font-bold text-rose-300 uppercase tracking-widest mb-3">Privacy PIN</p>
            {userData.settings.lockMethod === 'pin' ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <p className="font-bold text-gray-800">PIN Active</p>
                </div>
                <button onClick={() => onUpdateLock(undefined)} className="text-sm font-bold text-rose-500">Disable</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input 
                  type="password" maxLength={4} placeholder="Set 4-digit PIN" value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 bg-white border border-rose-100 rounded-xl px-4 py-3 text-center text-2xl focus:ring-2 focus:ring-rose-200 outline-none"
                />
                <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold">Set</button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 relative">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M21 12a9 9 0 0 0-9-9"/><path d="M3 12a9 9 0 0 0 9 9"/></svg>
          Live Cloud Sync
        </h3>
        <p className="text-sm text-gray-500 mb-6">Auto-save directly to a file in your personal Cloud folder.</p>
        <button onClick={onEnableSync} className={`w-full py-4 rounded-2xl font-bold shadow-md ${isSyncActive ? 'bg-white text-emerald-600 border border-emerald-200' : 'bg-emerald-600 text-white'}`}>
          {isSyncActive ? 'Change Sync File' : 'Enable Live Sync'}
        </button>
      </section>

      <section className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl text-white">
        <h3 className="text-xl font-bold mb-2">AI Formatter</h3>
        <p className="text-indigo-200 text-sm mb-6">Generate a clean Markdown report for your health records.</p>
        {!formattedData ? (
          <button onClick={formatForNotion} disabled={isFormatting} className="w-full py-4 bg-indigo-500 rounded-2xl font-bold">
            {isFormatting ? 'Processing...' : 'Generate Notion-Ready Report'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-950/50 p-4 rounded-2xl text-xs text-indigo-100 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {formattedData}
            </div>
            <button onClick={() => {navigator.clipboard.writeText(formattedData); alert('Copied!');}} className="w-full py-3 bg-white text-indigo-900 rounded-xl font-bold">Copy to Clipboard</button>
          </div>
        )}
      </section>

      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-rose-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Data Management</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl cursor-pointer hover:bg-rose-100 transition-colors">
            <span className="text-sm font-bold text-rose-500">Restore from Backup</span>
            <input type="file" className="hidden" onChange={handleImport} accept=".json" />
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
          </label>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;