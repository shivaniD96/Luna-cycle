
import React, { useState } from 'react';
import { UserData, AIProvider } from '../types';
import { GoogleGenAI } from "@google/genai";

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
      setFormattedData("Error connecting to AI. Try again later.");
    } finally {
      setIsFormatting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* AI BRAIN SELECTION */}
      <section className="bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm">🧠</span>
          Brain Selection
        </h3>
        
        <div className="flex bg-indigo-950/50 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => onUpdateSettings({ aiProvider: 'gemini' })}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${userData.settings.aiProvider === 'gemini' ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-300'}`}
          >
            Gemini Flash
          </button>
          <button 
            onClick={() => onUpdateSettings({ aiProvider: 'grok' })}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${userData.settings.aiProvider === 'grok' ? 'bg-white text-indigo-900 shadow-lg' : 'text-indigo-300'}`}
          >
            Grok / Custom
          </button>
        </div>

        {userData.settings.aiProvider === 'grok' ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-indigo-200 text-xs px-2 leading-relaxed">
              Enter your <strong>Grok (xAI)</strong> or OpenAI-compatible key below. This is great for bypassing free-tier limits.
            </p>
            <input 
              type="password"
              placeholder="xai-xxxxxxxxxxxx"
              value={userData.settings.customApiKey || ''}
              onChange={(e) => onUpdateSettings({ customApiKey: e.target.value })}
              className="w-full bg-indigo-950/50 border border-indigo-700 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-indigo-700"
            />
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <p className="text-indigo-200 text-xs px-2 leading-relaxed">
              Using Google's most efficient model. If you hit rate limits, switch to Grok or connect your personal Google key.
            </p>
            <button 
              // @ts-ignore
              onClick={async () => { await window.aistudio.openSelectKey(); alert('Personal key linked!'); }}
              className="w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-all"
            >
              Scale Personal Gemini Quota
            </button>
          </div>
        )}
      </section>

      {/* SYNC SECTION */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-emerald-100 relative overflow-hidden">
        <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          Private Cloud Sync
        </h3>
        <div className={`p-6 rounded-[2rem] border transition-all mt-4 ${isSyncActive ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
          {isSyncActive ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <p className="font-bold text-emerald-900">Actively Linked</p>
            </div>
          ) : (
            <button onClick={onEnableSync} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-3">
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
              <button onClick={handleSetPin} className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold">Set</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
